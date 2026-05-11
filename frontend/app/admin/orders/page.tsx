"use client";

import { useState } from "react";
import { api } from "@/lib/api/client";
import { useOrders } from "@/lib/api/orders";
import { useQueryClient } from "@tanstack/react-query";
import { useUIStore } from "@/lib/store/uiStore";

const STATUSES = ["CONFIRMED","PROCESSING","SHIPPED","DELIVERED","CANCELLED"];

const STATUS_COLOUR: Record<string, string> = {
  CONFIRMED:  "bg-blue-100 text-blue-700",
  PROCESSING: "bg-yellow-100 text-yellow-700",
  SHIPPED:    "bg-purple-100 text-purple-700",
  DELIVERED:  "bg-green-100 text-green-700",
  CANCELLED:  "bg-red-100 text-red-700",
  REFUNDED:   "bg-gray-100 text-gray-700",
};

export default function AdminOrdersPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useOrders(page);
  const qc = useQueryClient();
  const { addToast } = useUIStore();

  async function updateStatus(orderId: string, status: string) {
    try {
      await api.patch(`/admin/orders/${orderId}/status`, { status });
      addToast({ message: `Order updated to ${status}`, type: "success" });
      qc.invalidateQueries({ queryKey: ["orders"] });
    } catch (err: any) {
      addToast({ message: err?.message ?? "Invalid transition.", type: "error" });
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Orders</h1>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Reference</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600 hidden md:table-cell">Date</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600 hidden sm:table-cell">Total</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan={4}><div className="h-10 bg-slate-100 animate-pulse m-2 rounded" /></td></tr>
                ))
              : data?.data.map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{order.payment_reference}</td>
                    <td className="px-4 py-3 text-slate-600 hidden md:table-cell">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800 hidden sm:table-cell">
                      ${Number(order.total).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={order.status}
                        onChange={(e) => updateStatus(order.id, e.target.value)}
                        className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer focus:outline-none ${STATUS_COLOUR[order.status] ?? "bg-gray-100 text-gray-700"}`}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
      {data && data.meta.total_pages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: data.meta.total_pages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)}
              className={`w-9 h-9 rounded-lg text-sm font-medium transition-base ${p === page ? "bg-blue-600 text-white" : "border border-slate-200 text-slate-600 hover:border-blue-400"}`}>
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
