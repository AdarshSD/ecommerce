"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Trash2, Edit } from "lucide-react";
import { useProducts } from "@/lib/api/products";
import { api } from "@/lib/api/client";
import { useQueryClient } from "@tanstack/react-query";
import { useUIStore } from "@/lib/store/uiStore";
import { productKeys } from "@/lib/api/products";

export default function AdminProductsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const { data, isLoading } = useProducts({ page, page_size: 20, search: search || undefined });
  const qc = useQueryClient();
  const { addToast } = useUIStore();

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"?`)) return;
    try {
      await api.delete(`/admin/products/${id}`);
      addToast({ message: `"${title}" deleted.`, type: "success" });
      qc.invalidateQueries({ queryKey: productKeys.all() });
    } catch {
      addToast({ message: "Could not delete.", type: "error" });
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Books</h1>
        <Link href="/admin/products/new" className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-base">
          <Plus size={16} /> Add book
        </Link>
      </div>

      <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        placeholder="Search books…"
        className="mb-4 w-full max-w-sm px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Title</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600 hidden md:table-cell">Price</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600 hidden md:table-cell">Stock</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600 hidden lg:table-cell">Flags</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}><td colSpan={5}><div className="h-10 bg-slate-100 animate-pulse m-2 rounded" /></td></tr>
                ))
              : data?.data.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-base">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {p.cover_thumbnail_url && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.cover_thumbnail_url} alt={p.title} className="w-8 h-10 object-cover rounded" />
                        )}
                        <span className="font-medium text-slate-800 line-clamp-1">{p.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 hidden md:table-cell">${Number(p.price).toFixed(2)}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${p.is_in_stock ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {p.is_in_stock ? "In stock" : "Out of stock"}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="flex gap-1">
                        {p.is_featured && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Featured</span>}
                        {p.is_bestseller && <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Bestseller</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <Link href={`/admin/products/${p.id}`} className="p-1.5 text-slate-400 hover:text-blue-600 transition-base"><Edit size={15} /></Link>
                        <button onClick={() => handleDelete(p.id, p.title)} className="p-1.5 text-slate-400 hover:text-red-500 transition-base"><Trash2 size={15} /></button>
                      </div>
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
