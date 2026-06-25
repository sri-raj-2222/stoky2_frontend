'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';

export default function CartDrawer() {
  const {
    cartItems,
    isCartOpen,
    closeCart,
    updateQuantity,
    removeFromCart,
    cartSubtotal,
    cartCount,
  } = useCart();

  const drawerRef = useRef<HTMLDivElement>(null);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isCartOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCartOpen) {
        closeCart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCartOpen, closeCart]);

  // Click outside drawer to close
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (drawerRef.current && !drawerRef.current.contains(e.target as Node)) {
      closeCart();
    }
  };

  // Klarna dynamic installments calculation
  const klarnaInstallment = Math.round(cartSubtotal / 3);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div
      onClick={handleBackdropClick}
      className={`fixed inset-0 z-50 transition-all duration-300 ease-in-out ${
        isCartOpen ? 'visible bg-black/60 backdrop-blur-xs' : 'invisible bg-black/0 pointer-events-none'
      }`}
    >
      {/* Drawer panel */}
      <div
        ref={drawerRef}
        className={`fixed top-0 right-0 h-full w-full sm:w-[380px] bg-white text-neutral-900 border-l border-neutral-200/80 shadow-2xl flex flex-col transition-transform duration-300 ease-out transform ${
          isCartOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-neutral-100">
          <div className="flex items-baseline gap-2">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-neutral-900">Your Cart</h2>
            {cartCount > 0 && (
              <span className="text-xs text-neutral-400 font-light font-sans">({cartCount})</span>
            )}
          </div>
          <button
            onClick={closeCart}
            className="text-neutral-500 hover:text-black transition-colors w-11 h-11 flex items-center justify-center p-0 cursor-pointer"
            aria-label="Close cart"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body (Scrollable Cart Items) */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 scrollbar-thin">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-12">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.0} stroke="currentColor" className="w-12 h-12 text-neutral-300">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.263-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5h6.75" />
              </svg>
              <div className="space-y-1">
                <p className="text-sm uppercase font-bold tracking-wider text-neutral-800">Your bag is empty</p>
                <p className="text-sm text-neutral-400 font-light">Add items to get started.</p>
              </div>
              <button
                onClick={closeCart}
                className="mt-2 bg-neutral-900 hover:bg-black text-white text-sm font-bold uppercase tracking-wider h-11 px-6 rounded-none transition-colors flex items-center justify-center cursor-pointer"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            cartItems.map((item) => (
              <div key={item.id} className="flex gap-4 pb-6 border-b border-neutral-100 last:border-b-0 last:pb-0">
                {/* Thumbnail 3:4 aspect */}
                <div className="relative w-20 aspect-[3/4] overflow-hidden bg-neutral-50 border border-neutral-100 flex-none">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>

                {/* Info Column */}
                <div className="flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <div className="flex justify-between items-start">
                      <h3 className="text-xs font-bold uppercase tracking-wide text-neutral-800 line-clamp-1">
                        {item.name}
                      </h3>
                      <span className="text-xs font-semibold text-neutral-800 pl-2">
                        {item.price}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 font-light">
                      Size: <span className="font-medium text-neutral-700">{item.size}</span> &nbsp;|&nbsp; Color: <span className="font-medium text-neutral-700">{item.color}</span>
                    </p>
                  </div>

                  {/* Actions Row - 44px min touch target stepper & min 14px remove link */}
                  <div className="flex justify-between items-center mt-2">
                    {/* Quantity Stepper (44px min height & 40px wide buttons) */}
                    <div className="flex items-center border border-neutral-200 text-sm font-semibold h-11">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="w-10 h-full flex items-center justify-center text-neutral-500 hover:text-black disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition-colors text-base"
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span className="px-3 text-neutral-950 font-medium select-none min-w-[20px] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-10 h-full flex items-center justify-center text-neutral-500 hover:text-black cursor-pointer transition-colors text-base"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>

                    {/* Remove Link (min 14px font & larger touch hit box) */}
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-sm text-neutral-400 hover:text-neutral-900 underline underline-offset-4 transition-colors font-light py-2 cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Sticky Footer */}
        {cartItems.length > 0 && (
          <div className="border-t border-neutral-100 px-6 py-5 bg-white space-y-4">
            {/* Subtotal - min 14px font */}
            <div className="flex justify-between items-center text-sm">
              <span className="uppercase font-bold tracking-wider text-neutral-500">Subtotal</span>
              <span className="text-sm font-bold text-neutral-900">
                {formatCurrency(cartSubtotal)}
              </span>
            </div>

            {/* Checkout Button - 44px min touch target & min 14px font */}
            <Link
              href="/checkout"
              onClick={closeCart}
              className="w-full text-center bg-[#121212] hover:bg-black text-white h-12 flex items-center justify-center text-sm font-bold uppercase tracking-[0.2em] transition-all duration-300 rounded-none shadow-sm cursor-pointer"
            >
              Checkout
            </Link>

            {/* Klarna Installment Note - min 14px font */}
            <p className="text-sm text-neutral-400 font-light text-center leading-normal">
              Or 3 interest-free payments of <span className="font-semibold text-neutral-700">{formatCurrency(klarnaInstallment)}</span> with <span className="font-bold text-neutral-800">Klarna</span>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
