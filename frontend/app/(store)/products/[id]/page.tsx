"use client";

import { use } from "react";
import Link from "next/link";
import { ShoppingCart, ArrowLeft } from "lucide-react";
import { useProduct } from "@/lib/api/products";
import { useAddToCart } from "@/lib/api/cart";
import { useUIStore } from "@/lib/store/uiStore";

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: product, isLoading } = useProduct(id);
  const addToCart = useAddToCart();
  const { addToast, openCartDrawer } = useUIStore();

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="aspect-[3/4] bg-[var(--color-border)] rounded-xl animate-pulse" />
          <div className="space-y-4">
            <div className="h-8 bg-[var(--color-border)] rounded animate-pulse w-3/4" />
            <div className="h-4 bg-[var(--color-border)] rounded animate-pulse w-1/2" />
            <div className="h-12 bg-[var(--color-border)] rounded animate-pulse w-1/4" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <p className="text-[var(--color-text-secondary)]">Book not found.</p>
        <Link href="/products" className="mt-4 inline-block text-[var(--color-accent)] hover:underline text-sm">
          ← Back to all books
        </Link>
      </div>
    );
  }

  function handleAddToCart() {
    addToCart.mutate(
      { product_id: product!.id, quantity: 1 },
      {
        onSuccess: () => {
          addToast({ message: `"${product!.title}" added to cart`, type: "success" });
          openCartDrawer();
        },
        onError: () => addToast({ message: "Could not add to cart", type: "error" }),
      }
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <Link href="/products" className="inline-flex items-center gap-1 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] mb-8 transition-base">
        <ArrowLeft size={14} /> All books
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Cover */}
        <div className="aspect-[3/4] bg-[var(--color-border)] rounded-xl overflow-hidden">
          {product.cover_full_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.cover_full_url} alt={product.title} className="w-full h-full object-cover" />
          ) : product.cover_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.cover_image_url} alt={product.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[var(--color-text-secondary)] p-8 text-center text-sm">
              {product.title}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-5">
          <div>
            <h1 className="text-3xl font-semibold text-[var(--color-text-primary)] leading-tight">{product.title}</h1>
            {product.linked_entities && product.linked_entities.length > 0 && (
              <p className="text-[var(--color-text-secondary)] mt-2 text-sm">
                by {product.linked_entities.map((e) => e.name).join(", ")}
              </p>
            )}
          </div>

          <p className="text-3xl font-bold text-[var(--color-accent)]">${Number(product.price).toFixed(2)}</p>

          {product.categories && product.categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {product.categories.map((c) => (
                <span key={c.id} className="text-xs bg-[var(--color-border)] text-[var(--color-text-secondary)] px-3 py-1 rounded-full">
                  {c.name}
                </span>
              ))}
            </div>
          )}

          {product.description && (
            <p className="text-sm text-[var(--color-text-primary)] leading-relaxed">{product.description}</p>
          )}

          <div className="grid grid-cols-2 gap-2 text-sm text-[var(--color-text-secondary)]">
            {product.format && <span>Format: <span className="text-[var(--color-text-primary)]">{product.format}</span></span>}
            {product.page_count && <span>Pages: <span className="text-[var(--color-text-primary)]">{product.page_count}</span></span>}
            {product.publisher && <span>Publisher: <span className="text-[var(--color-text-primary)]">{product.publisher}</span></span>}
            {product.published_at && <span>Published: <span className="text-[var(--color-text-primary)]">{new Date(product.published_at).getFullYear()}</span></span>}
          </div>

          {product.is_in_stock ? (
            <button
              onClick={handleAddToCart}
              disabled={addToCart.isPending}
              className="w-full bg-[var(--color-accent)] text-white font-medium py-3.5 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-base disabled:opacity-60 text-sm"
            >
              <ShoppingCart size={18} />
              {addToCart.isPending ? "Adding…" : "Add to Cart"}
            </button>
          ) : (
            <button disabled className="w-full bg-[var(--color-border)] text-[var(--color-text-secondary)] font-medium py-3.5 rounded-xl cursor-not-allowed text-sm">
              Out of Stock
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
