"use client";

import Link from "next/link";
import { BookOpen, ShoppingBag, Package, Tag, ArrowRight, TrendingUp } from "lucide-react";
import { useProducts } from "@/lib/api/products";
import { useOrders } from "@/lib/api/orders";
import { useCategories } from "@/lib/api/categories";

const STATUS_BADGE: Record<string, { bg: string; color: string }> = {
  CONFIRMED:  { bg: "#dbeafe", color: "#1d4ed8" },
  PROCESSING: { bg: "#fef9c3", color: "#a16207" },
  SHIPPED:    { bg: "#ede9fe", color: "#7c3aed" },
  DELIVERED:  { bg: "#dcfce7", color: "#15803d" },
  CANCELLED:  { bg: "#fee2e2", color: "#dc2626" },
};

function StatCard({ label, value, icon: Icon, href, color }: {
  label: string; value: string | number; icon: any; href: string; color: string;
}) {
  return (
    <Link href={href}
          className="bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-300 hover:shadow-sm transition-all group block">
      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${color}15` }}>
          <Icon size={16} style={{ color }} />
        </div>
        <ArrowRight size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
      </div>
      <p className="text-2xl font-bold text-slate-900 mb-0.5">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </Link>
  );
}

export default function AdminDashboard() {
  const { data: products } = useProducts({ page_size: 1 });
  const { data: orders } = useOrders();
  const { data: categories } = useCategories();

  const recentOrders = orders?.data.slice(0, 6) ?? [];
  const revenue = orders?.data.reduce((sum, o) => sum + Number(o.total), 0) ?? 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
        <span className="text-xs text-slate-400">
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Books"  value={products?.meta.total ?? "—"} icon={BookOpen}    href="/admin/products"  color="#1A3A2A" />
        <StatCard label="Total Orders" value={orders?.meta.total ?? "—"}  icon={ShoppingBag} href="/admin/orders"    color="#7c3aed" />
        <StatCard label="Genres"       value={categories?.length ?? "—"}  icon={Tag}          href="/admin/categories" color="#C9A84C" />
        <StatCard label="Revenue"      value={`$${revenue.toFixed(0)}`}   icon={TrendingUp}   href="/admin/orders"    color="#15803d" />
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-900 text-sm">Recent Orders</h2>
          <Link href="/admin/orders" className="text-xs text-blue-600 hover:text-blue-700 font-medium">
            View all →
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-slate-400">No orders yet.</div>
        ) : (
          <div className="divide-y divide-slate-50">
            {recentOrders.map((order) => {
              const badge = STATUS_BADGE[order.status] ?? { bg: "#f1f5f9", color: "#475569" };
              return (
                <Link key={order.id} href="/admin/orders"
                      className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-slate-700 font-mono">{order.payment_reference}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(order.created_at).toLocaleDateString()} · {order.items.length} item{order.items.length > 1 ? "s" : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-semibold text-slate-900">${Number(order.total).toFixed(2)}</p>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: badge.bg, color: badge.color }}>
                      {order.status}
                    </span>
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
