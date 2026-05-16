"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Trash2, Edit, Search, X } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import { useUIStore } from "@/lib/store/uiStore";

interface AdminProduct {
  id: string;
  title: string;
  isbn: string | null;
  price: number;
  stock_count: number;
  is_in_stock: boolean;
  is_featured: boolean;
  is_bestseller: boolean;
  is_new_arrival: boolean;
  bestseller_rank: number | null;
  cover_thumbnail_url: string | null;
  is_deleted: boolean;
}

const SORT_OPTIONS = [
  { value: "newest",    label: "Newest first" },
  { value: "title_asc", label: "Title A–Z" },
  { value: "price_asc", label: "Price: Low → High" },
  { value: "price_desc",label: "Price: High → Low" },
  { value: "bestseller",label: "Bestseller rank" },
  { value: "stock_asc", label: "Stock: Low → High" },
];

type FlagFilter = "all" | "in_stock" | "out_of_stock" | "featured" | "bestseller" | "new_arrival";

const FLAG_FILTERS: { value: FlagFilter; label: string }[] = [
  { value: "all",         label: "All" },
  { value: "in_stock",    label: "In Stock" },
  { value: "out_of_stock",label: "Out of Stock" },
  { value: "featured",    label: "Featured" },
  { value: "bestseller",  label: "Bestseller" },
  { value: "new_arrival", label: "New Arrival" },
];

function flagToParams(f: FlagFilter): Record<string, boolean | undefined> {
  if (f === "in_stock")     return { in_stock: true };
  if (f === "out_of_stock") return { in_stock: false };
  if (f === "featured")     return { is_featured: true };
  if (f === "bestseller")   return { is_bestseller: true };
  if (f === "new_arrival")  return { is_new_arrival: true };
  return {};
}

