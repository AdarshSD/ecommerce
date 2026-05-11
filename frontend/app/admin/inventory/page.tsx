"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { api } from "@/lib/api/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useUIStore } from "@/lib/store/uiStore";

interface InventoryRow {
  id: string;
  title: string;
  isbn: string | null;
  stock_count: number;
  low_stock_threshold: number;
  is_in_stock: boolean;
}

export default function AdminInventoryPage() {
  const qc = useQueryClient();
  const { addToast } = useUIStore();
  const [editing, setEditing] = useState<{ id: string; value: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "inventory"],
    queryFn: async () => {
      const res = await api.get<any>("/admin/inventory", { params: { page_size: 100 } });
      return res as unknown as { data: InventoryRow[]; meta: any };
    },
  });

  async function handleSave(id: string) {
    if (!editing || editing.id !== id) return;
    const stock = parseInt(editing.value, 10);
    if (isNaN(stock) || stock < 0) { addToast({ message: "Invalid stock value.", type: "error" }); return; }
    try {
      await api.patch(`/admin/inventory/${id}`, { stock_count: stock, reason: "Admin update" });
      addToast({ message: "Stock updated.", type: "success" });
      qc.invalidateQueries({ queryKey: ["admin", "inventory"] });
      setEditing(null);
    } catch {
      addToast({ message: "Update failed.", type: "error" });
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Inventory</h1>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Book</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Status</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Stock</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => <tr key={i}><td colSpan={3}><div className="h-10 bg-slate-100 animate-pulse m-2 rounded" /></td></tr>)
              : data?.data.map((row) => {
                  const isLow = row.stock_count > 0 && row.stock_count <= row.low_stock_threshold;
                  return (
                    <tr key={row.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-800 line-clamp-1">{row.title}</p>
                        {row.isbn && <p className="text-xs text-slate-400 font-mono">{row.isbn}</p>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          !row.is_in_stock ? "bg-red-100 text-red-700"
                          : isLow ? "bg-amber-100 text-amber-700"
                          : "bg-green-100 text-green-700"
                        }`}>
                          {!row.is_in_stock ? "Out of stock" : isLow ? "Low stock" : "In stock"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {editing?.id === row.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number" min="0" value={editing.value}
                              onChange={(e) => setEditing({ id: row.id, value: e.target.value })}
                              className="w-20 px-2 py-1 border border-blue-400 rounded text-sm focus:outline-none"
                              autoFocus
                            />
                            <button onClick={() => handleSave(row.id)} className="text-green-600 hover:text-green-700"><Check size={16} /></button>
                            <button onClick={() => setEditing(null)} className="text-slate-400 hover:text-red-500"><X size={16} /></button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setEditing({ id: row.id, value: String(row.stock_count) })}
                            className="text-slate-700 hover:text-blue-600 font-medium transition-base text-sm"
                          >
                            {row.stock_count}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
