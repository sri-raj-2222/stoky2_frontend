import Image from "next/image";

export default function Editorial() {
  return (
    <section className="relative w-full h-[70vh] md:h-[80vh] overflow-hidden">
      <Image
        src="/images/collection.png"
        fill
        className="object-cover object-center"
        alt="STOKY2 Collection"
        sizes="100vw"
        quality={85}
      />

      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />

      <div className="absolute inset-0 flex flex-col justify-center p-8 md:p-16 lg:p-24">
        <p className="text-sm tracking-[0.06em] uppercase text-white/40 mb-4 font-medium">
          Summer 2025
        </p>

        <h2 className="font-serif text-4xl md:text-[56px] lg:text-[64px] font-light text-white tracking-wide leading-none uppercase">
          THE ESSENTIAL
          <span className="block">COLLECTION</span>
        </h2>

        <p className="mt-6 text-[15px] md:text-base text-white/50 font-normal leading-[1.65] max-w-md">
          Crafted for those who lead. Six signature colors. One uncompromising
          standard.
        </p>

        <a
          href="#collection"
          className="mt-8 inline-flex items-center gap-3 text-white text-sm tracking-[0.08em] uppercase font-medium group h-11"
        >
          <span>Explore Collection</span>
          <span className="inline-block transition-transform duration-300 group-hover:translate-x-2">
            →
          </span>
          <span className="block w-12 h-[1px] bg-white/30 group-hover:w-20 transition-all duration-500 mt-2" />
        </a>
      </div>
    </section>
  );
}
