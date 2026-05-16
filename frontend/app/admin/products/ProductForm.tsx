"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2, UploadCloud, X, Plus, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api/client";
import { useUIStore } from "@/lib/store/uiStore";
import { useQueryClient } from "@tanstack/react-query";
import { productKeys } from "@/lib/api/products";

interface Category { id: string; name: string; product_count: number; }
interface Entity   { id: string; name: string; }

interface FormData {
  title: string;
  isbn: string;
  price: string;
  original_price: string;
  format: string;
  page_count: string;
  publisher: string;
  published_at: string;
  stock_count: string;
  is_featured: boolean;
  is_bestseller: boolean;
  is_new_arrival: boolean;
  is_recommended: boolean;
  bestseller_rank: string;
  badge: string;
  tags: string;
  description: string;
  long_description: string;
  rating: string;
  reviews_count: string;
  category_ids: string[];
  entity_ids: string[];
}

const EMPTY: FormData = {
  title: "", isbn: "", price: "", original_price: "", format: "paperback",
  page_count: "", publisher: "", published_at: "", stock_count: "0",
  is_featured: false, is_bestseller: false, is_new_arrival: false, is_recommended: false,
  bestseller_rank: "", badge: "", tags: "", description: "", long_description: "",
  rating: "", reviews_count: "0", category_ids: [], entity_ids: [],
};

// ── Save steps shown in the loader overlay ──────────────────────────────────
type StepStatus = "pending" | "running" | "done" | "error";
interface Step { label: string; status: StepStatus; }

