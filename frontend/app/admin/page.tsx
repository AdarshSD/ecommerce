"use client";

import Link from "next/link";
import { useProducts } from "@/lib/api/products";
import { useOrders } from "@/lib/api/orders";

function Stat({ label, value, href }: { label: string; value: number | string; href: string }) {
  return (
    <Link href={href} className="bg-white rounded-xl border border-slate-200 p-5 hover:border-blue-400 transition-base block">
      <p className="text-sm text-slate-500 mb-1">{label}</p>
      <p className="text-3xl font-bold text-slate-900">{value}</p>
    </Link>
  );
}

export default function AdminDashboard() {
  const { data: products } = useProducts({ page_size: 1 });
  const { data: orders } = useOrders();

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Stat label="Total Books" value={products?.meta.total ?? "—"} href="/admin/products" />
        <Stat label="Total Orders" value={orders?.meta.total ?? "—"} href="/admin/orders" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-900 mb-4">Recent Orders</h2>
          {orders?.data.slice(0, 5).map((order) => (
            <Link key={order.id} href={`/admin/orders`} className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0 hover:bg-slate-50 px-1 -mx-1 rounded transition-base">
              <div>
                <p className="text-sm font-medium text-slate-700">{order.payment_reference}</p>
                <p className="text-xs text-slate-500">{new Date(order.created_at).toLocaleDateString()}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-900">${Number(order.total).toFixed(2)}</p>
                <span className="text-xs text-slate-500">{order.status}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
