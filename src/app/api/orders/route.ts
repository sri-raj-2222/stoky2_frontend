import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Get the env variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export async function POST(request: Request) {
  try {
    const keyToUse = supabaseServiceKey || supabaseAnonKey;

    // Check if configuration is set
    if (!supabaseUrl || !keyToUse) {
      throw new Error('Supabase URL or API Key is not configured on the server.');
    }

    const isUsingAnonKey = !supabaseServiceKey && !!supabaseAnonKey;
    if (isUsingAnonKey) {
      console.warn('SUPABASE_SERVICE_ROLE_KEY is not defined. Falling back to NEXT_PUBLIC_SUPABASE_ANON_KEY on the server.');
    }

    // Initialize Supabase client
    const supabaseClient = createClient(supabaseUrl, keyToUse, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    });

    const body = await request.json();
    const { orderData, cartItems } = body;

    if (!orderData || !cartItems || !Array.isArray(cartItems)) {
      return NextResponse.json({ error: 'Missing required order details or cart items.' }, { status: 400 });
    }

    // Determine the user_id to link
    let activeUserId = orderData.user_id;

    // Fulfill Requirement 9: Link order to registered user if checkout email matches
    const checkoutEmail = orderData.shipping_address?.email;
    if (checkoutEmail) {
      const emailLower = checkoutEmail.trim().toLowerCase();
      // Look up existing profile with this email
      const { data: matchedProfile, error: profileErr } = await supabaseClient
        .from('profiles')
        .select('id')
        .eq('email', emailLower)
        .maybeSingle();

      if (profileErr) {
        console.error('Error looking up profile by email:', profileErr.message);
      } else if (matchedProfile) {
        console.log(`Matched checkout email ${emailLower} to profile ID: ${matchedProfile.id}`);
        activeUserId = matchedProfile.id;
      }
    }

    // Update orderData with correct user_id
    orderData.user_id = activeUserId;

    // Insert order details
    let { data: insertedOrder, error: orderError } = await supabaseClient
      .from('orders')
      .insert(orderData)
      .select()
      .single();

    // Fallback if RLS blocks insertion under the existing/registered user's ID
    if (orderError && orderError.message.toLowerCase().includes('row-level security') && orderData.user_id !== null) {
      console.warn("RLS policy blocked linking order to registered user. Falling back to guest checkout with user_id = null...");
      orderData.user_id = null;
      const { data: fallbackData, error: fallbackError } = await supabaseClient
        .from('orders')
        .insert(orderData)
        .select()
        .single();
      insertedOrder = fallbackData;
      orderError = fallbackError;
    }

    if (orderError || !insertedOrder) {
      return NextResponse.json({ error: `Failed to insert order record: ${orderError?.message || 'Unknown error'}` }, { status: 500 });
    }

    // Insert order items
    const itemsToInsert = [];
    for (const item of cartItems) {
      // Find product_id by slug
      const { data: prodData, error: prodErr } = await supabaseClient
        .from('products')
        .select('id')
        .eq('slug', item.slug)
        .maybeSingle();

      if (prodErr) {
        console.warn(`Product lookup failed for slug ${item.slug}:`, prodErr.message);
      }

      const cleanPrice = typeof item.price === 'string'
        ? (parseFloat(item.price.replace(/[^\d.]/g, '')) || 0)
        : (parseFloat(item.price) || 0);

      itemsToInsert.push({
        order_id: insertedOrder.id,
        product_id: prodData?.id || null,
        product_name: item.name,
        product_image: item.image,
        variant: { color: item.color, size: item.size },
        quantity: item.quantity,
        price: cleanPrice
      });
    }

    const { error: itemsError } = await supabaseClient
      .from('order_items')
      .insert(itemsToInsert);

    if (itemsError) {
      console.error(`Failed to insert order items: ${itemsError.message}. Rolling back order.`);
      // Rollback order
      await supabaseClient
        .from('orders')
        .delete()
        .eq('id', insertedOrder.id);

      return NextResponse.json({ error: `Failed to save order items: ${itemsError.message}` }, { status: 500 });
    }

    return NextResponse.json({ success: true, order: insertedOrder }, { status: 200 });
  } catch (err: any) {
    console.error('Order creation endpoint error:', err);
    return NextResponse.json({ error: err.message || 'An unexpected error occurred while saving the order.' }, { status: 500 });
  }
}
