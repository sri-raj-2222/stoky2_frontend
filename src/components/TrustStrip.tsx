'use client';

export default function TrustStrip() {
  return (
    <section className="w-full bg-[#fafafa] border-t border-neutral-200 py-16 px-8 md:px-16 lg:px-24">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-12">
        {/* Column 1 — Shipping */}
        <div className="flex flex-col items-start space-y-3.5">
          {/* Outlined Truck Icon */}
          <div className="text-neutral-900">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.2}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125a1.125 1.125 0 0 0 1.125-1.125V9.75M8.25 18.75V14.25m0 0H20.25m-12 0V9.75M20.25 14.25v-4.5m0 0a2.25 2.25 0 0 0-2.25-2.25h-1.372c-.516 0-.966-.351-1.091-.852l-.445-1.782A1.875 1.875 0 0 0 13.279 4.5H9.75A2.25 2.25 0 0 0 7.5 6.75V9.75m12 0h-3.75a1.125 1.125 0 0 1-1.125-1.125V6.75m3.75 3h1.5"
              />
            </svg>
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold tracking-[0.06em] uppercase text-neutral-900 leading-tight">
              Free Shipping over $75
            </h3>
            <p className="text-sm text-neutral-500 font-normal leading-[1.65]">
              Calculated automatically at checkout on all orders.
            </p>
          </div>
        </div>

        {/* Column 2 — Returns */}
        <div className="flex flex-col items-start space-y-3.5">
          {/* Outlined Return/Loop Icon */}
          <div className="text-neutral-900">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.2}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
              />
            </svg>
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold tracking-[0.06em] uppercase text-neutral-900 leading-tight">
              Easy 30-Day Returns
            </h3>
            <p className="text-sm text-neutral-500 font-normal leading-[1.65]">
              Hassle-free exchanges or full refunds if not satisfied.
            </p>
          </div>
        </div>

        {/* Column 3 — Security */}
        <div className="flex flex-col items-start space-y-3.5">
          {/* Outlined Secure Lock Icon */}
          <div className="text-neutral-900">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.2}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
              />
            </svg>
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold tracking-[0.06em] uppercase text-neutral-900 leading-tight">
              Secure Checkout
            </h3>
            <p className="text-sm text-neutral-500 font-normal leading-[1.65]">
              100% encrypted processing with standard secure protocols.
            </p>
          </div>
        </div>

        {/* Column 4 — Sustainability */}
        <div className="flex flex-col items-start space-y-3.5">
          {/* Outlined Earth Globe Icon */}
          <div className="text-neutral-900">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.2}
              stroke="currentColor"
              className="w-6 h-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A11.952 11.952 0 0 1 12 13.5c-3.053 0-5.842 1.146-8 3.03m16.716-2.277a8.986 8.986 0 0 1-5.111 5.922m-8.716-6.747c.185-.72.284-1.475.284-2.253 0-.778-.099-1.533-.284-2.253m0 0A11.953 11.953 0 0 1 12 13.5c2.998 0 5.74 1.1 7.843 2.918M3.284 9.747a8.986 8.986 0 0 0 5.111 5.922"
              />
            </svg>
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold tracking-[0.06em] uppercase text-neutral-900 leading-tight">
              Ethically Made
            </h3>
            <p className="text-sm text-neutral-500 font-normal leading-[1.65]">
              Crafted in certified green facilities with fair-wage labor.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
