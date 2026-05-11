"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useOrders } from "@/lib/api/orders";
import { useAuthStore } from "@/lib/store/authStore";

const STATUS_COLOUR: Record<string, string> = {
  CONFIRMED:  "bg-blue-100 text-blue-700",
  PROCESSING: "bg-yellow-100 text-yellow-700",
  SHIPPED:    "bg-purple-100 text-purple-700",
  DELIVERED:  "bg-green-100 text-green-700",
  CANCELLED:  "bg-red-100 text-red-700",
  REFUNDED:   "bg-gray-100 text-gray-700",
};

export default function OrdersPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data, isLoading } = useOrders();

  useEffect(() => { if (!user) router.push("/login?next=/orders"); }, [user, router]);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-3xl font-semibold text-[var(--color-text-primary)] mb-8">My Orders</h1>
      {isLoading ? (
        <div className="space-y-4">
          {[1,2].map((i) => <div key={i} className="h-24 bg-[var(--color-border)] rounded-xl animate-pulse" />)}
        </div>
      ) : !data?.data.length ? (
        <div className="text-center py-20 text-[var(--color-text-secondary)]">
          <p>No orders yet.</p>
          <Link href="/products" className="mt-4 inline-block text-[var(--color-accent)] hover:underline text-sm">Start shopping →</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {data.data.map((order) => (
            <Link key={order.id} href={`/orders/${order.id}`}
              className="block bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-5 hover:border-[var(--color-accent)] transition-base">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs text-[var(--color-text-secondary)] mb-1">
                    {new Date(order.created_at).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                  </p>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {order.items.length} item{order.items.length > 1 ? "s" : ""} · ${Number(order.total).toFixed(2)}
                  </p>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-1 font-mono">{order.payment_reference}</p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${STATUS_COLOUR[order.status] ?? "bg-gray-100 text-gray-700"}`}>
                  {order.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
