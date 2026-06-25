'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useCart } from '@/context/CartContext';

interface BestsellerItem {
  id: string;
  name: string;
  price: string;
  rating: number;
  reviews: number;
  imageSrc: string;
  imageAlt: string;
  slug: string;
}

const BESTSELLERS: BestsellerItem[] = [
  {
    id: '1',
    name: 'Essential Tee — Black',
    price: '₹1,499',
    rating: 5,
    reviews: 124,
    imageSrc: '/images/tshirt-black.png',
    imageAlt: 'Essential t-shirt in washed obsidian black',
    slug: 'essential-black',
  },
  {
    id: '2',
    name: 'Essential Tee — White',
    price: '₹1,499',
    rating: 5,
    reviews: 98,
    imageSrc: '/images/tshirt-white.png',
    imageAlt: 'Essential t-shirt in organic warm chalk white',
    slug: 'essential-white',
  },
  {
    id: '3',
    name: 'Essential Tee — Olive',
    price: '₹1,499',
    rating: 4,
    reviews: 76,
    imageSrc: '/images/tshirt-olive.png',
    imageAlt: 'Essential t-shirt in moss olive green',
    slug: 'essential-olive',
  },
  {
    id: '4',
    name: 'Essential Tee — Navy',
    price: '₹1,599',
    rating: 5,
    reviews: 82,
    imageSrc: '/images/tshirt-navy.png',
    imageAlt: 'Essential t-shirt in classic deep navy blue',
    slug: 'essential-navy',
  },
];

export default function Bestsellers() {
  const { addToCart } = useCart();
  const [addedItems, setAddedItems] = useState<Record<string, boolean>>({});

  const handleQuickAdd = (product: BestsellerItem, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const colorName = product.name.split(' — ')[1] || 'Black';
    
    addToCart({
      id: `${product.slug}-M`,
      slug: product.slug,
      name: product.name,
      price: product.price,
      color: colorName,
      size: 'M',
      image: product.imageSrc,
    });
    
    setAddedItems((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedItems((prev) => ({ ...prev, [product.id]: false }));
    }, 2000);
  };

  return (
    <section className="w-full px-8 py-20 md:px-16 lg:px-24 bg-black border-t border-white/5">
      {/* Header */}
      <div className="mb-12">
        <p className="text-sm tracking-[0.06em] uppercase text-white/40 mb-3 font-medium">
          Customer Favorites
        </p>
        <h2 className="text-[28px] md:text-[36px] font-medium text-white tracking-tight uppercase">
          Bestsellers
        </h2>
      </div>

      {/* Grid wrapper for mobile 2-column & desktop 4-column (No horizontal scroll) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pb-6 md:pb-0">
        {BESTSELLERS.map((product) => (
          <Link
            key={product.id}
            href={`/products/${product.slug}`}
            className="group relative w-full border border-white/10 bg-[#070707] hover:border-white/20 transition-colors duration-300 flex flex-col text-left"
          >
            {/* Image Container */}
            <div className="relative aspect-[3/4] overflow-hidden bg-neutral-900">
              <Image
                src={product.imageSrc}
                alt={product.imageAlt}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                loading="lazy"
                quality={90}
              />

              {/* Quick Add Overlay on Hover (44px min tap target height) */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-end justify-center">
                <button
                  onClick={(e) => handleQuickAdd(product, e)}
                  className="w-full bg-white text-black text-sm font-medium tracking-[0.08em] uppercase h-11 flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:bg-neutral-200 cursor-pointer"
                >
                  {addedItems[product.id] ? 'Added ✓' : 'Quick Add +'}
                </button>
              </div>
            </div>

            {/* Captions - Tight 8px padding */}
            <div className="p-3 pb-4 flex flex-col flex-1 justify-between space-y-2">
              <div className="space-y-1">
                {/* Product Name */}
                <h3 className="text-[15px] md:text-[22px] font-normal tracking-tight text-white uppercase truncate">
                  {product.name}
                </h3>

                {/* Star rating + reviews (min 14px font on mobile) */}
                <div className="flex items-center gap-1.5 text-xs md:text-sm tracking-wider text-neutral-400 font-light">
                  <div className="flex text-amber-400 text-xs leading-none select-none">
                    {'★'.repeat(product.rating)}
                    {'☆'.repeat(5 - product.rating)}
                  </div>
                  <span>({product.reviews})</span>
                </div>
              </div>

              {/* Price */}
              <p className="text-sm md:text-base font-semibold text-neutral-400 tracking-wide">
                {product.price}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
