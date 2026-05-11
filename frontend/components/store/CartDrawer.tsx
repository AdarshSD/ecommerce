"use client";

import Link from "next/link";
import { X, Minus, Plus, ShoppingBag } from "lucide-react";
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

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={closeCartDrawer}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-[var(--color-surface)] z-50 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
          <h2 className="font-semibold text-[var(--color-text-primary)]">
            Your Cart {cart && cart.item_count > 0 && `(${cart.item_count})`}
          </h2>
          <button
            onClick={closeCartDrawer}
            className="p-1 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-base"
          >
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {!cart || cart.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3 text-[var(--color-text-secondary)]">
              <ShoppingBag size={40} strokeWidth={1.5} />
              <p className="text-sm">Your cart is empty.</p>
              <Link
                href="/products"
                onClick={closeCartDrawer}
                className="text-sm font-medium text-[var(--color-accent)] hover:underline"
              >
                Browse books →
              </Link>
            </div>
          ) : (
            cart.items.map((item) => (
              <div key={item.product_id} className="flex gap-3">
                {/* Cover placeholder */}
                <div className="w-12 h-16 bg-[var(--color-border)] rounded flex-shrink-0 overflow-hidden">
                  {item.cover_thumbnail_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.cover_thumbnail_url} alt={item.title} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{item.title}</p>
                  <p className="text-sm text-[var(--color-accent)] font-semibold mt-0.5">
                    {symbol}{item.line_total.toFixed(2)}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => updateItem.mutate({ product_id: item.product_id, quantity: item.quantity - 1 })}
                      className="w-6 h-6 rounded-full border border-[var(--color-border)] flex items-center justify-center hover:border-[var(--color-accent)] transition-base"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="text-sm w-4 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateItem.mutate({ product_id: item.product_id, quantity: item.quantity + 1 })}
                      className="w-6 h-6 rounded-full border border-[var(--color-border)] flex items-center justify-center hover:border-[var(--color-accent)] transition-base"
                    >
                      <Plus size={12} />
                    </button>
                    <button
                      onClick={() => removeItem.mutate(item.product_id)}
                      className="ml-auto text-xs text-[var(--color-text-secondary)] hover:text-red-500 transition-base"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {cart && cart.items.length > 0 && (
          <div className="border-t border-[var(--color-border)] px-5 py-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">Subtotal</span>
              <span className="font-semibold text-[var(--color-text-primary)]">
                {symbol}{cart.subtotal.toFixed(2)}
              </span>
            </div>
            {user ? (
              <Link
                href="/checkout"
                onClick={closeCartDrawer}
                className="block w-full text-center bg-[var(--color-accent)] text-white font-medium py-3 rounded-lg hover:opacity-90 transition-base text-sm"
              >
                Proceed to Checkout
              </Link>
            ) : (
              <Link
                href="/login?next=/checkout"
                onClick={closeCartDrawer}
                className="block w-full text-center bg-[var(--color-primary)] text-white font-medium py-3 rounded-lg hover:opacity-90 transition-base text-sm"
              >
                Sign in to Checkout
              </Link>
            )}
          </div>
        )}
      </div>
    </>
  );
}
