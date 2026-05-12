"use client";

import Link from "next/link";
import { X, Minus, Plus, ShoppingBag, ArrowRight } from "lucide-react";
import { useUIStore } from "@/lib/store/uiStore";
import { useAuthStore } from "@/lib/store/authStore";
import { useCart, useUpdateCartItem, useRemoveCartItem } from "@/lib/api/cart";
import { StoreConfig } from "@/lib/api/config";

interface Props {
  config: StoreConfig | null;
}

export default function CartDrawer({ config }: Props) {
  const isOpen = useUIStore((s) => s.isCartDrawerOpen);
  const closeCartDrawer = useUIStore((s) => s.closeCartDrawer);
  const user = useAuthStore((s) => s.user);
  const { data: cart } = useCart();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();
  const symbol = config?.currency_symbol ?? "$";
  const freeShippingThreshold = config?.free_shipping_threshold ?? 50;

  const subtotal = cart?.subtotal ?? 0;
  const shippingProgress = Math.min((subtotal / freeShippingThreshold) * 100, 100);
  const amountToFree = Math.max(freeShippingThreshold - subtotal, 0);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" style={{ background: "rgba(13,34,24,0.5)", backdropFilter: "blur(2px)" }}
           onClick={closeCartDrawer} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-[400px] z-50 flex flex-col shadow-2xl"
           style={{ background: "var(--color-surface)" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b"
             style={{ borderColor: "var(--color-border)" }}>
          <div className="flex items-center gap-2.5">
            <ShoppingBag size={18} style={{ color: "var(--color-primary)" }} />
            <h2 className="font-display font-bold text-lg" style={{ color: "var(--color-text-primary)" }}>
              Your Cart
            </h2>
            {cart && cart.item_count > 0 && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: "var(--color-primary)", color: "#FAF7F2" }}>
                {cart.item_count}
              </span>
            )}
          </div>
          <button onClick={closeCartDrawer} className="p-2 rounded-full transition-colors hover:bg-[var(--color-background)]"
                  style={{ color: "var(--color-text-muted)" }}>
            <X size={18} />
          </button>
        </div>

        {/* Free shipping progress */}
        {cart && cart.items.length > 0 && (
          <div className="px-6 py-3 border-b" style={{ borderColor: "var(--color-border)", background: "var(--color-background)" }}>
            {amountToFree > 0 ? (
              <p className="text-xs mb-1.5" style={{ color: "var(--color-text-muted)" }}>
                Add <strong style={{ color: "var(--color-primary)" }}>{symbol}{amountToFree.toFixed(2)}</strong> more for free shipping
              </p>
            ) : (
              <p className="text-xs mb-1.5 font-medium" style={{ color: "#16a34a" }}>
                ✓ You qualify for free shipping!
              </p>
            )}
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--color-border)" }}>
              <div className="h-full rounded-full transition-all duration-500"
                   style={{ width: `${shippingProgress}%`, background: shippingProgress >= 100 ? "#16a34a" : "var(--color-accent)" }} />
            </div>
          </div>
        )}

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {!cart || cart.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center"
                   style={{ background: "var(--color-background)" }}>
                <ShoppingBag size={24} strokeWidth={1.5} style={{ color: "var(--color-text-muted)" }} />
              </div>
              <div>
                <p className="font-display font-semibold text-lg mb-1" style={{ color: "var(--color-text-primary)" }}>
                  Your cart is empty
                </p>
                <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                  Start adding some books you love.
                </p>
              </div>
              <Link href="/products" onClick={closeCartDrawer}
                    className="inline-flex items-center gap-1.5 text-sm font-semibold"
                    style={{ color: "var(--color-accent)" }}>
                Browse books <ArrowRight size={14} />
              </Link>
            </div>
          ) : (
            cart.items.map((item) => (
              <div key={item.product_id} className="flex gap-4">
                {/* Cover */}
                <Link href={`/products/${item.product_id}`} onClick={closeCartDrawer}
                      className="flex-shrink-0 w-14 h-20 rounded-lg overflow-hidden shadow-sm">
                  {item.cover_thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.cover_thumbnail_url} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full" style={{ background: "var(--color-cream-dark)" }} />
                  )}
                </Link>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <Link href={`/products/${item.product_id}`} onClick={closeCartDrawer}>
                    <p className="text-sm font-semibold leading-snug line-clamp-2 hover:opacity-70 transition-opacity"
                       style={{ color: "var(--color-text-primary)" }}>
                      {item.title}
                    </p>
                  </Link>
                  <p className="text-xs mt-0.5 mb-2" style={{ color: "var(--color-text-muted)" }}>
                    {symbol}{Number(item.unit_price).toFixed(2)} each
                  </p>

                  <div className="flex items-center justify-between">
                    {/* Quantity controls */}
                    <div className="flex items-center gap-1 rounded-full border px-1"
                         style={{ borderColor: "var(--color-border)" }}>
                      <button
                        onClick={() => updateItem.mutate({ product_id: item.product_id, quantity: item.quantity - 1 })}
                        className="w-7 h-7 flex items-center justify-center rounded-full transition-colors"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        <Minus size={11} />
                      </button>
                      <span className="text-sm font-semibold w-5 text-center" style={{ color: "var(--color-text-primary)" }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateItem.mutate({ product_id: item.product_id, quantity: item.quantity + 1 })}
                        className="w-7 h-7 flex items-center justify-center rounded-full transition-colors"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        <Plus size={11} />
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold" style={{ color: "var(--color-primary)" }}>
                        {symbol}{Number(item.line_total).toFixed(2)}
                      </span>
                      <button
                        onClick={() => removeItem.mutate(item.product_id)}
                        className="text-xs transition-colors"
                        style={{ color: "var(--color-text-muted)" }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-muted)")}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {cart && cart.items.length > 0 && (
          <div className="border-t px-6 py-5 space-y-4" style={{ borderColor: "var(--color-border)" }}>
            <div className="flex justify-between items-baseline">
              <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>Subtotal</span>
              <span className="font-display font-bold text-xl" style={{ color: "var(--color-text-primary)" }}>
                {symbol}{subtotal.toFixed(2)}
              </span>
            </div>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              Tax and shipping calculated at checkout.
            </p>

            {user ? (
              <Link href="/checkout" onClick={closeCartDrawer}
                    className="flex items-center justify-center gap-2 w-full font-semibold py-4 rounded-2xl text-sm transition-all"
                    style={{ background: "var(--color-primary)", color: "#FAF7F2" }}>
                Proceed to Checkout <ArrowRight size={15} />
              </Link>
            ) : (
              <Link href="/login?next=/checkout" onClick={closeCartDrawer}
                    className="flex items-center justify-center gap-2 w-full font-semibold py-4 rounded-2xl text-sm transition-all"
                    style={{ background: "var(--color-primary)", color: "#FAF7F2" }}>
                Sign in to Checkout <ArrowRight size={15} />
              </Link>
            )}

            <Link href="/products" onClick={closeCartDrawer}
                  className="block text-center text-sm transition-colors"
                  style={{ color: "var(--color-text-muted)" }}>
              Continue Shopping
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
