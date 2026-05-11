"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { api } from "@/lib/api/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useUIStore } from "@/lib/store/uiStore";

interface Category {
  id: string;
  name: string;
  slug: string;
  product_count: number;
  is_active: boolean;
}

export default function AdminCategoriesPage() {
  const qc = useQueryClient();
  const { addToast } = useUIStore();
  const [newName, setNewName] = useState("");

  const { data: categories, isLoading } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: async () => {
      const res = await api.get<any>("/admin/categories");
      return res.data as Category[];
    },
  });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      await api.post("/admin/categories", { name: newName.trim() });
      addToast({ message: `Genre "${newName}" created.`, type: "success" });
      setNewName("");
      qc.invalidateQueries({ queryKey: ["admin", "categories"] });
    } catch (err: any) {
      addToast({ message: err?.message ?? "Could not create genre.", type: "error" });
    }
  }

  async function handleDelete(id: string, name: string, count: number) {
    if (count > 0) { addToast({ message: "Remove all books from this genre first.", type: "error" }); return; }
    if (!confirm(`Delete genre "${name}"?`)) return;
    try {
      await api.delete(`/admin/categories/${id}`);
      addToast({ message: `Genre "${name}" deleted.`, type: "success" });
      qc.invalidateQueries({ queryKey: ["admin", "categories"] });
    } catch {
      addToast({ message: "Could not delete.", type: "error" });
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Genres</h1>
      <form onSubmit={handleCreate} className="flex gap-2 mb-6">
        <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="New genre name…"
          className="flex-1 max-w-xs px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <button type="submit" className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
          <Plus size={14} /> Add
        </button>
      </form>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Name</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Slug</th>
              <th className="text-left px-4 py-3 font-medium text-slate-600">Books</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => <tr key={i}><td colSpan={4}><div className="h-10 bg-slate-100 animate-pulse m-2 rounded" /></td></tr>)
              : categories?.map((cat) => (
                  <tr key={cat.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{cat.name}</td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-xs">{cat.slug}</td>
                    <td className="px-4 py-3 text-slate-600">{cat.product_count}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleDelete(cat.id, cat.name, cat.product_count)}
                        className="p-1.5 text-slate-400 hover:text-red-500 transition-base"><Trash2 size={14} /></button>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
