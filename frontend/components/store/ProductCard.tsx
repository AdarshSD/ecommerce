"use client";

import Link from "next/link";
import { ShoppingBag, Heart, Star } from "lucide-react";
import { Product } from "@/lib/api/products";
import { useAddToCart } from "@/lib/api/cart";
import { useUIStore } from "@/lib/store/uiStore";

interface Props {
  product: Product;
  currencySymbol?: string;
}

export default function ProductCard({ product, currencySymbol = "$" }: Props) {
  const addToCart = useAddToCart();
  const { addToast, openCartDrawer } = useUIStore();

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    if (!product.is_in_stock) return;
    addToCart.mutate(
      { product_id: product.id, quantity: 1 },
      {
        onSuccess: () => {
          addToast({ message: `"${product.title}" added to cart`, type: "success" });
          openCartDrawer();
        },
        onError: () => addToast({ message: "Could not add to cart", type: "error" }),
      }
    );
  }

  const discountPct = product.original_price
    ? Math.round((1 - product.price / product.original_price) * 100)
    : null;

  return (
    <Link href={`/products/${product.id}`} className="group block book-card">
      {/* Cover */}
      <div className="relative aspect-[3/4] rounded-xl overflow-hidden mb-3 shadow-md group-hover:shadow-xl transition-shadow duration-300">
        {product.cover_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.cover_image_url}
            alt={product.title}
            className="book-cover w-full h-full object-cover transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center p-4 text-center text-xs"
               style={{ background: "var(--color-cream-dark)", color: "var(--color-text-muted)" }}>
            {product.title}
          </div>
        )}

        {/* Hover overlay */}
        <div className="card-overlay absolute inset-0 opacity-0 transition-opacity duration-300 flex flex-col justify-end"
             style={{ background: "linear-gradient(to top, rgba(13,34,24,0.92) 0%, rgba(13,34,24,0.4) 60%, transparent 100%)" }}>
          {product.is_in_stock && (
            <button
              onClick={handleAddToCart}
              disabled={addToCart.isPending}
              className="mx-3 mb-3 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold transition-all"
              style={{ background: "var(--color-accent)", color: "var(--color-primary-dark)" }}
            >
              <ShoppingBag size={13} />
              {addToCart.isPending ? "Adding…" : "Add to Cart"}
            </button>
          )}
        </div>

        {/* Wishlist button */}
        <button
          onClick={(e) => e.preventDefault()}
          className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-sm"
          style={{ background: "rgba(255,255,255,0.15)" }}
          aria-label="Wishlist"
        >
          <Heart size={12} style={{ color: "#FAF7F2" }} />
        </button>

        {/* Badge */}
        {product.badge && (
          <div className="absolute top-2 left-2 text-[9px] font-bold px-2 py-0.5 rounded-full"
               style={{ background: "var(--color-primary)", color: "var(--color-accent)" }}>
            {product.badge}
          </div>
        )}

        {/* Discount % */}
        {discountPct && (
          <div className="absolute bottom-2 left-2 text-[9px] font-bold px-2 py-0.5 rounded-full"
               style={{ background: "#16a34a", color: "#fff" }}>
            -{discountPct}%
          </div>
        )}

        {!product.is_in_stock && (
          <div className="absolute bottom-2 left-2 text-[9px] font-bold px-2 py-0.5 rounded-full bg-red-500 text-white">
            Out of stock
          </div>
        )}
      </div>

      {/* Info */}
      <div>
        {product.primary_genre && (
          <p className="text-[9px] tracking-widest uppercase font-medium mb-0.5"
             style={{ color: "var(--color-accent)" }}>
            {product.primary_genre}
          </p>
        )}

        <h3 className="font-display font-semibold text-sm leading-tight line-clamp-2 mb-0.5 group-hover:opacity-80 transition-opacity"
            style={{ color: "var(--color-text-primary)" }}>
          {product.title}
        </h3>

        {product.primary_author && (
          <p className="text-xs mb-1.5" style={{ color: "var(--color-text-muted)" }}>
            {product.primary_author}
          </p>
        )}

        {/* Stars */}
        {product.rating && (
          <div className="flex items-center gap-1 mb-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={9}
                fill={i < Math.floor(product.rating!) ? "var(--color-accent)" : "none"}
                style={{ color: i < Math.floor(product.rating!) ? "var(--color-accent)" : "var(--color-border)" }}
              />
            ))}
            <span className="text-[9px] ml-0.5" style={{ color: "var(--color-text-muted)" }}>
              {product.rating}
            </span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-bold" style={{ color: "var(--color-primary)" }}>
            {currencySymbol}{Number(product.price).toFixed(2)}
          </span>
          {product.original_price && (
            <span className="text-xs line-through" style={{ color: "var(--color-text-muted)" }}>
              {currencySymbol}{Number(product.original_price).toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
