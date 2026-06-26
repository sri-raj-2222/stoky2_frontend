"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

const DEFAULT_IMAGES = [
  '/images/tshirt-black.png',
  '/images/tshirt-white.png',
  '/images/tshirt-grey.png',
  '/images/tshirt-navy.png',
  '/images/tshirt-olive.png',
  '/images/tshirt-burgundy.png',
];

export default function Hero() {
  const [images, setImages] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Load slides from database (or fallback)
  useEffect(() => {
    async function loadSlides() {
      try {
        const { data, error } = await supabase
          .from('hero_slides')
          .select('image_url')
          .order('sort_order', { ascending: true });

        if (error) {
          console.warn('Could not load slides from Supabase, using defaults:', error.message);
          setImages(DEFAULT_IMAGES);
        } else if (data && data.length > 0) {
          setImages(data.map((item) => item.image_url));
        } else {
          setImages(DEFAULT_IMAGES);
        }
      } catch (err) {
        console.warn('Error fetching slides:', err);
        setImages(DEFAULT_IMAGES);
      } finally {
        setLoading(false);
      }
    }
    loadSlides();
  }, []);

  // Slide navigation
  const nextSlide = () => {
    if (images.length === 0) return;
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const prevSlide = () => {
    if (images.length === 0) return;
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };

  // Continuous auto-slide timer (resets when index changes)
  useEffect(() => {
    if (images.length <= 1) return;
    const timer = setInterval(() => {
      nextSlide();
    }, 4500);
    return () => clearInterval(timer);
  }, [currentIndex, images]);

  if (loading) {
    return (
      <section className="relative w-full h-screen bg-black flex items-center justify-center">
        <div className="text-white/40 text-sm tracking-[0.1em] uppercase animate-pulse">Loading hero...</div>
      </section>
    );
  }

  return (
    <section className="relative w-full h-screen overflow-hidden">
      {/* Background Slideshow */}
      {images.map((src, index) => (
        <div
          key={src}
          className={`absolute inset-0 transition-all duration-[1200ms] ease-in-out ${
            index === currentIndex
              ? 'opacity-100 scale-100 pointer-events-auto'
              : 'opacity-0 scale-105 pointer-events-none'
          }`}
        >
          <Image
            src={src}
            fill
            priority={index === 0}
            className="object-cover object-center"
            alt={`STOKY2 Editorial Model ${index + 1}`}
            sizes="100vw"
            quality={95}
          />
        </div>
      ))}

      {/* Dark Gradient Overlay for Cinematic Lighting and Text Contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/25 md:bg-gradient-to-r md:from-black/75 md:via-black/30 md:to-transparent pointer-events-none" />

      {/* Left/Right Navigation Arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-6 top-1/2 -translate-y-1/2 z-30 w-12 h-12 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/60 border border-white/10 hover:border-white/20 text-white backdrop-blur-sm transition-all duration-300 cursor-pointer focus:outline-none group active:scale-95"
            aria-label="Previous slide"
          >
            <svg
              className="w-5 h-5 transition-transform duration-300 group-hover:-translate-x-0.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-6 top-1/2 -translate-y-1/2 z-30 w-12 h-12 flex items-center justify-center rounded-full bg-black/30 hover:bg-black/60 border border-white/10 hover:border-white/20 text-white backdrop-blur-sm transition-all duration-300 cursor-pointer focus:outline-none group active:scale-95"
            aria-label="Next slide"
          >
            <svg
              className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-0.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </>
      )}

      {/* Content */}
      <div className="absolute bottom-0 left-0 w-full p-8 pb-20 md:p-16 lg:p-24 z-10">
        {/* Brand Name */}
        <h1
          className="text-5xl md:text-[64px] font-semibold uppercase tracking-[-0.02em] text-white leading-none"
          style={{ textShadow: '0 4px 30px rgba(0,0,0,0.5)' }}
        >
          STOKY2
        </h1>

        {/* Tagline */}
        <p className="mt-4 md:mt-6 text-sm tracking-[0.06em] uppercase text-white/60 font-medium">
          Built Different. Worn Bold.
        </p>

        {/* CTA Button */}
        <div className="mt-8 md:mt-10 inline-block">
          <a
            href="#collection"
            className="group relative overflow-hidden bg-white text-black px-10 text-sm font-medium tracking-[0.08em] uppercase hover:bg-white/90 transition-all duration-300 inline-flex h-12 items-center justify-center"
          >
            Shop Now
            <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-black group-hover:w-full transition-all duration-500" />
          </a>
        </div>
      </div>

      {/* Slide Indicators */}
      <div className="absolute bottom-8 right-8 z-30 flex gap-2">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`h-1.5 rounded-full transition-all duration-500 ease-out cursor-pointer ${
              index === currentIndex
                ? 'bg-white w-6'
                : 'bg-white/30 w-1.5 hover:bg-white/50'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce z-10">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className="w-6 h-6 text-white/40"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 8.25l-7.5 7.5-7.5-7.5"
          />
        </svg>
      </div>
    </section>
  );
}

