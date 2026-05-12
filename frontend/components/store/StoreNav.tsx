"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, ShoppingBag, User, Menu, X, ChevronRight } from "lucide-react";
import { StoreConfig } from "@/lib/api/config";
import { useCart } from "@/lib/api/cart";
import { useAuthStore } from "@/lib/store/authStore";
import { useUIStore } from "@/lib/store/uiStore";
import Logo from "./Logo";

interface Props {
  config: StoreConfig | null;
}

export default function StoreNav({ config }: Props) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: cart } = useCart();
  const user = useAuthStore((s) => s.user);
  const openCartDrawer = useUIStore((s) => s.openCartDrawer);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const cartCount = cart?.item_count ?? 0;

  const navLinks = [
    { href: "/products", label: "All Books" },
    { href: "/products?is_bestseller=true", label: "Bestsellers" },
    { href: "/products?is_featured=true", label: "Staff Picks" },
    { href: "/products?is_new_arrival=true", label: "New Arrivals" },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 glass ${
          scrolled || mobileOpen ? "shadow-lg" : ""
        }`}
      >
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-18 flex items-center justify-between gap-6"
             style={{ height: "72px" }}>
          {/* Logo */}
          <Link href="/" onClick={() => setMobileOpen(false)}>
            <Logo light />
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden lg:flex items-center gap-7">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium transition-colors duration-200"
                style={{ color: "rgba(250,247,242,0.75)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#FAF7F2")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(250,247,242,0.75)")}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2.5 rounded-full transition-colors duration-200 hover:bg-white/10"
              aria-label="Search"
            >
              <Search size={18} style={{ color: "rgba(250,247,242,0.8)" }} />
            </button>

            {/* Cart */}
            <button
              onClick={openCartDrawer}
              className="relative p-2.5 rounded-full transition-colors duration-200 hover:bg-white/10"
              aria-label="Cart"
            >
              <ShoppingBag size={18} style={{ color: "rgba(250,247,242,0.8)" }} />
              {cartCount > 0 && (
                <span
                  className="absolute -top-0.5 -right-0.5 text-[10px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-bold"
                  style={{ background: "var(--color-accent)", color: "var(--color-primary-dark)", width: "18px", height: "18px", fontSize: "10px" }}
                >
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </button>

            {/* Account */}
            {user ? (
              <Link
                href="/account"
                className="p-2.5 rounded-full transition-colors duration-200 hover:bg-white/10"
                aria-label="Account"
              >
                <User size={18} style={{ color: "rgba(250,247,242,0.8)" }} />
              </Link>
            ) : (
              <Link
                href="/login"
                className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full transition-all duration-200"
                style={{
                  background: "var(--color-accent)",
                  color: "var(--color-primary-dark)",
                }}
              >
                Sign in
              </Link>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="lg:hidden p-2.5 rounded-full hover:bg-white/10 transition-colors"
              aria-label="Menu"
            >
              {mobileOpen
                ? <X size={18} style={{ color: "#FAF7F2" }} />
                : <Menu size={18} style={{ color: "rgba(250,247,242,0.8)" }} />
              }
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t" style={{ borderColor: "rgba(250,247,242,0.1)" }}>
            <nav className="px-5 py-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-between py-3 text-sm font-medium border-b"
                  style={{ color: "rgba(250,247,242,0.85)", borderColor: "rgba(250,247,242,0.08)" }}
                >
                  {link.label}
                  <ChevronRight size={14} style={{ color: "rgba(250,247,242,0.4)" }} />
                </Link>
              ))}
              {!user && (
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className="block mt-3 text-center py-3 rounded-xl text-sm font-semibold"
                  style={{ background: "var(--color-accent)", color: "var(--color-primary-dark)" }}
                >
                  Sign in
                </Link>
              )}
            </nav>
          </div>
        )}
      </header>

      {/* Search overlay */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-start justify-center pt-24 px-4"
          style={{ background: "rgba(13,34,24,0.85)", backdropFilter: "blur(8px)" }}
          onClick={() => setSearchOpen(false)}
        >
          <div
            className="w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-5 py-4" style={{ background: "#FAF7F2" }}>
              <Search size={18} style={{ color: "var(--color-text-secondary)", flexShrink: 0 }} />
              <input
                autoFocus
                type="text"
                placeholder="Search books, authors, genres…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && searchQuery.trim()) {
                    setSearchOpen(false);
                    window.location.href = `/products?search=${encodeURIComponent(searchQuery.trim())}`;
                  }
                  if (e.key === "Escape") setSearchOpen(false);
                }}
                className="flex-1 bg-transparent text-base outline-none"
                style={{ color: "var(--color-text-primary)" }}
              />
              <button onClick={() => setSearchOpen(false)}>
                <X size={18} style={{ color: "var(--color-text-secondary)" }} />
              </button>
            </div>
            <div className="px-5 py-3 text-xs" style={{ background: "#F0EBE3", color: "var(--color-text-secondary)" }}>
              Press <kbd className="px-1.5 py-0.5 rounded bg-white/60 font-mono text-xs">Enter</kbd> to search · <kbd className="px-1.5 py-0.5 rounded bg-white/60 font-mono text-xs">Esc</kbd> to close
            </div>
          </div>
        </div>
      )}

      {/* Spacer so content doesn't sit under fixed nav */}
      <div style={{ height: "72px" }} />
    </>
  );
}
