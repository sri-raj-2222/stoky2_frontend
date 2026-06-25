'use client';

import { useState, useEffect } from 'react';

export default function PromoPopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Check if user has already dismissed the popup
    const dismissed = localStorage.getItem('stoky_promo_dismissed');
    if (dismissed === 'true') return;

    // Slide in after a 20-second delay
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 20000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem('stoky_promo_dismissed', 'true');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText('STOKY10');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
    }
  };

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 max-w-sm w-[calc(100vw-48px)] bg-[#0C0C0C] border border-white/10 rounded-sm p-6 shadow-[0_12px_40px_rgba(0,0,0,0.8)] backdrop-blur-xl transition-all duration-700 ease-out transform ${
        isOpen
          ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
          : 'opacity-0 translate-y-12 scale-95 pointer-events-none'
      }`}
    >
      {/* Close Button */}
      <button
        onClick={handleClose}
        className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors p-1 cursor-pointer"
        aria-label="Close promotion"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-4 h-4"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Sale Badge (Restricted to Red) */}
      <div className="inline-block bg-[#EF4444] text-white text-[10px] font-bold tracking-[0.1em] uppercase px-2.5 py-1 mb-4 select-none rounded-2xs">
        10% Off Drops
      </div>

      {/* Title */}
      <h3 className="text-[17px] font-semibold tracking-tight text-white uppercase mb-2">
        Unlock VIP Code
      </h3>

      {/* Description */}
      <p className="text-xs text-white/50 leading-relaxed font-normal mb-4">
        Apply this code at checkout to claim your 10% discount on the entire summer collection.
      </p>

      {/* Coupon Code copy row */}
      <div className="flex items-center justify-between border border-dashed border-white/20 bg-white/[0.02] p-3 rounded-xs mb-3">
        <span className="text-[14px] font-mono font-bold tracking-wider text-white select-all">
          STOKY10
        </span>
        <button
          onClick={handleCopy}
          className="text-xs font-semibold uppercase tracking-[0.06em] text-white hover:text-white/70 transition-colors cursor-pointer bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-2xs"
        >
          {copied ? 'Copied ✓' : 'Copy'}
        </button>
      </div>

      {/* Expiry label */}
      <p className="text-[10px] tracking-wide text-white/35 font-medium uppercase">
        Valid until Dec 31, 2026
      </p>
    </div>
  );
}
