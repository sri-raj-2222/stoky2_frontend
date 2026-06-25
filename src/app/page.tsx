import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import CategoryGrid from "@/components/CategoryGrid";
import ProductGrid from "@/components/ProductGrid";
import Bestsellers from "@/components/Bestsellers";
import Editorial from "@/components/Editorial";
import TrustStrip from "@/components/TrustStrip";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-black overflow-hidden selection:bg-brand-amber/30 selection:text-white grain">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <CategoryGrid />
        <ProductGrid />
        <Bestsellers />
        <Editorial />
        <TrustStrip />
      </main>
      <Footer />
    </div>
  );
}

