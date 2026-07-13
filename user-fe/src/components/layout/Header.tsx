"use client";

import { FormEvent, useState } from "react";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import LocationModal from "@/src/components/location/LocationModal";
import { useAddressStore } from "@/src/store/addressStore";

import {
  ChevronDown,
  MapPin,
  Package,
  Search,
  ShoppingCart,
  UserRound,
} from "lucide-react";

import { useCartStore } from "@/src/store/cartStore";
import { AccountMenu } from "@/src/components/account/AccountMenu";

export default function Header() {
  const [locationModalOpen, setLocationModalOpen] = useState(false);

  const addresses = useAddressStore((state) => state.addresses);

  const selectedAddressId = useAddressStore((state) => state.selectedAddressId);

  const selectedAddress = addresses.find(
    (address) => address.id === selectedAddressId,
  );

  const locationText =
    selectedAddress?.label || selectedAddress?.city || "{locationText}";

  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");

  /*
   * CART
   */

  const cartItems = useCartStore((state) => state.items);

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  /*
   * SEARCH
   */

  const handleSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedQuery = searchQuery.trim();

    if (!trimmedQuery) {
      router.push("/search");
      return;
    }

    router.push(`/search?q=${encodeURIComponent(trimmedQuery)}`);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#E8ECEF] bg-white">
      <div className="container-custom">
        {/* ================= DESKTOP HEADER ================= */}

        <div className="hidden h-[82px] items-center gap-5 md:flex">
          {/* LOGO */}

          <Link href="/" className="flex shrink-0 items-center">
            <Image
              src="/images/logo/logo.png"
              alt="GoCure"
              width={190}
              height={70}
              priority
              className="h-[62px] w-[145px] object-contain"
            />
          </Link>

          {/* LOCATION */}

          <button
            type="button"
            onClick={() => setLocationModalOpen(true)}
            className="flex max-w-[210px] shrink-0 items-center gap-2 rounded-xl px-3 py-2 transition hover:bg-[#F6F8F9]"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EAFAF5] text-[#2EB68F]">
              <MapPin size={19} />
            </div>

            <div className="min-w-0 text-left">
              <p className="text-xs text-[#6B7280]">Delivering to</p>

              <div className="flex items-center gap-1">
                <span className="truncate text-sm font-semibold text-[#17212B]">
                  Select location
                </span>

                <ChevronDown size={14} />
              </div>
            </div>
          </button>

          {/* DESKTOP SEARCH */}

          <form
            onSubmit={handleSearch}
            className="mx-auto flex max-w-[650px] flex-1 items-center rounded-xl border border-[#DDE3E7] bg-[#F8FAFA] transition focus-within:border-[#45C9A5] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#45C9A5]/10"
          >
            <Search size={20} className="ml-4 shrink-0 text-[#6B7280]" />

            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search medicines and healthcare products"
              className="h-12 w-full bg-transparent px-3 text-sm text-[#17212B] outline-none placeholder:text-[#8B949E]"
            />

            <button
              type="submit"
              aria-label="Search"
              className="mr-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#45C9A5] text-[#17212B] transition hover:bg-[#2EB68F] hover:text-white"
            >
              <Search size={17} />
            </button>
          </form>

          {/* RIGHT ACTIONS */}

          <nav className="flex shrink-0 items-center gap-2">
            {/* ORDERS */}

            <Link
              href="/orders"
              className="flex h-11 items-center gap-2 rounded-xl px-3 text-sm font-medium text-[#374151] transition hover:bg-[#EAFAF5] hover:text-[#2EB68F]"
            >
              <Package size={20} />

              <span className="hidden lg:block">Orders</span>
            </Link>

            {/* CART */}

            <Link
              href="/cart"
              className="relative flex h-11 items-center gap-2 rounded-xl px-3 text-sm font-medium text-[#374151] transition hover:bg-[#EAFAF5] hover:text-[#2EB68F]"
            >
              <div className="relative">
                <ShoppingCart size={21} />

                {/* LIVE CART COUNT */}

                {cartCount > 0 && (
                  <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#45C9A5] px-1 text-[9px] font-bold text-white">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </div>

              <span className="hidden lg:block">Cart</span>
            </Link>

            {/* LOGIN */}
            <AccountMenu />
          </nav>
        </div>

        {/* ================= MOBILE HEADER ================= */}

        <div className="flex flex-col gap-3 py-3 md:hidden">
          {/* MOBILE TOP ROW */}

          <div className="flex items-center justify-between gap-2">
            {/* LOGO + LOCATION */}

            <div className="flex min-w-0 flex-1 items-center gap-2">
              {/* MOBILE LOGO */}

              <Link href="/" className="flex shrink-0 items-center">
                <Image
                  src="/images/logo/logo.png"
                  alt="GoCure"
                  width={150}
                  height={65}
                  priority
                  className="h-[65px] w-[150px] object-contain"
                />
              </Link>

              {/* MOBILE LOCATION */}

              <button
                type="button"
                onClick={() => setLocationModalOpen(true)}
                className="flex min-w-0 items-center gap-1 rounded-lg px-1 py-2 text-left transition hover:bg-[#F6F8F9]"
              >
                <MapPin size={16} className="shrink-0 text-[#2EB68F]" />

                <div className="min-w-0">
                  <p className="text-[10px] leading-tight text-[#6B7280]">
                    Delivering to
                  </p>

                  <div className="flex items-center gap-0.5">
                    <span className="max-w-[85px] truncate text-xs font-semibold text-[#17212B]">
                      Select location
                    </span>

                    <ChevronDown size={12} className="shrink-0" />
                  </div>
                </div>
              </button>
            </div>

            {/* MOBILE ACTIONS */}

            <div className="flex shrink-0 items-center gap-1">
              {/* MOBILE CART */}

              <Link
                href="/cart"
                aria-label={`Cart with ${cartCount} items`}
                className="relative flex h-10 w-10 items-center justify-center rounded-full text-[#17212B] transition hover:bg-[#EAFAF5]"
              >
                <ShoppingCart size={21} />

                {/* LIVE MOBILE CART COUNT */}

                {cartCount > 0 && (
                  <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#45C9A5] px-1 text-[9px] font-bold text-white">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </Link>

              {/* MOBILE USER */}
              <AccountMenu compact />
            </div>
          </div>

          {/* MOBILE SEARCH */}

          <form
            onSubmit={handleSearch}
            className="flex items-center rounded-xl border border-[#DDE3E7] bg-[#F8FAFA] transition focus-within:border-[#45C9A5] focus-within:bg-white focus-within:ring-4 focus-within:ring-[#45C9A5]/10"
          >
            <Search size={19} className="ml-4 shrink-0 text-[#6B7280]" />

            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search medicines and products"
              className="h-12 w-full bg-transparent px-3 text-sm text-[#17212B] outline-none placeholder:text-[#8B949E]"
            />

            <button
              type="submit"
              aria-label="Search"
              className="mr-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#45C9A5] text-[#17212B] transition hover:bg-[#2EB68F] hover:text-white"
            >
              <Search size={16} />
            </button>
          </form>
        </div>
      </div>

      <LocationModal
        open={locationModalOpen}
        onClose={() => setLocationModalOpen(false)}
      />
    </header>
  );
}
