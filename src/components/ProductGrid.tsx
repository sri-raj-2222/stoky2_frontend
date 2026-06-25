'use client';

import { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import { supabase } from '@/lib/supabase';

// Expanded fallback catalog with correct categories assigned
const mockProducts = [
  { name: 'Essential Boxy Tee — Black', price: '₹1,499', color: '#0a0a0a', image: '/images/tshirt-black.png', slug: 'boxy-tee-black', category: 'Oversized Fit' },
  { name: 'Classic Crewneck — White', price: '₹1,299', color: '#f5f5f5', image: '/images/tshirt-white.png', slug: 'crewneck-white', category: 'Classic Fit' },
  { name: 'Premium Heavyweight Tee — Olive', price: '₹1,799', color: '#4a5d3a', image: '/images/tshirt-olive.png', slug: 'heavyweight-olive', category: 'Heavyweight Tee' },
  { name: 'Vintage Graphic Tee — Navy', price: '₹1,599', color: '#1a2744', image: '/images/tshirt-navy.png', slug: 'graphic-navy', category: 'Graphic Tee' },
  { name: 'Mercerized Polo — Burgundy', price: '₹1,999', color: '#6b2137', image: '/images/tshirt-burgundy.png', slug: 'polo-burgundy', category: 'Polo Tee' },
  { name: 'Classic Crewneck — Charcoal', price: '₹1,299', color: '#3a3a3a', image: '/images/tshirt-grey.png', slug: 'crewneck-charcoal', category: 'Classic Fit' },
  { name: 'Waffle Knit Henley — Grey', price: '₹1,899', color: '#8c8c8c', image: '/images/tshirt-grey.png', slug: 'henley-grey', category: 'Henley Tee' },
  { name: 'Deep V-Neck Tee — Black', price: '₹1,499', color: '#141414', image: '/images/tshirt-black.png', slug: 'vneck-black', category: 'V-Neck Tee' },
  { name: 'Heavyweight Long Sleeve — Olive', price: '₹2,199', color: '#3d4d33', image: '/images/tshirt-olive.png', slug: 'longsleeve-olive', category: 'Long Sleeve' },
  { name: 'Retro Graphic Tee — White', price: '₹1,699', color: '#fafafa', image: '/images/tshirt-white.png', slug: 'graphic-white', category: 'Graphic Tee' }
];

const CATEGORIES = [
  'All',
  'Classic Fit',
  'Oversized Fit',
  'Heavyweight Tee',
  'Graphic Tee',
  'Polo Tee',
  'Henley Tee',
  'V-Neck Tee',
  'Long Sleeve'
];

// Helper to format numeric prices (e.g., 1499 -> ₹1,499)
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price);
};

export default function ProductGrid() {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const [fallbackReason, setFallbackReason] = useState('');

  // Fetch products from database on mount
  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('products')
          .select('name, price, color, image, slug, category')
          .eq('status', 'Active') // only load active products
          .order('id', { ascending: true });

        if (error) throw error;

        if (!data || data.length === 0) {
          // If query succeeds but tables are empty, load seed catalog
          setProducts(mockProducts);
          setIsUsingFallback(true);
          setFallbackReason('The database table "products" contains no active records.');
        } else {
          // Map database schema values to ProductCard properties
          const mapped = data.map((p: any) => ({
            name: p.name,
            price: typeof p.price === 'number' ? formatPrice(p.price) : String(p.price),
            color: p.color || '#000000',
            image: p.image || '/images/tshirt-black.png',
            slug: p.slug,
            category: p.category || 'Classic Fit'
          }));
          setProducts(mapped);
          setIsUsingFallback(false);
        }
      } catch (err: any) {
        console.warn('Supabase products fetch failed, using fallback dataset:', err.message || err);
        setProducts(mockProducts);
        setIsUsingFallback(true);
        setFallbackReason(`Database check failed: ${err.message || 'Check database connection.'}`);
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  // Filter products by selected category
  const filteredProducts = products.filter(
    (product) => selectedCategory === 'All' || product.category === selectedCategory
  );

  return (
    <section id="collection" className="py-20 md:py-32 px-8 md:px-16 lg:px-24 bg-black">
      {/* Inject styling to hide scrollbars on mobile category list */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}} />

      <div className="mb-12 md:mb-16">
        <p className="text-sm tracking-[0.06em] uppercase text-white/40 mb-4 font-medium">
          The Collection
        </p>
        <h2 className="text-[28px] md:text-[36px] font-medium text-white tracking-tight uppercase">
          Essential Tees
        </h2>
        <p className="mt-4 text-[15px] md:text-base font-normal leading-[1.65] text-white/40 max-w-xl">
          Premium heavyweight cotton. Designed and cut for the perfect drape.
        </p>

        {/* Development Fallback Warning */}
        {isUsingFallback && (
          <div className="mt-8 p-4 border border-brand-amber/20 bg-brand-amber/5 text-xs text-brand-amber max-w-xl">
            <span className="font-bold uppercase tracking-wider block mb-1">
              Note: Local Catalog Fallback Active
            </span>
            <p className="text-white/60">
              {fallbackReason} Mock product categories are active for testing.
            </p>
          </div>
        )}
      </div>

      {/* Grid Split Layout */}
      <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
        {/* Left/Top Filter Sidebar */}
        <aside className="w-full md:w-60 shrink-0">
          <div className="md:sticky md:top-28">
            <h3 className="hidden md:block text-[11px] font-bold tracking-[0.12em] uppercase text-white/40 mb-6">
              Shop Categories
            </h3>

            {/* Desktop Vertical Menu */}
            <ul className="hidden md:flex flex-col space-y-4">
              {CATEGORIES.map((category) => {
                const isActive = selectedCategory === category;
                return (
                  <li key={category}>
                    <button
                      onClick={() => setSelectedCategory(category)}
                      className={`text-[13.5px] text-left transition-all duration-200 hover:text-white flex items-center gap-2.5 font-medium group cursor-pointer ${
                        isActive ? 'text-white font-semibold' : 'text-white/40'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full bg-white transition-all duration-300 ${
                        isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-50 group-hover:opacity-40 group-hover:scale-75'
                      }`} />
                      {category === 'All' ? 'All Types' : category}
                    </button>
                  </li>
                );
              })}
            </ul>

            {/* Mobile Scrollable Pills */}
            <div 
              className="md:hidden flex items-center space-x-2.5 overflow-x-auto pb-4 -mx-4 px-4 hide-scrollbar"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {CATEGORIES.map((category) => {
                const isActive = selectedCategory === category;
                return (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`whitespace-nowrap px-4 py-2 text-[10px] font-bold uppercase tracking-[0.06em] rounded-full transition-all duration-200 border cursor-pointer ${
                      isActive 
                        ? 'bg-white text-black border-white' 
                        : 'bg-transparent text-white/50 border-white/10 hover:text-white hover:border-white/30'
                    }`}
                  >
                    {category === 'All' ? 'All Types' : category}
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Right side Products Grid */}
        <div className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center min-h-[30vh]">
              <span className="text-sm text-white/30 tracking-wider">Loading collection...</span>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[30vh] border border-white/5 bg-white/[0.01] rounded-sm p-8">
              <span className="text-sm text-white/40 font-medium mb-1">No t-shirts found</span>
              <span className="text-xs text-white/20 text-center">No products have been added to "{selectedCategory}" yet.</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
              {filteredProducts.map((product) => (
                <ProductCard key={product.slug} {...product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
