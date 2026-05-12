"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Package } from "lucide-react";
import { useOrders } from "@/lib/api/orders";
import { useAuthStore } from "@/lib/store/authStore";

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  CONFIRMED:  { bg: "#dbeafe", color: "#1d4ed8" },
  PROCESSING: { bg: "#fef9c3", color: "#a16207" },
  SHIPPED:    { bg: "#ede9fe", color: "#7c3aed" },
  DELIVERED:  { bg: "#dcfce7", color: "#15803d" },
  CANCELLED:  { bg: "#fee2e2", color: "#dc2626" },
  REFUNDED:   { bg: "#f1f5f9", color: "#475569" },
};

export default function OrdersPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data, isLoading } = useOrders();

  useEffect(() => { if (!user) router.push("/login?next=/orders"); }, [user, router]);
  if (!user) return null;

  return (
    <div className="min-h-screen" style={{ background: "var(--color-background)" }}>
      {/* Header */}
      <div className="py-14" style={{ background: "var(--color-primary)" }}>
        <div className="max-w-3xl mx-auto px-5 sm:px-8">
          <p className="text-xs tracking-[0.2em] uppercase font-medium mb-2"
             style={{ color: "var(--color-accent)" }}>Account</p>
          <h1 className="font-display font-bold text-4xl" style={{ color: "#FAF7F2" }}>My Orders</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-10">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: "var(--color-border)" }} />
            ))}
          </div>
        ) : !data?.data.length ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                 style={{ background: "var(--color-cream-dark)" }}>
              <Package size={24} strokeWidth={1.5} style={{ color: "var(--color-text-muted)" }} />
            </div>
            <p className="font-display text-xl mb-2" style={{ color: "var(--color-text-primary)" }}>No orders yet</p>
            <p className="text-sm mb-6" style={{ color: "var(--color-text-muted)" }}>
              When you place an order, it will appear here.
            </p>
            <Link href="/products"
                  className="inline-flex items-center gap-2 font-semibold text-sm px-6 py-3 rounded-full"
                  style={{ background: "var(--color-primary)", color: "#FAF7F2" }}>
              Start shopping <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {data.data.map((order) => {
              const style = STATUS_STYLES[order.status] ?? { bg: "#f1f5f9", color: "#475569" };
              return (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="group flex items-center justify-between p-5 rounded-2xl border transition-all"
                  style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                         style={{ background: "var(--color-background)" }}>
                      <Package size={16} style={{ color: "var(--color-primary)" }} />
                    </div>
                    <div>
                      <p className="font-semibold text-sm mb-0.5" style={{ color: "var(--color-text-primary)" }}>
                        {order.items.length} {order.items.length === 1 ? "item" : "items"} ·{" "}
                        <span style={{ color: "var(--color-primary)" }}>
                          ${Number(order.total).toFixed(2)}
                        </span>
                      </p>
                      <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                        {new Date(order.created_at).toLocaleDateString("en-US", {
                          year: "numeric", month: "long", day: "numeric",
                        })}
                      </p>
                      <p className="text-xs font-mono mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                        {order.payment_reference}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                          style={{ background: style.bg, color: style.color }}>
                      {order.status}
                    </span>
                    <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity"
                                style={{ color: "var(--color-text-muted)" }} />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
