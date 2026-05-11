"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useOrder } from "@/lib/api/orders";
import { useAuthStore } from "@/lib/store/authStore";

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const user = useAuthStore((s) => s.user);
  const { data: order, isLoading } = useOrder(id);

  if (!user) return <div className="p-10 text-center"><Link href="/login" className="text-[var(--color-accent)]">Sign in</Link> to view orders.</div>;
  if (isLoading) return <div className="max-w-2xl mx-auto px-4 py-10"><div className="h-48 bg-[var(--color-border)] rounded-xl animate-pulse" /></div>;
  if (!order) return <div className="max-w-2xl mx-auto px-4 py-10 text-center text-[var(--color-text-secondary)]">Order not found.</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <Link href="/orders" className="inline-flex items-center gap-1 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] mb-6 transition-base">
        <ArrowLeft size={14} /> My orders
      </Link>
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs text-[var(--color-text-secondary)]">{new Date(order.created_at).toLocaleDateString("en-US", { year:"numeric", month:"long", day:"numeric" })}</p>
            <p className="font-mono text-xs text-[var(--color-text-secondary)] mt-0.5">{order.payment_reference}</p>
          </div>
          <span className="text-xs font-medium px-3 py-1 bg-[var(--color-border)] text-[var(--color-text-secondary)] rounded-full">{order.status}</span>
        </div>
        <div className="space-y-3 mb-6">
          {order.items.map((item) => (
            <div key={item.product_id} className="flex justify-between text-sm">
              <span className="text-[var(--color-text-primary)]">{item.title} <span className="text-[var(--color-text-secondary)]">× {item.quantity}</span></span>
              <span className="text-[var(--color-text-secondary)]">${Number(item.line_total).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-[var(--color-border)] pt-4 space-y-1 text-sm">
          <div className="flex justify-between text-[var(--color-text-secondary)]"><span>Subtotal</span><span>${Number(order.subtotal).toFixed(2)}</span></div>
          <div className="flex justify-between text-[var(--color-text-secondary)]"><span>Shipping</span><span>${Number(order.shipping_cost).toFixed(2)}</span></div>
          <div className="flex justify-between font-semibold text-[var(--color-text-primary)] pt-1"><span>Total</span><span>${Number(order.total).toFixed(2)}</span></div>
        </div>
        {order.tracking_number && (
          <p className="mt-4 text-sm text-[var(--color-text-secondary)]">Tracking: <span className="font-mono text-[var(--color-text-primary)]">{order.tracking_number}</span></p>
        )}
      </div>
    </div>
  );
}
