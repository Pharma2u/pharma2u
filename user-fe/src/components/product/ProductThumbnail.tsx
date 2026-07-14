"use client";

import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { useState } from "react";

export function ProductThumbnail({
  src,
  alt,
  className = "h-14 w-14",
}: {
  src?: string | null;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <div className={`relative shrink-0 overflow-hidden rounded-xl bg-[#F7FAF9] ${className}`}>
      {src && !failed ? (
        <Image
          src={src}
          alt={alt}
          fill
          unoptimized
          sizes="80px"
          onError={() => setFailed(true)}
          className="object-contain p-1"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-[#2EB68F]">
          <ImageIcon size={22} />
        </div>
      )}
    </div>
  );
}