'use client';

import { useState, use, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FitQuiz from '@/components/FitQuiz';
import { useCart } from '@/context/CartContext';

// Define products catalog matching home page items
interface ProductDetails {
  slug: string;
  name: string;
  price: string;
  colorName: string;
  colorHex: string;
  images: string[];
  description: string;
  fit: string;
  materials: string;
  shipping: string;
  rating: number;
  reviewsCount: number;
  reviewsList: {
    author: string;
    rating: number;
    date: string;
    title: string;
    comment: string;
  }[];
}

const PRODUCTS_DATA: Record<string, ProductDetails> = {
  'essential-black': {
    slug: 'essential-black',
    name: 'Essential Tee — Black',
    price: '₹1,499',
    colorName: 'Obsidian Black',
    colorHex: '#0a0a0a',
    images: ['/images/tshirt-black.png', '/images/tshirt-grey.png', '/images/hero-cinematic.png'],
    description: 'The definitive heavyweight t-shirt. Cut from premium 280GSM long-staple cotton, this tee offers a structured drape and an oversized silhouette that retains its shape wear after wear.',
    fit: 'Oversized, relaxed fit. Dropped shoulders with structured collar band. Take your standard size for the intended oversized look, or size down for a classic fit.',
    materials: '100% Organic Ring-Spun Cotton. Fabric weight: 280 GSM. Preshrunk to minimize shrinkage.',
    shipping: 'Free standard shipping on orders over ₹2,000. Delivered in 3-5 business days. Easy 30-day hassle-free returns.',
    rating: 4.9,
    reviewsCount: 124,
    reviewsList: [
      { author: 'Rahul M.', rating: 5, date: '2025-06-12', title: 'Perfect drape', comment: 'The weight of this t-shirt is amazing. It hangs perfectly and doesn\'t cling. Best oversized tee I own.' },
      { author: 'Aman S.', rating: 5, date: '2025-06-02', title: 'Absolute premium quality', comment: 'Feels like a high-end luxury brand. The neck band is tight and doesn\'t stretch out after washing.' },
      { author: 'Vikram K.', rating: 4, date: '2025-05-24', title: 'Very heavy but comfortable', comment: 'Definitely heavyweight. Perfect for cooler days or air-conditioned environments. Highly recommend.' }
    ]
  },
  'essential-white': {
    slug: 'essential-white',
    name: 'Essential Tee — White',
    price: '₹1,499',
    colorName: 'Chalk White',
    colorHex: '#f5f5f5',
    images: ['/images/tshirt-white.png', '/images/tshirt-grey.png', '/images/hero-cinematic.png'],
    description: 'The definitive heavyweight t-shirt in organic chalk white. Cut from premium 280GSM long-staple cotton, this tee offers a structured drape and an oversized silhouette.',
    fit: 'Oversized, relaxed fit. Dropped shoulders with structured collar band.',
    materials: '100% Organic Ring-Spun Cotton. Fabric weight: 280 GSM. Preshrunk.',
    shipping: 'Free standard shipping on orders over ₹2,000. Delivered in 3-5 business days. Easy 30-day returns.',
    rating: 4.8,
    reviewsCount: 98,
    reviewsList: [
      { author: 'Kabir D.', rating: 5, date: '2025-06-10', title: 'Not see-through at all', comment: 'Finding a white tee that isn\'t see-through is rare. This one is thick, premium, and fits like a dream.' },
      { author: 'Rohan P.', rating: 5, date: '2025-06-01', title: 'Clean and bright', comment: 'The white is clean and warm. Looks incredibly premium layered or on its own.' }
    ]
  },
  'essential-olive': {
    slug: 'essential-olive',
    name: 'Essential Tee — Olive',
    price: '₹1,499',
    colorName: 'Moss Olive',
    colorHex: '#4a5d3a',
    images: ['/images/tshirt-olive.png', '/images/tshirt-grey.png', '/images/hero-cinematic.png'],
    description: 'An earth-inspired moss olive green heavyweight tee. Crafted with organic 280GSM cotton for maximum comfort and premium drape structure.',
    fit: 'Oversized, relaxed fit. Dropped shoulders with structured collar band.',
    materials: '100% Organic Ring-Spun Cotton. Fabric weight: 280 GSM. Preshrunk.',
    shipping: 'Free standard shipping on orders over ₹2,000. Delivered in 3-5 business days. Easy 30-day returns.',
    rating: 4.7,
    reviewsCount: 76,
    reviewsList: [
      { author: 'Siddharth G.', rating: 5, date: '2025-06-08', title: 'Unique color', comment: 'Love this olive shade. It matches perfectly with charcoal cargo pants or dark blue jeans.' }
    ]
  },
  'essential-navy': {
    slug: 'essential-navy',
    name: 'Essential Tee — Navy',
    price: '₹1,599',
    colorName: 'Deep Navy',
    colorHex: '#1a2744',
    images: ['/images/tshirt-navy.png', '/images/tshirt-black.png', '/images/hero-cinematic.png'],
    description: 'A classic dark navy blue heavyweight tee. Crafted with organic 280GSM cotton for maximum comfort and premium drape structure.',
    fit: 'Oversized, relaxed fit. Dropped shoulders with structured collar band.',
    materials: '100% Organic Ring-Spun Cotton. Fabric weight: 280 GSM. Preshrunk.',
    shipping: 'Free standard shipping on orders over ₹2,000. Delivered in 3-5 business days. Easy 30-day returns.',
    rating: 4.9,
    reviewsCount: 82,
    reviewsList: [
      { author: 'Varun K.', rating: 5, date: '2025-06-15', title: 'Excellent wash cycles', comment: 'Washed it 5 times now. The color hasn\'t faded at all and the fit remains identical. Outstanding quality.' }
    ]
  },
  'essential-burgundy': {
    slug: 'essential-burgundy',
    name: 'Essential Tee — Burgundy',
    price: '₹1,599',
    colorName: 'Rich Burgundy',
    colorHex: '#6b2137',
    images: ['/images/tshirt-burgundy.png', '/images/tshirt-black.png', '/images/hero-cinematic.png'],
    description: 'A deep, rich burgundy maroon heavyweight tee. Crafted with organic 280GSM cotton for maximum comfort and premium drape structure.',
    fit: 'Oversized, relaxed fit. Dropped shoulders with structured collar band.',
    materials: '100% Organic Ring-Spun Cotton. Fabric weight: 280 GSM. Preshrunk.',
    shipping: 'Free standard shipping on orders over ₹2,000. Delivered in 3-5 business days. Easy 30-day returns.',
    rating: 4.8,
    reviewsCount: 54,
    reviewsList: [
      { author: 'Aditya S.', rating: 5, date: '2025-06-11', title: 'Beautiful deep shade', comment: 'The color is rich and looks very premium. Cotton is soft despite the heavy weight.' }
    ]
  },
  'essential-charcoal': {
    slug: 'essential-charcoal',
    name: 'Essential Tee — Charcoal',
    price: '₹1,499',
    colorName: 'Charcoal Grey',
    colorHex: '#3a3a3a',
    images: ['/images/tshirt-grey.png', '/images/tshirt-black.png', '/images/hero-cinematic.png'],
    description: 'A versatile textured charcoal grey heavyweight tee. Crafted with organic 280GSM cotton for maximum comfort and premium drape structure.',
    fit: 'Oversized, relaxed fit. Dropped shoulders with structured collar band.',
    materials: '100% Organic Ring-Spun Cotton. Fabric weight: 280 GSM. Preshrunk.',
    shipping: 'Free standard shipping on orders over ₹2,000. Delivered in 3-5 business days. Easy 30-day returns.',
    rating: 4.8,
    reviewsCount: 63,
    reviewsList: [
      { author: 'Meir A.', rating: 5, date: '2025-06-05', title: 'My daily driver', comment: 'I wear this charcoal tee almost every week. It fits great and goes with anything.' }
    ]
  }
};

export default function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  // Await the dynamic slug parameter
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;
  const product = PRODUCTS_DATA[slug] || PRODUCTS_DATA['essential-black'];

  const { addToCart } = useCart();

  // Client States
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState('M');
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [showStickyBottom, setShowStickyBottom] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show sticky bar once scrolled past ~400px (past the buy button)
      setShowStickyBottom(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Accordion active keys
  const [openAccordions, setOpenAccordions] = useState<Record<string, boolean>>({
    description: true,
    fit: false,
    materials: false,
    shipping: false,
  });

  const toggleAccordion = (key: string) => {
    setOpenAccordions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAddToCart = () => {
    addToCart({
      id: `${product.slug}-${selectedSize}`,
      slug: product.slug,
      name: product.name,
      price: product.price,
      color: product.colorName,
      size: selectedSize,
      image: product.images[0],
    });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-black text-white selection:bg-brand-amber/30 selection:text-white pt-16 pb-24 md:pb-0">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 md:px-12 lg:px-24 py-10 md:py-16">
        {/* Back Link */}
        <div className="mb-8">
          <Link href="/" className="text-sm uppercase tracking-[0.06em] text-neutral-400 hover:text-white transition-colors inline-flex items-center gap-2 font-medium py-2">
            ← Back to Shop
          </Link>
        </div>

        {/* Core Product Presentation Row */}
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
          {/* Left Column 60% — Photo Gallery */}
          <div className="w-full lg:w-[60%] flex flex-col space-y-4">
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-neutral-900 border border-white/5">
              <Image
                src={product.images[activeImageIndex]}
                alt={product.name}
                fill
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="object-cover"
                priority
              />
            </div>
            
            {/* Thumbnail Strip */}
            <div className="flex gap-2 overflow-x-auto scrollbar-none pb-2">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative flex-none w-20 aspect-[3/4] overflow-hidden bg-neutral-900 border transition-all ${
                    idx === activeImageIndex ? 'border-white' : 'border-white/10 opacity-60 hover:opacity-100'
                  }`}
                >
                  <Image
                    src={img}
                    alt={`${product.name} view ${idx + 1}`}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Right Column 40% — Product details */}
          <div className="w-full lg:w-[40%] flex flex-col space-y-6">
            <div className="space-y-2">
              <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-neutral-400 block">
                STOKY2 Premium Essentials
              </span>
              {/* Product Name 22px */}
              <h1 className="text-[22px] font-medium uppercase tracking-tight text-white leading-tight">
                {product.name}
              </h1>

              {/* Star Rating Overview (min 14px font on mobile) */}
              <div className="flex items-center gap-2 text-sm tracking-wider text-neutral-400 font-light pt-1">
                <div className="flex text-white text-xs select-none">
                  {'★'.repeat(Math.round(product.rating))}
                  {'☆'.repeat(5 - Math.round(product.rating))}
                </div>
                <span>({product.reviewsCount} reviews)</span>
              </div>
            </div>

            {/* Price */}
            <p className="text-base font-semibold tracking-wide text-neutral-300">
              {product.price}
            </p>

            {/* Divider */}
            <hr className="border-white/10" />

            {/* Color Swatch - 44px tap targets */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm font-normal tracking-[0.06em]">
                <span className="uppercase font-medium text-neutral-400">Color</span>
                <span className="text-neutral-300">{product.colorName}</span>
              </div>
              <div className="flex gap-1 flex-wrap">
                {Object.values(PRODUCTS_DATA).map((p) => (
                  <div key={p.slug} className="w-11 h-11 flex items-center justify-center">
                    <Link
                      href={`/products/${p.slug}`}
                      className={`w-7 h-7 rounded-full border transition-all flex items-center justify-center ${
                        p.slug === product.slug ? 'border-white scale-110' : 'border-white/10 hover:border-white/40'
                      }`}
                      title={p.colorName}
                    >
                      <span
                        className="w-5 h-5 rounded-full block border border-white/5"
                        style={{ backgroundColor: p.colorHex }}
                      />
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* Size Selector Pills & Size Guide Link - 44px tap targets & 14px font */}
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm font-normal tracking-[0.06em]">
                <span className="uppercase font-medium text-neutral-400">Size</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSizeGuideOpen(true)}
                    className="hover:text-white transition-colors underline underline-offset-4 cursor-pointer"
                  >
                    Size Guide
                  </button>
                  <span className="text-neutral-600">|</span>
                  <FitQuiz onSelectSize={setSelectedSize} />
                </div>
              </div>
              <div className="flex gap-2">
                {['S', 'M', 'L', 'XL', 'XXL'].map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`flex-1 h-11 flex items-center justify-center text-sm font-medium uppercase tracking-[0.08em] border transition-all ${
                      size === selectedSize
                        ? 'border-white bg-white text-black font-bold'
                        : 'border-white/10 text-white hover:border-white/40'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Purchase buttons - 44px touch height & 14px font */}
            <div className="space-y-2 pt-2">
              {/* Add to Cart - Full-Width Near-Black Button */}
              <button
                onClick={handleAddToCart}
                className="w-full bg-[#121212] hover:bg-neutral-900 border border-white/10 text-white py-4 text-sm font-medium uppercase tracking-[0.08em] transition-all duration-300 cursor-pointer h-12 flex items-center justify-center"
              >
                {addedToCart ? 'Added to Bag ✓' : 'Add to Cart'}
              </button>

              {/* Buy Now - Outlined Button */}
              <button
                onClick={() => alert(`Redirecting to instant checkout for ${product.name} (Size: ${selectedSize})`)}
                className="w-full bg-transparent hover:bg-white hover:text-black border border-white text-white py-4 text-sm font-medium uppercase tracking-[0.08em] transition-all duration-300 cursor-pointer h-12 flex items-center justify-center"
              >
                Buy Now
              </button>
            </div>

            {/* Divider */}
            <hr className="border-white/10" />

            {/* Accordion Panels for Description, Fit, Materials, Shipping - 44px touch targets & 14px font */}
            <div className="divide-y divide-white/10 border-y border-white/10">
              {/* Accordion item: Description */}
              <div className="py-1">
                <button
                  onClick={() => toggleAccordion('description')}
                  className="w-full flex justify-between items-center text-left text-sm uppercase tracking-[0.06em] font-medium text-white hover:text-neutral-300 transition-colors h-11"
                >
                  <span>Description</span>
                  <span>{openAccordions.description ? '−' : '+'}</span>
                </button>
                {openAccordions.description && (
                  <p className="pb-3 text-[15px] md:text-base text-neutral-400 font-normal leading-[1.65]">
                    {product.description}
                  </p>
                )}
              </div>

              {/* Accordion item: Fit */}
              <div className="py-1">
                <button
                  onClick={() => toggleAccordion('fit')}
                  className="w-full flex justify-between items-center text-left text-sm uppercase tracking-[0.06em] font-medium text-white hover:text-neutral-300 transition-colors h-11"
                >
                  <span>Fit & Sizing</span>
                  <span>{openAccordions.fit ? '−' : '+'}</span>
                </button>
                {openAccordions.fit && (
                  <p className="pb-3 text-[15px] md:text-base text-neutral-400 font-normal leading-[1.65]">
                    {product.fit}
                  </p>
                )}
              </div>

              {/* Accordion item: Materials */}
              <div className="py-1">
                <button
                  onClick={() => toggleAccordion('materials')}
                  className="w-full flex justify-between items-center text-left text-sm uppercase tracking-[0.06em] font-medium text-white hover:text-neutral-300 transition-colors h-11"
                >
                  <span>Materials & Care</span>
                  <span>{openAccordions.materials ? '−' : '+'}</span>
                </button>
                {openAccordions.materials && (
                  <p className="pb-3 text-[15px] md:text-base text-neutral-400 font-normal leading-[1.65]">
                    {product.materials}
                  </p>
                )}
              </div>

              {/* Accordion item: Shipping */}
              <div className="py-1">
                <button
                  onClick={() => toggleAccordion('shipping')}
                  className="w-full flex justify-between items-center text-left text-sm uppercase tracking-[0.06em] font-medium text-white hover:text-neutral-300 transition-colors h-11"
                >
                  <span>Shipping & Returns</span>
                  <span>{openAccordions.shipping ? '−' : '+'}</span>
                </button>
                {openAccordions.shipping && (
                  <p className="pb-3 text-[15px] md:text-base text-neutral-400 font-normal leading-[1.65]">
                    {product.shipping}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Customer Reviews Section */}
        <section className="mt-20 border-t border-white/10 pt-16">
          <div className="mb-10">
            <h2 className="text-[28px] md:text-[36px] font-medium text-white tracking-tight uppercase">
              Customer Reviews
            </h2>
          </div>

          <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
            {/* Reviews Summary Stats */}
            <div className="w-full lg:w-1/3 space-y-4">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black">{product.rating}</span>
                <span className="text-sm text-neutral-400 font-normal">out of 5.0</span>
              </div>
              <div className="flex text-amber-400 text-lg leading-none select-none">
                {'★'.repeat(Math.round(product.rating))}
                {'☆'.repeat(5 - Math.round(product.rating))}
              </div>
              <p className="text-sm text-neutral-400 font-normal tracking-[0.06em]">
                Based on {product.reviewsCount} verified purchases
              </p>
            </div>

            {/* Reviews List */}
            <div className="w-full lg:w-2/3 space-y-8 divide-y divide-white/5">
              {product.reviewsList.map((rev, idx) => (
                <div key={idx} className={`space-y-2.5 ${idx > 0 ? 'pt-8' : ''}`}>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium uppercase tracking-[0.06em] text-white">
                      {rev.author}
                    </span>
                    <span className="text-sm text-neutral-500 font-normal tracking-[0.06em]">
                      {rev.date}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex text-amber-400 text-xs leading-none select-none">
                      {'★'.repeat(rev.rating)}
                      {'☆'.repeat(5 - rev.rating)}
                    </div>
                    <span className="text-sm font-medium text-white uppercase tracking-[0.06em]">
                      {rev.title}
                    </span>
                  </div>
                  <p className="text-[15px] md:text-base text-neutral-400 font-normal leading-[1.65]">
                    {rev.comment}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* SIZE GUIDE MODAL */}
      {sizeGuideOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <div
            onClick={() => setSizeGuideOpen(false)}
            className="absolute inset-0 bg-black/75 backdrop-blur-xs transition-opacity duration-300"
          />

          {/* Modal Container */}
          <div className="relative bg-neutral-900 border border-white/10 w-full max-w-lg p-6 md:p-8 shadow-2xl z-10">
            {/* Close Button */}
            <button
              onClick={() => setSizeGuideOpen(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors p-1"
              aria-label="Close modal"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Modal Content */}
            <div className="space-y-5">
              <h3 className="text-base font-bold uppercase tracking-widest text-white">
                Oversized Tee Size Guide
              </h3>
              <p className="text-xs text-neutral-400 font-light tracking-wide leading-relaxed">
                Measurements are taken flat in inches. This tee has an intentional oversized fit.
              </p>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs divide-y divide-white/10">
                  <thead>
                    <tr className="text-neutral-400 font-bold uppercase tracking-wider">
                      <th className="py-2.5">Size</th>
                      <th className="py-2.5">Chest</th>
                      <th className="py-2.5">Length</th>
                      <th className="py-2.5">Sleeve</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-light text-neutral-300">
                    <tr>
                      <td className="py-2.5 font-bold text-white">S</td>
                      <td className="py-2.5">22.5&quot;</td>
                      <td className="py-2.5">28.0&quot;</td>
                      <td className="py-2.5">8.5&quot;</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-bold text-white">M</td>
                      <td className="py-2.5">23.5&quot;</td>
                      <td className="py-2.5">29.0&quot;</td>
                      <td className="py-2.5">9.0&quot;</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-bold text-white">L</td>
                      <td className="py-2.5">24.5&quot;</td>
                      <td className="py-2.5">30.0&quot;</td>
                      <td className="py-2.5">9.5&quot;</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-bold text-white">XL</td>
                      <td className="py-2.5">25.5&quot;</td>
                      <td className="py-2.5">31.0&quot;</td>
                      <td className="py-2.5">10.0&quot;</td>
                    </tr>
                    <tr>
                      <td className="py-2.5 font-bold text-white">XXL</td>
                      <td className="py-2.5">26.5&quot;</td>
                      <td className="py-2.5">32.0&quot;</td>
                      <td className="py-2.5">10.5&quot;</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Bottom Add to Cart Bar for Mobile (44px min button target height) */}
      {showStickyBottom && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-black/95 border-t border-white/10 p-4 md:hidden flex gap-3 items-center justify-between animate-fade-in">
          <div className="flex flex-col justify-center min-w-0">
            <span className="text-sm font-semibold text-white truncate">{product.name}</span>
            <span className="text-sm text-neutral-400 font-light">{product.price}</span>
          </div>
          <button
            onClick={handleAddToCart}
            className="flex-1 bg-white text-black text-sm font-bold uppercase tracking-wider h-11 flex items-center justify-center cursor-pointer hover:bg-neutral-200 transition-colors"
          >
            {addedToCart ? 'Added ✓' : 'Add to Bag'}
          </button>
        </div>
      )}

      <Footer />
    </div>
  );
}
