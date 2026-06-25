export default function Footer() {
  return (
    <footer className="bg-black border-t border-white/10 pt-16 pb-8 px-6 md:px-12 lg:px-24">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
        {/* Column 1 — Brand */}
        <div>
          <h3 className="text-2xl font-bold tracking-[0.2em] text-white uppercase">
            STOKY2
          </h3>
          <p className="mt-4 text-sm text-white/30 font-light leading-relaxed max-w-xs">
            Premium men&apos;s essentials. Built different. Worn bold.
          </p>
        </div>

        {/* Column 2 — Help */}
        <div>
          <h4 className="text-xs md:text-[13px] tracking-[0.06em] uppercase text-white/40 mb-4 font-medium">
            Help
          </h4>
          <ul className="space-y-3">
            {["Shipping & Returns", "Size Guide", "Contact Us", "FAQ"].map(
              (item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="block text-xs md:text-[13px] text-white/30 hover:text-white/70 transition-colors duration-300 font-normal tracking-[0.06em]"
                  >
                    {item}
                  </a>
                </li>
              )
            )}
          </ul>
        </div>

        {/* Column 3 — Connect */}
        <div>
          <h4 className="text-xs md:text-[13px] tracking-[0.06em] uppercase text-white/40 mb-4 font-medium">
            Connect
          </h4>
          <ul className="space-y-3">
            {["Instagram", "Twitter", "Pinterest"].map((item) => (
              <li key={item}>
                <a
                  href="#"
                  className="block text-xs md:text-[13px] text-white/30 hover:text-white/70 transition-colors duration-300 font-normal tracking-[0.06em]"
                >
                  {item}
                </a>
              </li>
            ))}
          </ul>

          <div className="mt-6">
            <label className="text-xs md:text-[13px] text-white/40 mb-2 block font-normal tracking-[0.06em]">
              Join the list
            </label>
            <div className="flex">
              <input
                type="email"
                placeholder="your@email.com"
                className="bg-transparent border border-white/20 text-white text-sm px-4 py-2.5 flex-1 focus:outline-none focus:border-white/50 transition-colors placeholder:text-white/20"
              />
              <button className="bg-white text-black px-5 py-2.5 text-[13px] font-medium tracking-[0.08em] uppercase hover:bg-white/90 transition-colors cursor-pointer">
                Submit
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-xs md:text-[13px] text-white/20 font-normal tracking-[0.06em]">
          &copy; 2025 STOKY2. All rights reserved.
        </p>
        <div className="flex gap-6">
          <a
            href="#"
            className="text-xs md:text-[13px] text-white/20 hover:text-white/40 transition-colors font-normal tracking-[0.06em]"
          >
            Privacy Policy
          </a>
          <a
            href="#"
            className="text-xs md:text-[13px] text-white/20 hover:text-white/40 transition-colors font-normal tracking-[0.06em]"
          >
            Terms of Service
          </a>
        </div>
      </div>
    </footer>
  );
}
