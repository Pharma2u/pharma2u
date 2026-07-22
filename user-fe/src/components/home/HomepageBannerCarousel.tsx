"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
  useEffect(() => {
    if (banners.length < 2) return;
    const timer = window.setInterval(
      () => setActive((value) => (value + 1) % banners.length),
      5000,
    );
    return () => window.clearInterval(timer);
  }, [banners.length]);
  if (!banners.length) return null;
  const banner = banners[active];
  const content = (
    <div className="relative mt-4 flex min-h-[350px] items-end overflow-hidden rounded-3xl bg-gradient-to-r from-[#281850] via-[#6238E4] to-[#15A57B] px-6 py-9 text-white sm:min-h-[420px] sm:px-10 sm:py-12 lg:px-14">
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
        <p className="text-xs font-bold uppercase tracking-[.16em] text-white/75">
          Pharma2U offer
        </p>
        <h2 className="mt-3 text-4xl font-black leading-tight sm:text-5xl">{banner.title}</h2>
        {banner.subtitle && (
          <p className="mt-4 text-base leading-7 text-white/90 sm:text-lg">{banner.subtitle}</p>
        )}
      </div>
      {banners.length > 1 && (
        <div className="absolute bottom-4 right-5 flex gap-1.5">
          {banners.map((item, index) => (
            <button
              key={item.id}
              onClick={() => setActive(index)}
              aria-label={`Show banner ${index + 1}`}
              className={`h-2 rounded-full transition-all ${index === active ? "w-5 bg-white" : "w-2 bg-white/50"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
  return banner.linkUrl ? (
    <Link href={banner.linkUrl} className="block">
      {content}
    </Link>
  ) : (
    content
  );
}
