"use client";

import Link from "next/link";
import { ShoppingCart, User, Search } from "lucide-react";
import { StoreConfig } from "@/lib/api/config";
import { useCart } from "@/lib/api/cart";
import { useAuthStore } from "@/lib/store/authStore";
import { useUIStore } from "@/lib/store/uiStore";

interface Props {
  config: StoreConfig | null;
}

export default function StoreNav({ config }: Props) {
  const { data: cart } = useCart();
  const user = useAuthStore((s) => s.user);
  const openCartDrawer = useUIStore((s) => s.openCartDrawer);
  const storeName = config?.store_name ?? "Leaf & Lore";

  return (
    <header className="sticky top-0 z-40 bg-primary shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="text-white font-semibold text-xl tracking-tight whitespace-nowrap">
          {storeName}
        </Link>

        {/* Search */}
        <div className="hidden md:flex flex-1 max-w-lg">
          <Link
            href="/products"
            className="w-full flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white/70 rounded-lg px-4 py-2 text-sm transition-base"
          >
            <Search size={15} />
            <span>Search books…</span>
          </Link>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={openCartDrawer}
            className="relative p-2 text-white/80 hover:text-white transition-base"
            aria-label="Cart"
          >
            <ShoppingCart size={20} />
            {cart && cart.item_count > 0 && (
              <span className="absolute -top-1 -right-1 bg-accent text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-semibold">
                {cart.item_count}
              </span>
            )}
          </button>

          {user ? (
            <Link href="/account" className="p-2 text-white/80 hover:text-white transition-base" aria-label="Account">
              <User size={20} />
            </Link>
          ) : (
            <Link
              href="/login"
              className="text-sm text-white/80 hover:text-white font-medium transition-base"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
