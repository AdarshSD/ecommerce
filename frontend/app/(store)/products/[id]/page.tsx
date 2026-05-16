"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, ShoppingBag, Heart, Star, BookOpen, Award, Share2 } from "lucide-react";
import { useProduct, useProducts } from "@/lib/api/products";
import { useAddToCart } from "@/lib/api/cart";
import { useUIStore } from "@/lib/store/uiStore";
import ProductCard from "@/components/store/ProductCard";

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: product, isLoading } = useProduct(id);
  const addToCart = useAddToCart();
  const { addToast } = useUIStore();

  // Related: same primary category, exclude current
  const primaryCatId = product?.categories?.[0]?.id;
  const { data: related } = useProducts({ category_id: primaryCatId, page_size: 5 });
  const relatedBooks = primaryCatId ? (related?.data.filter((p) => p.id !== id).slice(0, 4) ?? []) : [];

  function handleAddToCart() {
    if (!product) return;
    addToCart.mutate(
      { product_id: product.id, quantity: 1 },
      {
        onSuccess: () => addToast({ message: `"${product.title}" added to cart`, type: "success" }),
        onError: () => addToast({ message: "Could not add to cart", type: "error" }),
      }
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ background: "var(--color-background)" }}>
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-10">
          <div className="h-4 w-32 rounded animate-pulse mb-8" style={{ background: "var(--color-border)" }} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="aspect-[3/4] rounded-2xl animate-pulse" style={{ background: "var(--color-border)" }} />
            <div className="space-y-4">
              {[32, 24, 16, 48, 16, 16].map((h, i) => (
                <div key={i} className="rounded animate-pulse" style={{ height: h, background: "var(--color-border)", width: i === 0 ? "80%" : i === 2 ? "40%" : "100%" }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-background)" }}>
        <div className="text-center">
          <p className="font-display text-2xl mb-4" style={{ color: "var(--color-text-primary)" }}>Book not found</p>
          <Link href="/products" className="text-sm font-medium" style={{ color: "var(--color-accent)" }}>
            ← Back to all books
          </Link>
        </div>
      </div>
    );
  }

  const discountPct = product.original_price
    ? Math.round((1 - product.price / product.original_price) * 100)
    : null;

  const coverUrl = product.cover_full_url ?? product.cover_image_url;

  const meta = [
    { icon: BookOpen, label: "Pages",  value: product.pages ?? product.page_count ?? "—" },
    { icon: Award,    label: "Format", value: product.format ?? "—" },
    { icon: BookOpen, label: "Year",   value: product.year ?? (product.published_at ? new Date(product.published_at).getFullYear() : "—") },
    { icon: Star,     label: "Rating", value: product.rating ? `${product.rating}/5` : "—" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--color-background)" }}>
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-8 pb-2">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-sm transition-colors group"
          style={{ color: "var(--color-text-muted)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-primary)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-muted)")}
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          Back to Browse
        </Link>
      </div>

      {/* Main */}
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 xl:gap-20">
          {/* Cover */}
          <div className="flex justify-center lg:justify-start">
            <div className="relative">
              <div
                className="relative rounded-2xl overflow-hidden"
                style={{
                  width: "clamp(260px, 32vw, 380px)",
                  boxShadow: "0 32px 80px rgba(13,34,24,0.25), 0 8px 16px rgba(13,34,24,0.1)",
                }}
              >
                {coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={coverUrl} alt={product.title} className="w-full h-auto block" />
                ) : (
                  <div className="aspect-[3/4] flex items-center justify-center p-8 text-center"
                       style={{ background: "var(--color-cream-dark)", color: "var(--color-text-muted)" }}>
                    {product.title}
                  </div>
                )}
              </div>

              {/* Shadow blob */}
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-4/5 h-8 blur-2xl rounded-full opacity-30"
                   style={{ background: "var(--color-primary)" }} />

              {/* Badge */}
              {product.badge && (
                <div className="absolute -top-3 -right-3 text-xs font-bold px-3 py-1.5 rounded-full shadow-lg"
                     style={{ background: "var(--color-accent)", color: "var(--color-primary-dark)" }}>
                  {product.badge}
                </div>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="space-y-6">
            {/* Genre */}
            {product.primary_genre && (
              <p className="text-xs tracking-[0.2em] uppercase font-semibold"
                 style={{ color: "var(--color-accent)" }}>
                {product.primary_genre}
              </p>
            )}

            {/* Title */}
            <h1 className="font-display font-bold leading-tight"
                style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)", color: "var(--color-text-primary)" }}>
              {product.title}
            </h1>

            {/* Author */}
            <p className="text-lg" style={{ color: "var(--color-text-secondary)" }}>
              by{" "}
              <span className="font-medium" style={{ color: "var(--color-text-primary)" }}>
                {product.linked_entities?.map((e) => e.name).join(", ") ?? product.primary_author ?? "Unknown"}
              </span>
            </p>

            {/* Ratings */}
            {product.rating && (
              <div className="flex items-center gap-4 pb-1">
                <div className="flex items-center gap-1.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={16}
                      fill={i < Math.floor(product.rating!) ? "var(--color-accent)" : "none"}
                      style={{ color: i < Math.floor(product.rating!) ? "var(--color-accent)" : "var(--color-border)" }}
                    />
                  ))}
                  <span className="font-semibold ml-1" style={{ color: "var(--color-text-primary)" }}>
                    {product.rating}
                  </span>
                </div>
                {product.reviews_count > 0 && (
                  <span className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                    {product.reviews_count.toLocaleString()} reviews
                  </span>
                )}
              </div>
            )}

            {/* Description */}
            <p className="leading-relaxed text-base" style={{ color: "var(--color-text-secondary)" }}>
              {product.long_description ?? product.description ?? ""}
            </p>

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {product.tags.map((tag) => (
                  <span key={tag} className="text-xs px-3 py-1 rounded-full font-medium"
                        style={{ background: "var(--color-cream-dark)", color: "var(--color-text-secondary)" }}>
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Metadata grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 rounded-2xl p-5 border"
                 style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
              {meta.map(({ icon: Icon, label, value }) => (
                <div key={label} className="text-center">
                  <Icon size={16} className="mx-auto mb-1" style={{ color: "var(--color-accent)" }} />
                  <p className="text-xs mb-0.5" style={{ color: "var(--color-text-muted)" }}>{label}</p>
                  <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>{value}</p>
                </div>
              ))}
            </div>

            {/* Price + CTA */}
            <div className="space-y-4 pt-2">
              <div className="flex items-baseline gap-3">
                <span className="font-display font-bold" style={{ fontSize: "2.25rem", color: "var(--color-primary)" }}>
                  ${Number(product.price).toFixed(2)}
                </span>
                {product.original_price && (
                  <span className="text-lg line-through" style={{ color: "var(--color-border)" }}>
                    ${Number(product.original_price).toFixed(2)}
                  </span>
                )}
                {discountPct && (
                  <span className="text-sm font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: "#dcfce7", color: "#16a34a" }}>
                    {discountPct}% off
                  </span>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleAddToCart}
                  disabled={!product.is_in_stock || addToCart.isPending}
                  className="flex-1 flex items-center justify-center gap-2.5 font-semibold py-4 rounded-2xl transition-all text-sm tracking-wide"
                  style={{
                    background: product.is_in_stock ? "var(--color-primary)" : "var(--color-border)",
                    color: product.is_in_stock ? "#FAF7F2" : "var(--color-text-muted)",
                    cursor: product.is_in_stock ? "pointer" : "not-allowed",
                  }}
                >
                  <ShoppingBag size={18} />
                  {!product.is_in_stock ? "Out of Stock" : addToCart.isPending ? "Adding…" : "Add to Cart"}
                </button>
                <button
                  className="w-14 h-14 flex items-center justify-center rounded-2xl border-2 transition-all"
                  style={{ borderColor: "var(--color-border)" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--color-accent)";
                    (e.currentTarget as HTMLElement).style.background = "rgba(201,168,76,0.05)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border)";
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                  }}
                  aria-label="Wishlist"
                >
                  <Heart size={18} style={{ color: "var(--color-text-muted)" }} />
                </button>
                <button
                  className="w-14 h-14 flex items-center justify-center rounded-2xl border-2 transition-all"
                  style={{ borderColor: "var(--color-border)" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--color-primary)";
                    (e.currentTarget as HTMLElement).style.background = "rgba(26,58,42,0.05)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--color-border)";
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                  }}
                  aria-label="Share"
                >
                  <Share2 size={16} style={{ color: "var(--color-text-muted)" }} />
                </button>
              </div>

              <p className="text-xs flex items-center gap-2" style={{ color: "var(--color-text-muted)" }}>
                <span className="w-2 h-2 rounded-full inline-block" style={{ background: product.is_in_stock ? "#4ade80" : "#f87171" }} />
                {product.is_in_stock ? "In stock · Free shipping on orders over $50" : "Currently out of stock"}
              </p>
            </div>
          </div>
        </div>

        {/* Related books */}
        {relatedBooks.length > 0 && (
          <div className="mt-24">
            <div className="mb-10">
              <p className="text-xs tracking-[0.2em] uppercase font-medium mb-2" style={{ color: "var(--color-accent)" }}>
                You May Also Like
              </p>
              <h2 className="font-display font-bold text-3xl" style={{ color: "var(--color-text-primary)" }}>
                More in {product.primary_genre ?? "This Genre"}
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {relatedBooks.map((b) => (
                <ProductCard key={b.id} product={b} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