function StepIndicator({ steps }: { steps: Step[] }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm">
        <h3 className="font-semibold text-slate-900 text-lg mb-6 text-center">Saving book…</h3>
        <div className="space-y-4">
          {steps.map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center">
                {step.status === "running" && <Loader2 size={18} className="animate-spin text-blue-500" />}
                {step.status === "done"    && <CheckCircle size={18} className="text-green-500" />}
                {step.status === "error"   && <AlertCircle size={18} className="text-red-500" />}
                {step.status === "pending" && <div className="w-4 h-4 rounded-full border-2 border-slate-200" />}
              </div>
              <span className={`text-sm ${
                step.status === "running" ? "text-slate-900 font-medium"
                : step.status === "done"  ? "text-green-700"
                : step.status === "error" ? "text-red-600"
                : "text-slate-400"
              }`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Field wrapper with inline error ─────────────────────────────────────────
function Field({ label, required, error, children }: {
  label: string; required?: boolean; error?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

const inputBase = "w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 bg-white";
const inputCls  = `${inputBase} border-slate-200 focus:ring-slate-400`;
const inputErr  = `${inputBase} border-red-400 focus:ring-red-300 bg-red-50`;
const textareaCls = `${inputCls} resize-none`;

interface Props { productId?: string; }

export default function ProductForm({ productId }: Props) {
  const router      = useRouter();
  const { addToast } = useUIStore();
  const qc          = useQueryClient();
  const isEdit      = !!productId;

  const [form, setForm]         = useState<FormData>(EMPTY);
  const [categories, setCategories] = useState<Category[]>([]);
  const [entities, setEntities]   = useState<Entity[]>([]);
  const [loading, setLoading]     = useState(isEdit);

  // Cover: local file for preview + upload on submit
  const [coverFile, setCoverFile]       = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null); // blob: or server URL
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Multi-step save overlay
  const [steps, setSteps] = useState<Step[] | null>(null);

  // New author
  const [newAuthorName, setNewAuthorName] = useState("");
  const [addingAuthor, setAddingAuthor]   = useState(false);

  // Existing bestseller ranks for conflict preview
  const [takenRanks, setTakenRanks] = useState<Record<number, string>>({}); // rank → title

  // ── Load data ────────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([
      api.get<any>("/admin/categories").then((r: any) => r.data as Category[]),
      api.get<any>("/linked-entities").then((r: any) => r.data as Entity[]),
      api.get<any>("/products", { params: { is_bestseller: true, page_size: 50 } }).then((r: any) => r.data as any[]),
    ]).then(([cats, ents, bestsellers]) => {
      setCategories(cats);
      setEntities(ents);
      const taken: Record<number, string> = {};
      for (const b of bestsellers) {
        if (b.bestseller_rank) taken[b.bestseller_rank] = b.title;
      }
      setTakenRanks(taken);
    });

    if (!isEdit) return;
    api.get<any>(`/admin/products/${productId}`).then((r: any) => {
      const p = r.data;
      setCoverPreview(p.cover_image_url ?? null);
      setForm({
        title: p.title ?? "", isbn: p.isbn ?? "",
        price: String(p.price ?? ""), original_price: p.original_price ? String(p.original_price) : "",
        format: p.format ?? "paperback", page_count: p.page_count ? String(p.page_count) : "",
        publisher: p.publisher ?? "", published_at: p.published_at ?? "",
        stock_count: String(p.stock_count ?? 0),
        is_featured: p.is_featured ?? false, is_bestseller: p.is_bestseller ?? false,
        is_new_arrival: p.is_new_arrival ?? false, is_recommended: p.is_recommended ?? false,
        bestseller_rank: p.bestseller_rank ? String(p.bestseller_rank) : "",
        badge: p.badge ?? "", tags: Array.isArray(p.tags) ? p.tags.join(", ") : "",
        description: p.description ?? "", long_description: p.long_description ?? "",
        rating: p.rating ? String(p.rating) : "", reviews_count: String(p.reviews_count ?? 0),
        category_ids: (p.categories ?? []).map((c: any) => c.id),
        entity_ids:   (p.linked_entities ?? []).map((e: any) => e.id),
      });
      setLoading(false);
    }).catch(() => { addToast({ message: "Could not load product.", type: "error" }); setLoading(false); });
  }, [productId, isEdit, addToast]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  function set(field: keyof FormData, value: any) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => { const n = { ...e }; delete n[field]; return n; });
  }

  function toggleMulti(field: "category_ids" | "entity_ids", id: string) {
    setForm((f) => ({
      ...f,
      [field]: f[field].includes(id) ? f[field].filter((x) => x !== id) : [...f[field], id],
    }));
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
    setErrors((err) => { const n = { ...err }; delete n.cover; return n; });
  }

  function removeCover() {
    setCoverFile(null);
    setCoverPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // ── Add new author ────────────────────────────────────────────────────────
  async function handleAddAuthor() {
    const name = newAuthorName.trim();
    if (!name) return;
    setAddingAuthor(true);
    try {
      const res = await api.post("/admin/linked-entities", { name }) as any;
      const newEntity = res.data as Entity;
      setEntities((prev) => [...prev, newEntity]);
      setForm((f) => ({ ...f, entity_ids: [...f.entity_ids, newEntity.id] }));
      setNewAuthorName("");
      addToast({ message: `"${name}" added and selected.`, type: "success" });
    } catch {
      addToast({ message: "Could not add author.", type: "error" });
    } finally {
      setAddingAuthor(false);
    }
  }

  // ── Validation ────────────────────────────────────────────────────────────
  function validate(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!form.title.trim())               e.title       = "Title is required.";
    if (!form.price || parseFloat(form.price) <= 0) e.price = "A valid price is required.";
    if (form.stock_count === "")          e.stock_count = "Stock count is required.";
    if (!coverPreview && !isEdit)         e.cover       = "A cover image is required.";
    return e;
  }

  // ── Update a step's status ────────────────────────────────────────────────
  function updateStep(index: number, status: StepStatus) {
    setSteps((prev) => prev
      ? prev.map((s, i) => i === index ? { ...s, status } : s)
      : prev
    );
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      // Scroll to first error
      const firstErrKey = Object.keys(errs)[0];
      document.getElementById(`field-${firstErrKey}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    // Build step list
    const stepList: Step[] = [
      ...(coverFile ? [{ label: "Uploading cover image", status: "pending" as StepStatus }] : []),
      { label: isEdit ? "Updating product record" : "Creating product record", status: "pending" },
    ];
    setSteps(stepList);

    let coverUrl = coverPreview; // use existing server URL if no new file
    let stepIdx  = 0;

    try {
      // Step: upload cover
      if (coverFile) {
        updateStep(stepIdx, "running");
        const fd = new FormData();
        fd.append("file", coverFile);
        const folderName = form.isbn.trim() || `custom-${Date.now()}`;
        const ext = coverFile.name.split(".").pop() ?? "jpg";
        fd.append("storage_key", `covers/${folderName}/card.${ext}`);
        // api client attaches the Bearer token automatically via its interceptor
        const uploadRes = await api.post("/admin/media/upload", fd) as any;
        coverUrl = uploadRes.url;
        updateStep(stepIdx, "done");
        stepIdx++;
      }

      // Step: create / update product
      updateStep(stepIdx, "running");
      await new Promise((r) => setTimeout(r, 400)); // brief pause so the loader is visible

      const payload = {
        title:           form.title,
        isbn:            form.isbn || null,
        price:           parseFloat(form.price),
        original_price:  form.original_price ? parseFloat(form.original_price) : null,
        format:          form.format || null,
        page_count:      form.page_count ? parseInt(form.page_count) : null,
        publisher:       form.publisher || null,
        published_at:    form.published_at || null,
        stock_count:     parseInt(form.stock_count) || 0,
        is_featured:     form.is_featured,
        is_bestseller:   form.is_bestseller,
        is_new_arrival:  form.is_new_arrival,
        is_recommended:  form.is_recommended,
        bestseller_rank: form.bestseller_rank ? parseInt(form.bestseller_rank) : null,
        badge:           form.badge || null,
        tags:            form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        description:     form.description || null,
        long_description: form.long_description || null,
        rating:          form.rating ? parseFloat(form.rating) : null,
        reviews_count:   parseInt(form.reviews_count) || 0,
        cover_image_url:     coverUrl,
        cover_thumbnail_url: coverUrl,
        category_ids:    form.category_ids,
        entity_ids:      form.entity_ids,
      };

      if (isEdit) {
        await api.put(`/admin/products/${productId}`, payload);
      } else {
        await api.post("/admin/products", payload);
      }

      updateStep(stepIdx, "done");
      await new Promise((r) => setTimeout(r, 600)); // show done state briefly

      qc.invalidateQueries({ queryKey: productKeys.all() });
      addToast({ message: isEdit ? "Book updated successfully." : "Book added successfully.", type: "success" });
      router.push("/admin/products");

    } catch (err: any) {
      updateStep(stepIdx, "error");
      await new Promise((r) => setTimeout(r, 800));
      setSteps(null);
      addToast({ message: err?.message ?? "Something went wrong. Please try again.", type: "error" });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 size={24} className="animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <>
      {steps && <StepIndicator steps={steps} />}

      <form onSubmit={handleSubmit} noValidate>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href="/admin/products" className="p-1.5 text-slate-400 hover:text-slate-700 transition-colors">
              <ArrowLeft size={18} />
            </Link>
            <h1 className="text-xl font-bold text-slate-900">
              {isEdit ? "Edit Book" : "Add New Book"}
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* ── Main fields ─────────────────────────────────────────────── */}
          <div className="xl:col-span-2 space-y-5">
            {/* Basic info */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
              <h2 className="font-semibold text-slate-800 text-sm border-b border-slate-100 pb-3">Basic Information</h2>

              <Field label="Title" required error={errors.title}>
                <div id="field-title">
                  <input value={form.title} onChange={(e) => set("title", e.target.value)}
                    className={errors.title ? inputErr : inputCls} />
                </div>
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="ISBN">
                  <input value={form.isbn} onChange={(e) => set("isbn", e.target.value)}
                    className={inputCls} placeholder="9780000000000" />
                </Field>
                <Field label="Format">
                  <select value={form.format} onChange={(e) => set("format", e.target.value)} className={inputCls}>
                    <option value="paperback">Paperback</option>
                    <option value="hardcover">Hardcover</option>
                    <option value="ebook">E-Book</option>
                    <option value="audiobook">Audiobook</option>
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Field label="Price ($)" required error={errors.price}>
                  <div id="field-price">
                    <input type="number" step="0.01" min="0" value={form.price}
                      onChange={(e) => set("price", e.target.value)}
                      className={errors.price ? inputErr : inputCls} />
                  </div>
                </Field>
                <Field label="Original price ($)">
                  <input type="number" step="0.01" min="0" value={form.original_price}
                    onChange={(e) => set("original_price", e.target.value)}
                    className={inputCls} placeholder="If on sale" />
                </Field>
                <Field label="Stock count" required error={errors.stock_count}>
                  <div id="field-stock_count">
                    <input type="number" min="0" value={form.stock_count}
                      onChange={(e) => set("stock_count", e.target.value)}
                      className={errors.stock_count ? inputErr : inputCls} />
                  </div>
                </Field>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Field label="Pages">
                  <input type="number" min="1" value={form.page_count}
                    onChange={(e) => set("page_count", e.target.value)} className={inputCls} />
                </Field>
                <Field label="Publisher">
                  <input value={form.publisher} onChange={(e) => set("publisher", e.target.value)} className={inputCls} />
                </Field>
                <Field label="Published date">
                  <input type="date" value={form.published_at}
                    onChange={(e) => set("published_at", e.target.value)} className={inputCls} />
                </Field>
              </div>
            </div>

            {/* Descriptions */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
              <h2 className="font-semibold text-slate-800 text-sm border-b border-slate-100 pb-3">Descriptions & Tags</h2>
              <Field label="Short description">
                <textarea rows={2} value={form.description}
                  onChange={(e) => set("description", e.target.value)} className={textareaCls} />
              </Field>
              <Field label="Full description (shown on product page)">
                <textarea rows={4} value={form.long_description}
                  onChange={(e) => set("long_description", e.target.value)} className={textareaCls} />
              </Field>
              <Field label="Tags (comma-separated)">
                <input value={form.tags} onChange={(e) => set("tags", e.target.value)}
                  className={inputCls} placeholder="e.g. Dystopia, Classic, Politics" />
              </Field>
            </div>

            {/* Genres */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="font-semibold text-slate-800 text-sm border-b border-slate-100 pb-3 mb-4">Genres</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {categories.map((cat) => (
                  <label key={cat.id} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                    <input type="checkbox" checked={form.category_ids.includes(cat.id)}
                      onChange={() => toggleMulti("category_ids", cat.id)}
                      className="rounded border-slate-300 accent-slate-800" />
                    {cat.name}
                  </label>
                ))}
              </div>
            </div>

            {/* Authors */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
              <h2 className="font-semibold text-slate-800 text-sm border-b border-slate-100 pb-3 mb-4">Authors</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1 mb-4">
                {entities.map((e) => (
                  <label key={e.id} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                    <input type="checkbox" checked={form.entity_ids.includes(e.id)}
                      onChange={() => toggleMulti("entity_ids", e.id)}
                      className="rounded border-slate-300 accent-slate-800" />
                    {e.name}
                  </label>
                ))}
              </div>
              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs font-semibold text-slate-500 mb-2">Add new author</p>
                <div className="flex gap-2">
                  <input
                    type="text" value={newAuthorName}
                    onChange={(e) => setNewAuthorName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddAuthor(); } }}
                    placeholder="Author name…"
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400 bg-white"
                  />
                  <button type="button" onClick={handleAddAuthor}
                    disabled={addingAuthor || !newAuthorName.trim()}
                    className="px-3 py-2 bg-slate-800 text-white rounded-lg text-xs font-medium hover:bg-slate-700 transition-colors disabled:opacity-40 flex items-center gap-1.5">
                    {addingAuthor ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ── Sidebar ──────────────────────────────────────────────────── */}
          <div className="space-y-5">
            {/* Cover image */}
            <div className="bg-white rounded-xl border border-slate-200 p-5" id="field-cover">
              <h2 className="font-semibold text-slate-800 text-sm border-b border-slate-100 pb-3 mb-4">
                Cover Image{!isEdit && <span className="text-red-500 ml-0.5">*</span>}
              </h2>

              <input
                id="cover-file-input"
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleFileSelect}
                className="sr-only"
              />

              {coverPreview ? (
                <div className="relative mb-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={coverPreview} alt="Cover preview"
                       className="w-full max-w-[160px] mx-auto rounded-lg shadow-md object-cover block" />
                  <button type="button" onClick={removeCover}
                    className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors">
                    <X size={12} />
                  </button>
                  {coverFile && (
                    <p className="text-[10px] text-slate-400 text-center mt-2">
                      Will upload on save
                    </p>
                  )}
                </div>
              ) : (
                <label htmlFor="cover-file-input"
                  className={`h-40 border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-slate-50 transition-all mb-3 block ${
                    errors.cover ? "border-red-400 bg-red-50" : "border-slate-200 hover:border-slate-400"
                  }`}>
                  <UploadCloud size={20} className={errors.cover ? "text-red-400" : "text-slate-400"} />
                  <p className={`text-xs ${errors.cover ? "text-red-500 font-medium" : "text-slate-400"}`}>
                    {errors.cover ?? "Click to select image"}
                  </p>
                  <p className="text-[10px] text-slate-300">JPEG, PNG, WebP · max 5 MB</p>
                </label>
              )}

              <label htmlFor="cover-file-input"
                className="w-full py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer block text-center">
                {coverPreview ? "Replace image" : "Choose image"}
              </label>
            </div>

            {/* Flags */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
              <h2 className="font-semibold text-slate-800 text-sm border-b border-slate-100 pb-3">Flags</h2>
              {([
                ["is_featured",    "Staff Pick (Featured)"],
                ["is_bestseller",  "Bestseller"],
                ["is_new_arrival", "New Arrival"],
                ["is_recommended", "Recommended"],
              ] as const).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer">
                  <input type="checkbox" checked={form[key] as boolean}
                    onChange={(e) => set(key, e.target.checked)}
                    className="rounded border-slate-300 accent-slate-800" />
                  {label}
                </label>
              ))}
            </div>

            {/* Ranking & badge */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
              <h2 className="font-semibold text-slate-800 text-sm border-b border-slate-100 pb-3">Ranking & Badge</h2>
              <Field label="Bestseller rank">
                <input type="number" min="1" value={form.bestseller_rank}
                  onChange={(e) => set("bestseller_rank", e.target.value)}
                  className={inputCls} placeholder="1–30" />
              </Field>

              {/* Conflict preview */}
              {form.is_bestseller && form.bestseller_rank && (() => {
                const rank = parseInt(form.bestseller_rank, 10);
                const conflictTitle = !isNaN(rank) ? takenRanks[rank] : null;
                const ownRank = isEdit && takenRanks[rank] && Object.entries(takenRanks).some(
                  ([r, t]) => parseInt(r) === rank && t === form.title
                );
                if (!conflictTitle || ownRank) return null;
                return (
                  <div className="text-xs rounded-lg p-3 border" style={{ background: "#fffbeb", borderColor: "#fcd34d", color: "#92400e" }}>
                    <p className="font-semibold mb-1">Rank #{rank} is taken</p>
                    <p className="leading-snug">
                      <span className="font-medium">"{conflictTitle}"</span> is currently #{rank}.
                      Saving will push it and all books below it down by one.
                    </p>
                  </div>
                );
              })()}

              <Field label="Badge text">
                <input value={form.badge} onChange={(e) => set("badge", e.target.value)}
                  className={inputCls} placeholder="e.g. #1 Bestseller" />
              </Field>
            </div>

            {/* Ratings */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
              <h2 className="font-semibold text-slate-800 text-sm border-b border-slate-100 pb-3">Ratings</h2>
              <Field label="Rating (0–5)">
                <input type="number" step="0.1" min="0" max="5" value={form.rating}
                  onChange={(e) => set("rating", e.target.value)} className={inputCls} />
              </Field>
              <Field label="Review count">
                <input type="number" min="0" value={form.reviews_count}
                  onChange={(e) => set("reviews_count", e.target.value)} className={inputCls} />
              </Field>
            </div>
          </div>
        </div>

        {/* ── Sticky bottom bar ─────────────────────────────────────────── */}
        <div className="sticky bottom-0 mt-6 -mx-6 px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between gap-4">
          <p className="text-xs text-slate-400">
            Fields marked <span className="text-red-500">*</span> are required
          </p>
          <div className="flex items-center gap-3">
            <Link href="/admin/products"
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 transition-colors">
              Cancel
            </Link>
            <button
              type="submit"
              className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2 rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors"
            >
              <Save size={14} />
              {isEdit ? "Save changes" : "Create book"}
            </button>
          </div>
        </div>
      </form>
    </>
  );
}
