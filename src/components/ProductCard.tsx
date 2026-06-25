'use client';

import Image from 'next/image';
import Link from 'next/link';

interface ProductCardProps {
  name: string;
  price: string;
  color: string;
  image: string;
  slug: string;
}

export default function ProductCard({ name, price, color, image, slug }: ProductCardProps) {
  return (
    <Link href={`/products/${slug}`} className="group relative cursor-pointer block">
      <div className="relative aspect-[3/4] overflow-hidden bg-neutral-900">
        <Image
          src={image}
          alt={name}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-105"
          sizes="(max-width: 768px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-500 flex items-center justify-center">
          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-500 text-white text-sm tracking-[0.3em] uppercase border border-white/50 px-6 py-3.5 backdrop-blur-sm min-h-[44px] flex items-center">
            Quick View
          </span>
        </div>
      </div>
      <div className="mt-4 space-y-1">
        <h3 className="text-lg md:text-[22px] font-medium tracking-tight text-white/85">{name}</h3>
        <p className="text-base font-semibold text-white/50 tracking-wide">{price}</p>
        <div
          className="w-3 h-3 rounded-full mt-2 border border-white/20"
          style={{ backgroundColor: color }}
        />
      </div>
    </Link>
  );
}
