import ProductCard from './ProductCard';
import { supabase } from '@/lib/supabase';

// Fallback catalog in case database is empty or credentials are missing
const mockProducts = [
  { name: 'Essential Tee — Black', price: '₹1,499', color: '#0a0a0a', image: '/images/tshirt-black.png', slug: 'essential-black' },
  { name: 'Essential Tee — White', price: '₹1,499', color: '#f5f5f5', image: '/images/tshirt-white.png', slug: 'essential-white' },
  { name: 'Essential Tee — Olive', price: '₹1,499', color: '#4a5d3a', image: '/images/tshirt-olive.png', slug: 'essential-olive' },
  { name: 'Essential Tee — Navy', price: '₹1,599', color: '#1a2744', image: '/images/tshirt-navy.png', slug: 'essential-navy' },
  { name: 'Essential Tee — Burgundy', price: '₹1,599', color: '#6b2137', image: '/images/tshirt-burgundy.png', slug: 'essential-burgundy' },
  { name: 'Essential Tee — Charcoal', price: '₹1,499', color: '#3a3a3a', image: '/images/tshirt-grey.png', slug: 'essential-charcoal' },
];

// Helper to format numeric prices (e.g. 1499 -> ₹1,499)
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(price);
};

export default async function ProductGrid() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let products = [];
  let isUsingFallback = false;
  let fallbackReason = '';

  // 1. Check if Supabase keys exist
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-project-id')) {
    products = mockProducts;
    isUsingFallback = true;
    fallbackReason = 'Supabase keys are not configured in your local environment (.env.local).';
  } else {
    try {
      // 2. Fetch products table sorted by creation date
      const { data, error } = await supabase
        .from('products')
        .select('name, price, color, image, slug')
        .order('id', { ascending: true });

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        products = mockProducts;
        isUsingFallback = true;
        fallbackReason = 'The database table "products" contains no records.';
      } else {
        // Map database schema values to ProductCard properties
        products = data.map((p: any) => ({
          name: p.name,
          price: typeof p.price === 'number' ? formatPrice(p.price) : String(p.price),
          color: p.color,
          image: p.image,
          slug: p.slug,
        }));
      }
    } catch (err: any) {
      console.warn('Supabase query failed, falling back to local dataset:', err.message || err);
      products = mockProducts;
      isUsingFallback = true;
      fallbackReason = `Query failed: ${err.message || 'Check database connection and table schema.'}`;
    }
  }

  return (
    <section id="collection" className="py-20 md:py-32 px-8 md:px-16 lg:px-24 bg-black">
      <div className="mb-16 md:mb-24">
        <p className="text-sm tracking-[0.06em] uppercase text-white/40 mb-4 font-medium">
          The Collection
        </p>
        <h2 className="text-[28px] md:text-[36px] font-medium text-white tracking-tight uppercase">
          Essential Tees
        </h2>
        <p className="mt-4 text-[15px] md:text-base font-normal leading-[1.65] text-white/40 max-w-xl">
          Premium heavyweight cotton. Oversized silhouette. Crafted for those who refuse to blend in.
        </p>

        {/* Development Fallback Badge */}
        {isUsingFallback && (
          <div className="mt-8 p-4 border border-brand-amber/20 bg-brand-amber/5 text-xs text-brand-amber max-w-xl">
            <span className="font-bold uppercase tracking-wider block mb-1">
              Development Warning: Offline Fallback Active
            </span>
            <p className="text-white/60">
              {fallbackReason} Mock product catalog loaded instead.
            </p>
          </div>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
        {products.map((product) => (
          <ProductCard key={product.slug} {...product} />
        ))}
      </div>
    </section>
  );
}
