'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import CartDrawer from './CartDrawer';

const navCategories = [
  { label: 'Men', href: '#collection' },
  { label: 'New Arrivals', href: '#collection' },
  { label: 'Sale', href: '#collection' },
  { label: 'About', href: '#footer' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const { cartCount, openCart } = useCart();
  const { user, isAdmin, signOut } = useAuth();
  const accountHref = user ? '/account' : '/login';

  const activeCategories = navCategories;

  // Announcement Bar States
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [fadeState, setFadeState] = useState<'in' | 'out'>('in');
  const [isDismissed, setIsDismissed] = useState(true);

  // Swipe States
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const announcements = [
    {
      text: "Up to 50% off Sale ends Sunday. ",
      link: <a href="#collection" className="underline font-semibold hover:text-white/80 transition-colors">Shop Sale</a>
    },
    {
      text: "Free shipping on orders over 999 rupees. ",
      link: <a href="#" className="underline font-semibold hover:text-white/80 transition-colors">Learn more</a>
    },
    {
      text: "Pay in 3 easy EMIs. No cost. ",
      link: <a href="#" className="underline font-semibold hover:text-white/80 transition-colors">Know more</a>
    }
  ];

  useEffect(() => {
    const dismissed = localStorage.getItem('stoky_announcement_dismissed');
    if (dismissed !== 'true') {
      setIsDismissed(false);
    }
  }, []);

  const dismissAnnouncement = () => {
    localStorage.setItem('stoky_announcement_dismissed', 'true');
    setIsDismissed(true);
  };

  const rotateMessage = (nextIdx: number) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setFadeState('out');
    setTimeout(() => {
      setCurrentIndex(nextIdx);
      setFadeState('in');
      setTimeout(() => {
        setIsAnimating(false);
      }, 300);
    }, 300);
  };

  useEffect(() => {
    if (isDismissed) return;
    const interval = setInterval(() => {
      rotateMessage((currentIndex + 1) % announcements.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [currentIndex, isDismissed, isAnimating]);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      rotateMessage((currentIndex + 1) % announcements.length);
    } else if (isRightSwipe) {
      rotateMessage((currentIndex - 1 + announcements.length) % announcements.length);
    }
  };

  // Listen to scroll to toggle shadow
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll when overlay is active
  useEffect(() => {
    if (mobileMenuOpen || searchOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen, searchOpen]);

  // Escape key listener to close panels
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
        setSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      {/* Structural Header Wrapper (sticky alignment) */}
      <header className="fixed top-0 left-0 w-full z-50 flex flex-col">
        {/* Announcement Bar */}
        {!isDismissed && (
          <div 
            className="w-full h-10 bg-[#1A1A1A] flex items-center justify-between px-4 md:px-8 text-white select-none border-b border-white/5"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {/* Left Chevron */}
            <button 
              onClick={() => rotateMessage((currentIndex - 1 + announcements.length) % announcements.length)}
              className="hidden md:flex text-white/50 hover:text-white transition-colors w-8 h-8 items-center justify-center p-0 cursor-pointer"
              aria-label="Previous announcement"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>

            {/* Fading Announcement Message */}
            <div className={`flex-1 text-center text-[12px] font-medium tracking-[0.06em] transition-opacity duration-300 ${fadeState === 'in' ? 'opacity-100' : 'opacity-0'}`}>
              <span>{announcements[currentIndex].text}</span>
              {announcements[currentIndex].link}
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-1.5">
              {/* Right Chevron */}
              <button 
                onClick={() => rotateMessage((currentIndex + 1) % announcements.length)}
                className="hidden md:flex text-white/50 hover:text-white transition-colors w-8 h-8 items-center justify-center p-0 cursor-pointer"
                aria-label="Next announcement"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
              
              {/* Close Button */}
              <button 
                onClick={dismissAnnouncement}
                className="text-white/50 hover:text-white transition-colors w-8 h-8 flex items-center justify-center p-0 cursor-pointer"
                aria-label="Dismiss announcement"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Navigation Bar */}
        <nav
          className={`w-full transition-all duration-300 py-4 px-6 md:px-12 lg:px-24 flex items-center justify-between text-white ${
            scrolled
              ? 'bg-black/90 backdrop-blur-xl shadow-sm border-b border-white/10'
              : 'bg-transparent border-b border-transparent'
          }`}
        >
          {/* MOBILE LAYOUT: Left Hamburger (44px touch target) */}
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden text-white hover:opacity-75 transition-opacity w-11 h-11 flex items-center justify-center p-0"
            aria-label="Open menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
          </button>

          {/* DESKTOP LAYOUT: Left Brand Logo */}
          {/* MOBILE LAYOUT: Center Brand Logo */}
          <div className="flex-1 md:flex-initial text-center md:text-left">
            <Link
              href="/"
              className="text-lg md:text-xl font-black uppercase tracking-[0.25em] text-white inline-block"
            >
              STOKY2
            </Link>
            {isAdmin && (
              <span style={{
                fontSize: '9px',
                fontWeight: 700,
                letterSpacing: '0.15em',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: '#fff',
                padding: '2px 8px',
                borderRadius: '4px',
                marginLeft: '8px',
                verticalAlign: 'middle',
                textTransform: 'uppercase' as const,
              }}>
                Admin
              </span>
            )}
          </div>

          {/* DESKTOP LAYOUT: Center Categories (13px medium font) */}
          <div className="hidden md:flex items-center space-x-8">
            {activeCategories.map((cat) => (
              <Link
                key={cat.label}
                href={cat.href}
                className="text-[13px] font-medium uppercase tracking-[0.08em] text-white hover:text-white/70 transition-colors py-1"
              >
                {cat.label}
              </Link>
            ))}
          </div>

          {/* UTILITY ACTIONS: Right Alignment (44px touch targets) */}
          <div className="flex items-center space-x-1 md:space-x-2">
            {/* Search (Desktop Only) */}
            {/* Search (Desktop Only) */}
            {!isAdmin && (
              <button
                onClick={() => setSearchOpen(true)}
                className="text-white hover:text-white/70 transition-colors w-11 h-11 flex items-center justify-center p-0"
                aria-label="Open search"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.603 10.603Z"
                  />
                </svg>
              </button>
            )}

            {/* Account (Desktop Only) */}
            <Link
              href={accountHref}
              className="hidden md:flex text-white hover:text-white/70 transition-colors w-11 h-11 items-center justify-center p-0"
              aria-label="Account"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                />
              </svg>
            </Link>

            {/* Cart Icon with Numeric Badge (Mobile & Desktop) */}
            {!isAdmin && (
              <button
                onClick={openCart}
                className="relative text-white hover:text-white/70 transition-colors w-11 h-11 flex items-center justify-center p-0 cursor-pointer"
                aria-label={`View cart with ${cartCount} items`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.263-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5h6.75"
                  />
                </svg>
                {cartCount > 0 && (
                  <span className="absolute top-2 right-2 w-4 h-4 bg-white text-black text-[9px] font-bold rounded-full flex items-center justify-center tracking-tighter">
                    {cartCount}
                  </span>
                )}
              </button>
            )}

            {/* Sign Out (Admins Only) */}
            {isAdmin && (
              <button
                onClick={signOut}
                className="text-[11px] font-semibold uppercase tracking-[0.1em] text-white/70 hover:text-white bg-white/10 hover:bg-white/20 border border-white/10 px-3.5 py-1.5 rounded-sm transition-all cursor-pointer ml-2"
              >
                Sign Out
              </button>
            )}
          </div>
        </nav>
      </header>

      {/* SEARCH OVERLAY PANEL (Slide-down, matches Navbar size and dark theme) */}
      {searchOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <div
            onClick={() => setSearchOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
          />

          {/* Search Bar Panel (Sits exactly over the header slot) */}
          <div className="absolute top-0 left-0 w-full bg-black/95 backdrop-blur-xl border-b border-white/10 py-4 px-6 md:px-12 lg:px-24 shadow-sm transition-transform duration-300 ease-out transform translate-y-0">
            <div className="flex items-center justify-between gap-4 w-full">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-5 h-5 text-white/50 shrink-0"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.603 10.603Z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search catalog, collections, fits..."
                autoFocus
                className="w-full text-base text-white border-none outline-none focus:ring-0 placeholder:text-white/30 bg-transparent font-light tracking-wide py-3"
              />
              <button
                onClick={() => setSearchOpen(false)}
                className="text-white hover:text-white/70 transition-colors w-11 h-11 flex items-center justify-center p-0 shrink-0"
                aria-label="Close search"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-6 h-6"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE MENU DRAWER (Slide-out left) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <div
            onClick={() => setMobileMenuOpen(false)}
            className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300"
          />

          {/* Drawer Panel */}
          <div className="absolute top-0 left-0 w-[80vw] max-w-xs h-full bg-white shadow-xl flex flex-col justify-between py-8 px-6 transition-transform duration-300 ease-out translate-x-0">
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-6 border-b border-zinc-100">
                <span className="font-bold tracking-[0.2em] text-zinc-800 uppercase text-sm">
                  STOKY2
                </span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-zinc-800 hover:opacity-75 transition-opacity w-11 h-11 flex items-center justify-center p-0"
                  aria-label="Close menu"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-6 h-6"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Navigation Links */}
              <nav className="flex flex-col space-y-5 mt-8">
                {activeCategories.map((cat) => (
                  <Link
                    key={cat.label}
                    href={cat.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-base font-semibold text-zinc-800 hover:text-zinc-500 transition-colors uppercase tracking-wider py-3 border-b border-zinc-100 flex items-center"
                  >
                    {cat.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Drawer Footer Utilities */}
            <div className="border-t border-zinc-100 pt-6">
              <Link
                href={isAdmin ? '/admin/products' : accountHref}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center space-x-3 text-zinc-800 hover:text-zinc-500 transition-colors py-3"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                  />
                </svg>
                <span className="text-sm font-semibold uppercase tracking-wider">
                  {isAdmin ? 'Admin Panel' : 'My Account'}
                </span>
              </Link>
            </div>
          </div>
        </div>
      )}
      <CartDrawer />
    </>
  );
}

