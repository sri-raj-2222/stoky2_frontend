import Image from 'next/image';

export default function Hero() {
  return (
    <section className="relative w-full h-screen overflow-hidden">
      {/* Background Image */}
      <Image
        src="/images/hero-cinematic.png"
        fill
        priority
        className="object-cover object-center transition-transform duration-[2000ms] hover:scale-105"
        alt="STOKY2 Editorial"
        sizes="100vw"
        quality={95}
      />

      {/* Dark Gradient Overlay for Cinematic Lighting and Text Contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20 md:bg-gradient-to-r md:from-black/70 md:via-black/25 md:to-transparent" />

      {/* Content */}
      <div className="absolute bottom-0 left-0 w-full p-8 pb-20 md:p-16 lg:p-24">
        {/* Brand Name */}
        <h1
          className="text-5xl md:text-[64px] font-semibold uppercase tracking-[-0.02em] text-white leading-none"
          style={{ textShadow: '0 4px 30px rgba(0,0,0,0.5)' }}
        >
          STOKY2
        </h1>

        {/* Tagline (min 14px font on mobile) */}
        <p className="mt-4 md:mt-6 text-sm tracking-[0.06em] uppercase text-white/60 font-medium">
          Built Different. Worn Bold.
        </p>

        {/* CTA Button (44px min tap height, min 14px font) */}
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

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
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
