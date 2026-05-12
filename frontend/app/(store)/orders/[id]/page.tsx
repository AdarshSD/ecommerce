"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, Package, MapPin, CreditCard } from "lucide-react";
import { useOrder } from "@/lib/api/orders";
import { useAuthStore } from "@/lib/store/authStore";

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  CONFIRMED:  { bg: "#dbeafe", color: "#1d4ed8" },
  PROCESSING: { bg: "#fef9c3", color: "#a16207" },
  SHIPPED:    { bg: "#ede9fe", color: "#7c3aed" },
  DELIVERED:  { bg: "#dcfce7", color: "#15803d" },
  CANCELLED:  { bg: "#fee2e2", color: "#dc2626" },
  REFUNDED:   { bg: "#f1f5f9", color: "#475569" },
};

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const user = useAuthStore((s) => s.user);
  const { data: order, isLoading } = useOrder(id);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-background)" }}>
        <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
          <Link href="/login" className="font-semibold" style={{ color: "var(--color-accent)" }}>Sign in</Link>
          {" "}to view orders.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ background: "var(--color-background)" }}>
        <div className="h-40 animate-pulse" style={{ background: "var(--color-primary)" }} />
        <div className="max-w-2xl mx-auto px-5 sm:px-8 py-8">
          <div className="h-64 rounded-2xl animate-pulse" style={{ background: "var(--color-border)" }} />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-background)" }}>
        <div className="text-center">
          <p className="font-display text-xl mb-4" style={{ color: "var(--color-text-primary)" }}>Order not found</p>
          <Link href="/orders" className="text-sm font-medium" style={{ color: "var(--color-accent)" }}>
            ← My orders
          </Link>
        </div>
      </div>
    );
  }

  const statusStyle = STATUS_STYLES[order.status] ?? { bg: "#f1f5f9", color: "#475569" };

  return (
    <div className="min-h-screen" style={{ background: "var(--color-background)" }}>
      {/* Header */}
      <div className="py-14" style={{ background: "var(--color-primary)" }}>
        <div className="max-w-2xl mx-auto px-5 sm:px-8">
          <Link href="/orders"
                className="inline-flex items-center gap-1.5 text-sm mb-6 transition-colors group"
                style={{ color: "rgba(250,247,242,0.55)" }}>
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            My Orders
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs tracking-[0.2em] uppercase font-medium mb-2"
                 style={{ color: "var(--color-accent)" }}>Order</p>
              <h1 className="font-display font-bold text-3xl" style={{ color: "#FAF7F2" }}>
                {new Date(order.created_at).toLocaleDateString("en-US", {
                  month: "long", day: "numeric", year: "numeric",
                })}
              </h1>
              <p className="text-xs font-mono mt-1" style={{ color: "rgba(250,247,242,0.4)" }}>
                {order.payment_reference}
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full mt-1"
                  style={{ background: statusStyle.bg, color: statusStyle.color }}>
              {order.status}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 sm:px-8 py-8 space-y-4">
        {/* Items */}
        <div className="rounded-2xl border overflow-hidden"
             style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
          <div className="px-5 py-4 border-b flex items-center gap-2.5"
               style={{ borderColor: "var(--color-border)" }}>
            <Package size={15} style={{ color: "var(--color-accent)" }} />
            <span className="font-semibold text-sm" style={{ color: "var(--color-text-primary)" }}>
              {order.items.length} {order.items.length === 1 ? "item" : "items"}
            </span>
          </div>
          <div className="divide-y" style={{ borderColor: "var(--color-border)" }}>
            {order.items.map((item) => (
              <div key={item.product_id} className="flex items-center justify-between px-5 py-4 gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-snug" style={{ color: "var(--color-text-primary)" }}>
                    {item.title}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                    Qty {item.quantity} × ${Number(item.unit_price ?? item.line_total / item.quantity).toFixed(2)}
                  </p>
                </div>
                <span className="font-semibold text-sm flex-shrink-0" style={{ color: "var(--color-primary)" }}>
                  ${Number(item.line_total).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="rounded-2xl border p-5"
             style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
          <div className="flex items-center gap-2.5 mb-4">
            <CreditCard size={15} style={{ color: "var(--color-accent)" }} />
            <span className="font-semibold text-sm" style={{ color: "var(--color-text-primary)" }}>Payment Summary</span>
          </div>
          <div className="space-y-2">
            {[
              { label: "Subtotal", value: order.subtotal },
              { label: "Shipping", value: order.shipping_cost },
              { label: "Tax", value: order.tax_amount },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-sm">
                <span style={{ color: "var(--color-text-muted)" }}>{label}</span>
                <span style={{ color: "var(--color-text-secondary)" }}>${Number(value).toFixed(2)}</span>
              </div>
            ))}
            <div className="flex justify-between pt-3 border-t font-bold"
                 style={{ borderColor: "var(--color-border)" }}>
              <span style={{ color: "var(--color-text-primary)" }}>Total</span>
              <span className="font-display text-lg" style={{ color: "var(--color-primary)" }}>
                ${Number(order.total).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Address */}
        {order.address && (
          <div className="rounded-2xl border p-5"
               style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
            <div className="flex items-center gap-2.5 mb-3">
              <MapPin size={15} style={{ color: "var(--color-accent)" }} />
              <span className="font-semibold text-sm" style={{ color: "var(--color-text-primary)" }}>Delivery Address</span>
            </div>
            <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
              {(order.address as any).full_name}<br />
              {(order.address as any).line_1}<br />
              {(order.address as any).city}, {(order.address as any).postcode}
            </p>
          </div>
        )}

        {/* Tracking */}
        {order.tracking_number && (
          <div className="rounded-2xl border p-5"
               style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              Tracking number:{" "}
              <span className="font-mono font-medium" style={{ color: "var(--color-text-primary)" }}>
                {order.tracking_number}
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
