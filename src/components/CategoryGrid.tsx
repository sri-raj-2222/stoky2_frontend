'use client';

import Image from 'next/image';
import Link from 'next/link';

interface CategoryItem {
  id: string;
  title: string;
  imageSrc: string;
  imageAlt: string;
  href: string;
}

const CATEGORIES: CategoryItem[] = [
  {
    id: 'classic',
    title: 'Classic Crew',
    imageSrc: '/images/tshirt-white.png',
    imageAlt: 'Model wearing white classic fit t-shirt',
    href: '#collection',
  },
  {
    id: 'oversized',
    title: 'Oversized Boxy',
    imageSrc: '/images/tshirt-black.png',
    imageAlt: 'Model wearing black oversized relaxed fit t-shirt',
    href: '#collection',
  },
  {
    id: 'heavyweight',
    title: 'Premium Heavy',
    imageSrc: '/images/tshirt-grey.png',
    imageAlt: 'Model wearing grey heavyweight textured cotton t-shirt',
    href: '#collection',
  },
];

export default function CategoryGrid() {
  return (
    <section className="w-full px-8 py-16 md:px-16 lg:px-24 bg-black">
      {/* Header */}
      <div className="mb-10">
        <p className="text-xs md:text-[13px] tracking-[0.06em] uppercase text-white/40 mb-3 font-medium">
          Browse by
        </p>
        <h2 className="text-[28px] md:text-[36px] font-medium text-white tracking-tight uppercase">
          Categories
        </h2>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {CATEGORIES.map((category) => (
          <Link
            key={category.id}
            href={category.href}
            className="group relative block aspect-square w-full overflow-hidden bg-neutral-900 border-none outline-none"
          >
            {/* Background Image with Zoom */}
            <div className="absolute inset-0 z-0">
              <Image
                src={category.imageSrc}
                alt={category.imageAlt}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                quality={90}
              />
            </div>

            {/* Hover Darken Overlay */}
            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/25 transition-colors duration-500 z-10" />

            {/* Readability Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-95 group-hover:opacity-100 transition-opacity duration-500 z-20" />

            {/* Category Text (Bottom-Left) */}
            <div className="absolute bottom-0 left-0 p-6 md:p-8 z-30">
              <h3 className="text-white font-sans text-lg md:text-[22px] font-medium uppercase tracking-[0.06em] leading-none">
                {category.title}
              </h3>
              
              {/* Explore Indicator */}
              <div className="mt-3 overflow-hidden h-5">
                <span className="inline-block text-[10px] font-bold uppercase tracking-[0.25em] text-white/70 transition-transform duration-300 translate-y-5 group-hover:translate-y-0">
                  Explore Collection →
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
