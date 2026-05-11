"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
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

  return (
    <Link href={`/products/${product.id}`} className="group block">
      <div className="card-hover rounded-xl overflow-hidden bg-[var(--color-surface)] border border-[var(--color-border)] shadow-sm">
        {/* Cover */}
        <div className="aspect-[3/4] bg-[var(--color-border)] overflow-hidden relative">
          {product.cover_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.cover_image_url}
              alt={product.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[var(--color-text-secondary)] p-4 text-center text-xs">
              {product.title}
            </div>
          )}

          {/* Add to cart overlay on hover */}
          {product.is_in_stock && (
            <button
              onClick={handleAddToCart}
              disabled={addToCart.isPending}
              className="absolute bottom-0 left-0 right-0 bg-[var(--color-accent)] text-white py-2.5 text-xs font-medium
                opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center gap-1.5"
            >
              <ShoppingCart size={14} />
              Add to Cart
            </button>
          )}

          {!product.is_in_stock && (
            <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
              Out of stock
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          <h3 className="text-sm font-medium text-[var(--color-text-primary)] line-clamp-2 leading-snug">
            {product.title}
          </h3>
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm font-semibold text-[var(--color-accent)]">
              {currencySymbol}{Number(product.price).toFixed(2)}
            </span>
            {product.format && (
              <span className="text-xs text-[var(--color-text-secondary)] bg-[var(--color-border)] px-2 py-0.5 rounded-full">
                {product.format}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
