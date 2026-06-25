'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

export default function CheckoutPage() {
  const { cartItems, cartSubtotal, cartCount, isHydrated } = useCart();
  const { user } = useAuth();
  const [isGuest, setIsGuest] = useState(true);
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [address, setAddress] = useState('');
  const [apartment, setApartment] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [phone, setPhone] = useState('');
  
  // Payment States
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi'>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [upiId, setUpiId] = useState('');

  // Discount Codes
  const [discountCode, setDiscountCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(0); // 0 or percentage (e.g. 10)
  const [discountError, setDiscountError] = useState('');
  const [discountSuccess, setDiscountSuccess] = useState('');

  // Checkout Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);

  // Set up mock order completion timer
  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      alert('Please enter your email address.');
      return;
    }
    if (!firstName || !lastName || !address || !city || !stateName || !zipCode || !phone) {
      alert('Please fill out all shipping fields.');
      return;
    }
    if (paymentMethod === 'card' && (!cardNumber || !cardExpiry || !cardCvv || !cardName)) {
      alert('Please fill out all card details.');
      return;
    }
    if (paymentMethod === 'upi' && !upiId) {
      alert('Please enter your UPI ID.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Generate a unique order number
      const orderNumber = `STK-ORD-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

      // Submit order via backend API to bypass RLS policies and handle email linking safely
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderData: {
            order_number: orderNumber,
            user_id: user?.id || null, // Will be linked on the server if email matches
            subtotal: cartSubtotal,
            shipping_cost: 0,
            tax: gstAmount,
            discount_amount: discountAmount,
            total: grandTotal,
            payment_method: paymentMethod,
            payment_status: 'paid',
            fulfillment_status: 'pending',
            shipping_address: {
              first_name: firstName,
              last_name: lastName,
              address_line1: address,
              address_line2: apartment || null,
              city: city,
              state: stateName,
              postal_code: zipCode,
              phone: phone,
              email: email
            },
            coupon_id: null,
            status: 'pending'
          },
          cartItems: cartItems
        })
      });

      const result = await response.json();
      if (!response.ok || result.error) {
        throw new Error(result.error || 'Failed to submit order');
      }

      setIsSubmitting(false);
      setOrderComplete(true);
      localStorage.removeItem('stoky_cart');
    } catch (err: any) {
      console.error('Order creation error:', err);
      alert(err.message || 'An unexpected error occurred while placing your order.');
      setIsSubmitting(false);
    }
  };

  const handleApplyDiscount = () => {
    setDiscountError('');
    setDiscountSuccess('');
    if (discountCode.toUpperCase() === 'STOKY10' || discountCode.toUpperCase() === 'WELCOME10') {
      setAppliedDiscount(10);
      setDiscountSuccess('10% discount applied successfully!');
    } else {
      setDiscountError('Invalid coupon code. Try STOKY10');
    }
  };

  // Math Calculations
  const discountAmount = Math.round((cartSubtotal * appliedDiscount) / 100);
  const taxableAmount = cartSubtotal - discountAmount;
  const gstAmount = Math.round(taxableAmount * 0.18); // 18% GST
  const grandTotal = taxableAmount + gstAmount;

  // Format currency helper
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Prevent flash or SSR hydration issues
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neutral-200 border-t-neutral-800 rounded-full animate-spin" />
      </div>
    );
  }

  if (orderComplete) {
    return (
      <div className="min-h-screen bg-[#fafafa] text-neutral-900 flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md bg-white border border-neutral-200 p-8 shadow-sm space-y-6">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.0} stroke="currentColor" className="w-8 h-8 text-emerald-600">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold uppercase tracking-widest text-neutral-900">Order Confirmed!</h1>
            <p className="text-sm text-neutral-500 font-light leading-relaxed">
              Thank you for shopping with STOKY2. We have sent a confirmation email to <span className="font-semibold text-neutral-800">{email}</span>. Your order will be processed shortly.
            </p>
          </div>
          <div className="border-t border-neutral-100 pt-5 flex flex-col gap-2">
            <Link
              href="/"
              className="bg-neutral-900 hover:bg-black text-white py-3 text-xs font-bold uppercase tracking-[0.2em] transition-colors inline-block w-full"
            >
              Return to Shop
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-[#fafafa] text-neutral-900 flex flex-col items-center justify-center p-6 text-center">
        <div className="space-y-4 max-w-sm">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.2} stroke="currentColor" className="w-12 h-12 text-neutral-300 mx-auto">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.263-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5h6.75" />
          </svg>
          <div className="space-y-1">
            <h1 className="text-xs uppercase font-bold tracking-widest text-neutral-800">Your checkout is empty</h1>
            <p className="text-xs text-neutral-400 font-light">Add premium essentials to cart before proceeding.</p>
          </div>
          <Link
            href="/"
            className="bg-neutral-900 hover:bg-black text-white py-3 px-6 text-xs font-bold uppercase tracking-wider transition-colors inline-block"
          >
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa] text-neutral-900 font-sans selection:bg-neutral-200">
      {/* Header */}
      <header className="border-b border-neutral-200 bg-white py-5 px-6 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="text-lg font-black uppercase tracking-[0.25em] text-neutral-900">
            STOKY2
          </Link>
          <Link href="/" className="text-xs tracking-wider text-neutral-500 hover:text-black transition-colors underline underline-offset-4">
            Back to Shop
          </Link>
        </div>
      </header>

      {/* Main Checkout Area */}
      <main className="max-w-7xl mx-auto w-full px-6 py-10 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          {/* Left Column 60% */}
          <div className="lg:col-span-7 space-y-8">
            <form onSubmit={handlePayment} className="space-y-8">
              {/* CONTACT SECTION */}
              <div className="bg-white border border-neutral-200/80 p-6 shadow-xs space-y-4">
                <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-900">Contact Information</h2>
                  <label htmlFor="guestToggle" className="flex items-center gap-2 cursor-pointer min-h-[44px]">
                    <input
                      type="checkbox"
                      id="guestToggle"
                      checked={isGuest}
                      onChange={(e) => setIsGuest(e.target.checked)}
                      className="w-5 h-5 border border-neutral-300 accent-neutral-900 rounded-sm cursor-pointer"
                    />
                    <span className="text-sm text-neutral-500 font-normal select-none">
                      Checkout as Guest
                    </span>
                  </label>
                </div>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-sm font-semibold uppercase tracking-wider text-neutral-400 block">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="your@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-200 text-base px-3.5 py-3.5 focus:outline-none focus:border-neutral-900 focus:bg-white transition-colors"
                    />
                  </div>
                  {!isGuest && (
                    <div className="text-[11px] text-neutral-400 font-light bg-neutral-50 p-2.5 border border-neutral-100">
                      🔐 Creating an account will automatically save your address. Password setup email will be sent after payment.
                    </div>
                  )}
                </div>
              </div>

              {/* SHIPPING DETAILS SECTION */}
              <div className="bg-white border border-neutral-200/80 p-6 shadow-xs space-y-5">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-900 border-b border-neutral-100 pb-3">Delivery Address</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-semibold uppercase tracking-wider text-neutral-400 block">First Name</label>
                    <input
                      type="text"
                      required
                      placeholder="John"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-200 text-base px-3.5 py-3.5 focus:outline-none focus:border-neutral-900 focus:bg-white transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold uppercase tracking-wider text-neutral-400 block">Last Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Doe"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-200 text-base px-3.5 py-3.5 focus:outline-none focus:border-neutral-900 focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold uppercase tracking-wider text-neutral-400 block">Address Line 1</label>
                  <input
                    type="text"
                    required
                    placeholder="123 Main Street"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 text-base px-3.5 py-3.5 focus:outline-none focus:border-neutral-900 focus:bg-white transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold uppercase tracking-wider text-neutral-400 block">Apartment, Suite, Unit (Optional)</label>
                  <input
                    type="text"
                    placeholder="Apt 4B"
                    value={apartment}
                    onChange={(e) => setApartment(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 text-base px-3.5 py-3.5 focus:outline-none focus:border-neutral-900 focus:bg-white transition-colors"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-semibold uppercase tracking-wider text-neutral-400 block">City</label>
                    <input
                      type="text"
                      required
                      placeholder="Mumbai"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-200 text-base px-3.5 py-3.5 focus:outline-none focus:border-neutral-900 focus:bg-white transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold uppercase tracking-wider text-neutral-400 block">State</label>
                    <input
                      type="text"
                      required
                      placeholder="Maharashtra"
                      value={stateName}
                      onChange={(e) => setStateName(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-200 text-base px-3.5 py-3.5 focus:outline-none focus:border-neutral-900 focus:bg-white transition-colors"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold uppercase tracking-wider text-neutral-400 block">PIN Code</label>
                    <input
                      type="text"
                      required
                      placeholder="400001"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      className="w-full bg-neutral-50 border border-neutral-200 text-base px-3.5 py-3.5 focus:outline-none focus:border-neutral-900 focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-semibold uppercase tracking-wider text-neutral-400 block">Phone Number</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 text-base px-3.5 py-3.5 focus:outline-none focus:border-neutral-900 focus:bg-white transition-colors"
                  />
                </div>

                {/* Delivery Option Panel with green estimate text */}
                <div className="mt-6 space-y-3">
                  <label className="text-[10px] md:text-xs font-bold uppercase tracking-wider text-neutral-400 block">Shipping Method</label>
                  <div className="border border-neutral-200 bg-neutral-50 p-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full border-4 border-neutral-950 flex-none" />
                      <div>
                        <p className="text-xs font-bold text-neutral-950">Standard Delivery</p>
                        <p className="text-[11px] text-emerald-600 font-bold mt-0.5">
                          Free Standard Shipping — Arrives Friday, Jun 26 (2-3 business days)
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-900">FREE</span>
                  </div>
                </div>
              </div>

              {/* PAYMENT SECTION WITH RAZORPAY SELECTORS */}
              <div className="bg-white border border-neutral-200/80 p-6 shadow-xs space-y-5">
                <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-900">Payment Methods</h2>
                  <span className="text-sm uppercase font-bold tracking-widest text-neutral-400">RazorPay Secure</span>
                </div>

                {/* Tab Selector - 44px touch target height & 14px font */}
                <div className="flex border border-neutral-200 rounded-none overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`flex-1 h-12 flex items-center justify-center text-sm uppercase tracking-wider font-bold transition-all ${
                      paymentMethod === 'card' ? 'bg-neutral-900 text-white' : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-500'
                    }`}
                  >
                    💳 Card
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('upi')}
                    className={`flex-1 h-12 flex items-center justify-center text-sm uppercase tracking-wider font-bold transition-all ${
                      paymentMethod === 'upi' ? 'bg-neutral-900 text-white' : 'bg-neutral-50 hover:bg-neutral-100 text-neutral-500'
                    }`}
                  >
                    ⚡ UPI
                  </button>
                </div>

                {/* Card Payment Subform */}
                {paymentMethod === 'card' && (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-sm font-semibold uppercase tracking-wider text-neutral-400 block">Card Number</label>
                      <input
                        type="text"
                        placeholder="4111 2222 3333 4444"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full bg-neutral-50 border border-neutral-200 text-base px-3.5 py-3.5 focus:outline-none focus:border-neutral-900 focus:bg-white transition-colors"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-sm font-semibold uppercase tracking-wider text-neutral-400 block">Expiry Date</label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          className="w-full bg-neutral-50 border border-neutral-200 text-base px-3.5 py-3.5 focus:outline-none focus:border-neutral-900 focus:bg-white transition-colors"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-semibold uppercase tracking-wider text-neutral-400 block">CVV</label>
                        <input
                          type="password"
                          maxLength={3}
                          placeholder="123"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          className="w-full bg-neutral-50 border border-neutral-200 text-base px-3.5 py-3.5 focus:outline-none focus:border-neutral-900 focus:bg-white transition-colors"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-sm font-semibold uppercase tracking-wider text-neutral-400 block">Cardholder Name</label>
                      <input
                        type="text"
                        placeholder="John Doe"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        className="w-full bg-neutral-50 border border-neutral-200 text-base px-3.5 py-3.5 focus:outline-none focus:border-neutral-900 focus:bg-white transition-colors"
                      />
                    </div>
                  </div>
                )}

                {/* UPI Payment Subform */}
                {paymentMethod === 'upi' && (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-sm font-semibold uppercase tracking-wider text-neutral-400 block">UPI ID / VPA</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="username@okaxis"
                          value={upiId}
                          onChange={(e) => setUpiId(e.target.value)}
                          className="w-full bg-neutral-50 border border-neutral-200 text-base px-3.5 py-3.5 focus:outline-none focus:border-neutral-900 focus:bg-white transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => alert(upiId ? `UPI ID "${upiId}" verified ✅` : 'Please enter your UPI ID first.')}
                          className="bg-neutral-900 hover:bg-black text-white text-sm font-bold uppercase tracking-wider px-5 transition-colors shrink-0 h-12 flex items-center justify-center cursor-pointer"
                        >
                          Verify
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-neutral-400 font-light leading-normal">
                      Note: A request will be sent to your UPI app. Please approve the payment block within 5 minutes.
                    </p>
                  </div>
                )}
              </div>

              {/* SUBMISSION BUTTON */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-black text-white hover:bg-neutral-900 transition-colors h-12 text-sm font-bold tracking-[0.08em] uppercase flex items-center justify-center gap-2 rounded-none cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing Payment...
                  </>
                ) : (
                  `Pay and Complete Order (${formatCurrency(grandTotal)})`
                )}
              </button>
            </form>
          </div>

          {/* Right Column 40% — Order Summary Sidebar */}
          <div className="lg:col-span-5 border-t lg:border-t-0 lg:border-l border-neutral-200 pt-8 lg:pt-0 lg:pl-10 space-y-6">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-900 border-b border-neutral-100 pb-3">Order Summary</h2>

            {/* Cart Items List */}
            <div className="space-y-4 divide-y divide-neutral-100 max-h-[360px] overflow-y-auto pr-2">
              {cartItems.map((item, idx) => (
                <div key={item.id} className={`flex gap-4 ${idx > 0 ? 'pt-4' : ''}`}>
                  <div className="relative w-14 aspect-[3/4] overflow-hidden bg-neutral-50 border border-neutral-100 flex-none">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                    <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-neutral-900 text-white text-[9px] font-bold rounded-full flex items-center justify-center tracking-tighter shadow-sm border border-white">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-1 flex flex-col justify-between text-xs py-0.5">
                    <div>
                      <h3 className="text-[13px] font-medium tracking-tight text-neutral-800 uppercase truncate">{item.name}</h3>
                      <p className="text-[10px] text-neutral-400 font-light mt-0.5">
                        Size: {item.size} &nbsp;|&nbsp; Color: {item.color}
                      </p>
                    </div>
                    <span className="text-base font-semibold text-neutral-800">{item.price}</span>
                  </div>
                </div>
              ))}
            </div>

            <hr className="border-neutral-200" />

            {/* Coupon Code Input */}
            <div className="space-y-2">
              <label className="text-sm font-semibold uppercase tracking-wider text-neutral-400 block">Promo Code</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. STOKY10"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  className="w-full bg-white border border-neutral-200 text-base px-3.5 py-3.5 focus:outline-none focus:border-neutral-900"
                />
                <button
                  type="button"
                  onClick={handleApplyDiscount}
                  className="bg-neutral-800 hover:bg-black text-white text-sm font-bold uppercase tracking-wider px-5 transition-colors h-12 flex items-center justify-center shrink-0"
                >
                  Apply
                </button>
              </div>
              {discountError && <p className="text-xs text-rose-500 font-bold">{discountError}</p>}
              {discountSuccess && <p className="text-xs text-emerald-600 font-bold">{discountSuccess}</p>}
            </div>

            <hr className="border-neutral-200" />

            {/* Calculations Breakdown */}
            <div className="space-y-3 text-xs font-light text-neutral-500">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="text-base font-semibold text-neutral-900">{formatCurrency(cartSubtotal)}</span>
              </div>
              {appliedDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Discount ({appliedDiscount}%)</span>
                  <span>-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="text-sm font-semibold text-neutral-900 uppercase tracking-wider">FREE</span>
              </div>
              <div className="flex justify-between">
                <span>GST (18%)</span>
                <span className="text-base font-semibold text-neutral-900">{formatCurrency(gstAmount)}</span>
              </div>
              <hr className="border-neutral-100" />
              <div className="flex justify-between text-base font-semibold text-neutral-900">
                <span className="uppercase tracking-[0.06em]">Total</span>
                <span>{formatCurrency(grandTotal)}</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Security Badge Strip at bottom - 14px min text font */}
      <footer className="border-t border-neutral-200 bg-white py-12 px-6">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-center items-center gap-8 md:gap-16 text-center">
          <div className="flex flex-col items-center space-y-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-neutral-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
            <div>
              <p className="text-sm font-bold tracking-[0.06em] uppercase text-neutral-900">Secure 256-Bit SSL</p>
              <p className="text-sm text-neutral-400 font-light mt-0.5">Your personal data is fully encrypted and protected.</p>
            </div>
          </div>

          <div className="flex flex-col items-center space-y-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-neutral-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z" />
            </svg>
            <div>
              <p className="text-sm font-bold tracking-[0.06em] uppercase text-neutral-900">RazorPay Verified</p>
              <p className="text-sm text-neutral-400 font-light mt-0.5">Secure payments via India&apos;s trusted billing gateway.</p>
            </div>
          </div>

          <div className="flex flex-col items-center space-y-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-neutral-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 0 0-3.7-3.7 48.656 48.656 0 0 0-7.324 0 4.006 4.006 0 0 0-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3-3-3M3 12c0 1.232.046 2.453.138 3.662a4.006 4.006 0 0 0 3.7 3.7 48.656 48.656 0 0 0 7.324 0 4.006 4.006 0 0 0 3.7-3.7c.017-.22.032-.441.046-.662M3 12l-3 3m3-3 3 3" />
            </svg>
            <div>
              <p className="text-sm font-bold tracking-[0.06em] uppercase text-neutral-900">30-Day Returns</p>
              <p className="text-sm text-neutral-400 font-light mt-0.5">Return unworn, unwashed products with no hassle.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
