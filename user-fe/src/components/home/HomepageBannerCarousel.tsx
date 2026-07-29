"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type HomepageBanner = {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
};
export default function HomepageBannerCarousel({
  banners,
}: {
  banners: HomepageBanner[];
}) {
  const [active, setActive] = useState(0);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    if (banners.length < 2) return;
    const timer = window.setInterval(
      () => setActive((value) => (value + 1) % banners.length),
      5000,
    );
    return () => window.clearInterval(timer);
  }, [banners.length]);
  if (!banners.length) return null;
  const visibleActive = active % banners.length;
  const banner = banners[visibleActive];
  const previous = () =>
    setActive((value) => (value - 1 + banners.length) % banners.length);
  const next = () => setActive((value) => (value + 1) % banners.length);
  const content = (
    <div
      className="relative mt-4 flex min-h-[350px] items-end overflow-hidden rounded-3xl bg-gradient-to-r from-[#281850] via-[#6238E4] to-[#15A57B] px-6 py-9 text-white sm:min-h-[420px] sm:px-10 sm:py-12 lg:px-14"
      onTouchStart={(event) => {
        touchStartX.current = event.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(event) => {
        if (touchStartX.current === null) return;
        const distance = event.changedTouches[0]?.clientX - touchStartX.current;
        touchStartX.current = null;
        if (Math.abs(distance) < 45) return;
        if (distance < 0) next();
        else previous();
      }}
      aria-live="polite"
    >
      <>
        {banner.imageUrl && (
          <img
            src={banner.imageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
      </>
      <div className="absolute inset-0 bg-gradient-to-r from-[#17102F]/85 via-[#2B1762]/50 to-transparent" />
      <div className="relative z-10 max-w-2xl">
        {banner.linkUrl ? (
          <Link
            href={banner.linkUrl}
            className="block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <BannerText banner={banner} />
          </Link>
        ) : (
          <BannerText banner={banner} />
        )}
      </div>
      {banners.length > 1 && (
        <>
          <button
            type="button"
            onClick={previous}
            aria-label="Previous banner"
            className="absolute left-3 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/25 text-white backdrop-blur-sm transition hover:bg-black/45 focus:outline-none focus:ring-2 focus:ring-white sm:left-5"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next banner"
            className="absolute right-3 top-1/2 z-20 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-black/25 text-white backdrop-blur-sm transition hover:bg-black/45 focus:outline-none focus:ring-2 focus:ring-white sm:right-5"
          >
            <ChevronRight size={22} />
          </button>
        </>
      )}
      {banners.length > 1 && (
        <div className="absolute bottom-4 right-5 z-20 flex gap-1.5">
          {banners.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`Show banner ${index + 1}`}
              aria-current={index === visibleActive ? "true" : undefined}
              className={`h-2 rounded-full transition-all ${index === visibleActive ? "w-5 bg-white" : "w-2 bg-white/50"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
  return content;
}

function BannerText({ banner }: { banner: HomepageBanner }) {
  return (
    <>
      <p className="text-xs font-bold uppercase tracking-[.16em] text-white/75">
        Pharma2U offer
      </p>
      <h2 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">
        {banner.title}
      </h2>
      {banner.subtitle && (
        <p className="mt-4 text-base leading-7 text-white/90 sm:text-lg">
          {banner.subtitle}
        </p>
      )}
    </>
  );
}
