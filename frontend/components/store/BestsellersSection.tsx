"use client";

import Link from "next/link";
import { TrendingUp, Star, ArrowRight } from "lucide-react";
import { useSectionProducts } from "@/lib/api/products";

export default function BestsellersSection() {
  const { data: products, isLoading } = useSectionProducts("section-bestsellers");

  return (
    <section className="py-24" style={{ background: "var(--color-background)" }}>
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        {/* Header */}
        <div className="flex items-end justify-between mb-12">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                 style={{ background: "var(--color-primary)" }}>
              <TrendingUp size={14} style={{ color: "var(--color-accent)" }} />
            </div>
            <div>
              <p className="text-xs tracking-[0.2em] uppercase font-medium" style={{ color: "var(--color-accent)" }}>
                Charts
              </p>
              <h2 className="font-display font-bold text-3xl" style={{ color: "var(--color-text-primary)" }}>
                Bestsellers
              </h2>
            </div>
          </div>
          <Link
            href="/products?is_bestseller=true"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium transition-colors group"
            style={{ color: "var(--color-accent)" }}
          >
            View all <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: "var(--color-border)" }} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {(products ?? []).slice(0, 6).map((book, idx) => (
              <Link
                key={book.id}
                href={`/products/${book.id}`}
                className="group flex items-center gap-5 p-4 rounded-2xl transition-all duration-200 border border-transparent"
                style={{ background: "transparent" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "var(--color-surface)";
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                  (e.currentTarget as HTMLElement).style.borderColor = "transparent";
                }}
              >
                {/* Rank */}
                <div
                  className="flex-shrink-0 font-display font-bold text-4xl leading-none w-10 text-center"
                  style={{ color: idx < 3 ? "var(--color-accent)" : "var(--color-border)" }}
                >
                  {String(idx + 1).padStart(2, "0")}
                </div>

                {/* Cover */}
                <div className="w-14 h-20 flex-shrink-0 rounded-lg overflow-hidden shadow-md group-hover:shadow-lg transition-shadow">
                  {book.cover_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={book.cover_image_url} alt={book.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full" style={{ background: "var(--color-cream-dark)" }} />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  {book.primary_genre && (
                    <p className="text-[10px] tracking-widest uppercase font-medium mb-0.5"
                       style={{ color: "var(--color-accent)" }}>
                      {book.primary_genre}
                    </p>
                  )}
                  <h3 className="font-semibold text-sm leading-tight line-clamp-1 transition-colors"
                      style={{ color: "var(--color-text-primary)" }}>
                    {book.title}
                  </h3>
                  <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                    {book.primary_author}
                  </p>
                  {book.rating && (
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} size={9}
                            fill={i < Math.floor(book.rating!) ? "var(--color-accent)" : "none"}
                            style={{ color: i < Math.floor(book.rating!) ? "var(--color-accent)" : "var(--color-border)" }}
                          />
                        ))}
                      </div>
                      <span className="text-[10px]" style={{ color: "var(--color-text-muted)" }}>{book.rating}</span>
                    </div>
                  )}
                </div>

                {/* Price */}
                <div className="flex-shrink-0 text-right">
                  <p className="font-semibold text-sm" style={{ color: "var(--color-primary)" }}>
                    ${Number(book.price).toFixed(2)}
                  </p>
                  {book.badge && (
                    <span className="text-[9px] px-2 py-0.5 rounded-full mt-1 inline-block font-medium tracking-wide"
                          style={{ background: "var(--color-primary)", color: "#fff" }}>
                      {book.badge}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