export default function AdminProductsPage() {
  const [page, setPage]               = useState(1);
  const [search, setSearch]           = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [sort, setSort]               = useState("newest");
  const [flag, setFlag]               = useState<FlagFilter>("all");
  const [includeDeleted, setIncludeDeleted] = useState(false);

  const qc = useQueryClient();
  const { addToast } = useUIStore();

  const params = {
    page,
    page_size: 20,
    sort,
    search: search || undefined,
    include_deleted: includeDeleted || undefined,
    ...flagToParams(flag),
  };

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "products", params],
    queryFn: async () => {
      const res = await api.get<any>("/admin/products", { params }) as any;
      return res as { data: AdminProduct[]; meta: { total: number; total_pages: number } };
    },
    staleTime: 30_000,
  });

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  }

  function clearSearch() {
    setSearch("");
    setSearchInput("");
    setPage(1);
  }

  function changeFlag(f: FlagFilter) {
    setFlag(f);
    setPage(1);
  }

  function changeSort(s: string) {
    setSort(s);
    setPage(1);
  }

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Soft-delete "${title}"? It will be hidden from the store but can be restored.`)) return;
    try {
      await api.delete(`/admin/products/${id}`);
      addToast({ message: `"${title}" deleted.`, type: "success" });
      qc.invalidateQueries({ queryKey: ["admin", "products"] });
    } catch {
      addToast({ message: "Could not delete.", type: "error" });
    }
  }

  const activeFilterCount = (search ? 1 : 0) + (flag !== "all" ? 1 : 0) + (includeDeleted ? 1 : 0);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Books</h1>
          {data && (
            <p className="text-xs text-slate-400 mt-0.5">{data.meta.total} total</p>
          )}
        </div>
        <Link href="/admin/products/new"
          className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors">
          <Plus size={15} /> Add book
        </Link>
      </div>

      {/* Filter / Sort bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4 space-y-3">
        {/* Row 1: Search + Sort */}
        <div className="flex gap-3 flex-wrap">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1 min-w-48">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by title…"
                className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              />
            </div>
            <button type="submit"
              className="px-3 py-2 rounded-lg bg-slate-800 text-white text-xs font-medium hover:bg-slate-700 transition-colors">
              Search
            </button>
            {search && (
              <button type="button" onClick={clearSearch}
                className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:text-red-500 transition-colors">
                <X size={14} />
              </button>
            )}
          </form>

          <select
            value={sort}
            onChange={(e) => changeSort(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none text-slate-700"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Row 2: Flag filters + deleted toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          {FLAG_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => changeFlag(f.value)}
              className="px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
              style={flag === f.value
                ? { background: "#0f172a", color: "#fff", borderColor: "#0f172a" }
                : { background: "transparent", color: "#64748b", borderColor: "#e2e8f0" }}
            >
              {f.label}
            </button>
          ))}

          <div className="ml-auto flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeDeleted}
                onChange={(e) => { setIncludeDeleted(e.target.checked); setPage(1); }}
                className="rounded border-slate-300 accent-slate-800"
              />
              Show deleted
            </label>
          </div>
        </div>

        {/* Active filter summary */}
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
            <span className="text-xs text-slate-400">{activeFilterCount} filter{activeFilterCount > 1 ? "s" : ""} active</span>
            <button
              onClick={() => { setSearch(""); setSearchInput(""); setFlag("all"); setIncludeDeleted(false); setPage(1); }}
              className="text-xs text-red-500 hover:text-red-600 font-medium"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Title</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600 hidden sm:table-cell">Price</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600 hidden md:table-cell">Stock</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600 hidden lg:table-cell">Flags</th>
              <th className="px-4 py-3 w-20" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}><td colSpan={5}>
                    <div className="h-10 bg-slate-100 animate-pulse m-2 rounded" />
                  </td></tr>
                ))
              : data?.data.length === 0
              ? (
                  <tr><td colSpan={5} className="text-center py-12 text-sm text-slate-400">
                    No books match these filters.
                  </td></tr>
                )
              : data?.data.map((p) => (
                  <tr key={p.id}
                    className={`hover:bg-slate-50 transition-colors ${p.is_deleted ? "opacity-50" : ""}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {p.cover_thumbnail_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.cover_thumbnail_url} alt="" className="w-8 h-10 object-cover rounded flex-shrink-0" />
                        ) : (
                          <div className="w-8 h-10 rounded bg-slate-100 flex-shrink-0" />
                        )}
                        <div className="min-w-0">
                          <p className="font-medium text-slate-800 line-clamp-1">{p.title}</p>
                          {p.isbn && <p className="text-[10px] text-slate-400 font-mono">{p.isbn}</p>}
                          {p.is_deleted && (
                            <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium">Deleted</span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 text-slate-600 hidden sm:table-cell">
                      ${Number(p.price).toFixed(2)}
                    </td>

                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        p.stock_count === 0
                          ? "bg-red-100 text-red-700"
                          : p.stock_count <= 5
                          ? "bg-amber-100 text-amber-700"
                          : "bg-green-100 text-green-700"
                      }`}>
                        {p.stock_count === 0 ? "Out of stock" : `${p.stock_count} in stock`}
                      </span>
                    </td>

                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="flex gap-1 flex-wrap">
                        {p.is_featured    && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-medium">Featured</span>}
                        {p.is_bestseller  && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">#{p.bestseller_rank} Bestseller</span>}
                        {p.is_new_arrival && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-medium">New</span>}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        {!p.is_deleted && (
                          <Link href={`/admin/products/${p.id}`}
                            className="p-1.5 text-slate-400 hover:text-slate-700 transition-colors rounded" title="Edit">
                            <Edit size={14} />
                          </Link>
                        )}
                        {!p.is_deleted && (
                          <button onClick={() => handleDelete(p.id, p.title)}
                            className="p-1.5 text-slate-400 hover:text-red-500 transition-colors rounded" title="Delete">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.meta.total_pages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4">
          <button onClick={() => setPage(page - 1)} disabled={page <= 1}
            className="px-3 py-2 rounded-lg text-sm border border-slate-200 text-slate-600 hover:border-slate-400 disabled:opacity-30 transition-colors">
            ← Prev
          </button>
          {Array.from({ length: data.meta.total_pages }, (_, i) => i + 1)
            .filter((p) => Math.abs(p - page) <= 2)
            .map((p) => (
              <button key={p} onClick={() => setPage(p)}
                className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                  p === page
                    ? "bg-slate-900 text-white"
                    : "border border-slate-200 text-slate-600 hover:border-slate-400"
                }`}>
                {p}
              </button>
            ))}
          <button onClick={() => setPage(page + 1)} disabled={page >= data.meta.total_pages}
            className="px-3 py-2 rounded-lg text-sm border border-slate-200 text-slate-600 hover:border-slate-400 disabled:opacity-30 transition-colors">
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
