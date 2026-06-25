import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Get the env variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function POST(request: Request) {
  try {
    // Check if the service key is set
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase URL or Service Role Key is not configured on the server.');
    }

    // Initialize Supabase admin client to bypass RLS policies
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
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
      const { data: matchedProfile, error: profileErr } = await supabaseAdmin
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
    const { data: insertedOrder, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert(orderData)
      .select()
      .single();

    if (orderError || !insertedOrder) {
      return NextResponse.json({ error: `Failed to insert order record: ${orderError?.message || 'Unknown error'}` }, { status: 500 });
    }

    // Insert order items
    const itemsToInsert = [];
    for (const item of cartItems) {
      // Find product_id by slug
      const { data: prodData, error: prodErr } = await supabaseAdmin
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

    const { error: itemsError } = await supabaseAdmin
      .from('order_items')
      .insert(itemsToInsert);

    if (itemsError) {
      console.error(`Failed to insert order items: ${itemsError.message}. Rolling back order.`);
      // Rollback order
      await supabaseAdmin
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
