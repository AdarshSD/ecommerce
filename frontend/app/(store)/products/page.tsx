"use client";

import { Suspense, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { useProducts } from "@/lib/api/products";
import { useCategories } from "@/lib/api/categories";
import ProductCard from "@/components/store/ProductCard";

const SORT_OPTIONS = [
  { value: "newest",     label: "Newest" },
  { value: "bestseller", label: "Bestsellers" },
  { value: "price_asc",  label: "Price: Low → High" },
  { value: "price_desc", label: "Price: High → Low" },
  { value: "title_asc",  label: "Title A–Z" },
];

function ProductsContent() {
  const params = useSearchParams();
  const router = useRouter();

  // ── All state lives in the URL ──────────────────────────────────────────
  const search      = params.get("search")      ?? "";
  const sort        = params.get("sort")        ?? "newest";
  const categoryId  = params.get("category_id") ?? "";
  const page        = Math.max(1, parseInt(params.get("page") ?? "1", 10));

  // Boolean filter flags (from nav links like /products?is_bestseller=true)
  const isFeatured   = params.get("is_featured")   === "true" || undefined;
  const isBestseller = params.get("is_bestseller")  === "true" || undefined;
  const isNewArrival = params.get("is_new_arrival") === "true" || undefined;

  const { data: categoriesData } = useCategories();
  const { data, isLoading } = useProducts({
    page,
    page_size: 20,
    sort,
    search:       search      || undefined,
    category_id:  categoryId  || undefined,
    is_featured:   isFeatured,
    is_bestseller: isBestseller,
    is_new_arrival: isNewArrival,
  });

  // ── URL update helper ───────────────────────────────────────────────────
  const push = useCallback((updates: Record<string, string | null>, resetPage = true) => {
    const next = new URLSearchParams(params.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    });
    if (resetPage) next.delete("page");
    router.replace(`/products?${next.toString()}`, { scroll: false });
  }, [params, router]);

  // ── Event handlers ──────────────────────────────────────────────────────
  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = (e.currentTarget.elements.namedItem("q") as HTMLInputElement).value.trim();
    push({ search: q || null });
  }

  function handleSort(value: string) {
    push({ sort: value });
  }

  function handleCategory(id: string) {
    push({ category_id: id === categoryId ? null : id });
  }

  function handlePage(p: number) {
    push({ page: String(p) }, false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ── Derived display ─────────────────────────────────────────────────────
  const activeLabel = isFeatured   ? "Staff Picks"
    : isBestseller  ? "Bestsellers"
    : isNewArrival  ? "New Arrivals"
    : categoryId && categoriesData ? (categoriesData.find((c) => c.id === categoryId)?.name ?? "All Books")
    : "All Books";

  const showGenrePills = !isFeatured && !isBestseller && !isNewArrival;

  return (
    <div style={{ background: "var(--color-background)", minHeight: "100vh" }}>
      {/* Page header */}
      <div className="py-14 px-5 sm:px-8 text-center" style={{ background: "var(--color-primary)" }}>
        <p className="text-xs tracking-[0.2em] uppercase font-medium mb-2"
           style={{ color: "var(--color-accent)" }}>Browse</p>
        <h1 className="font-display font-bold text-4xl sm:text-5xl" style={{ color: "#FAF7F2" }}>
          {activeLabel}
        </h1>
        {data && (
          <p className="mt-2 text-sm" style={{ color: "rgba(250,247,242,0.5)" }}>
            {data.meta.total} {data.meta.total === 1 ? "title" : "titles"}
          </p>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-10">
        {/* Search + Sort */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2" name="search-form">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                     style={{ color: "var(--color-text-muted)" }} />
              <input
                name="q"
                type="text"
                defaultValue={search}
                key={search}
                placeholder="Search by title or author…"
                className="w-full pl-10 pr-4 py-3 rounded-xl border text-sm outline-none transition-all"
                style={{ background: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}
                onFocus={(e) => (e.target.style.borderColor = "var(--color-accent)")}
                onBlur={(e)  => (e.target.style.borderColor = "var(--color-border)")}
              />
            </div>
            <button type="submit"
                    className="px-5 py-3 rounded-xl text-sm font-semibold transition-all"
                    style={{ background: "var(--color-primary)", color: "#FAF7F2" }}>
              Search
            </button>
          </form>

          <select
            value={sort}
            onChange={(e) => handleSort(e.target.value)}
            className="px-4 py-3 rounded-xl text-sm outline-none border appearance-none cursor-pointer"
            style={{ background: "var(--color-surface)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Genre pills */}
        {showGenrePills && categoriesData && (
          <div className="flex flex-wrap gap-2 mb-8">
            <button
              onClick={() => handleCategory("")}
              className="px-4 py-1.5 rounded-full text-xs font-medium transition-all border"
              style={!categoryId
                ? { background: "var(--color-primary)", color: "#FAF7F2", borderColor: "var(--color-primary)" }
                : { background: "transparent", color: "var(--color-text-secondary)", borderColor: "var(--color-border)" }}
            >
              All
            </button>
            {categoriesData.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategory(cat.id)}
                className="px-4 py-1.5 rounded-full text-xs font-medium transition-all border"
                style={cat.id === categoryId
                  ? { background: "var(--color-primary)", color: "#FAF7F2", borderColor: "var(--color-primary)" }
                  : { background: "transparent", color: "var(--color-text-secondary)", borderColor: "var(--color-border)" }}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* Active search chip */}
        {search && (
          <div className="flex items-center gap-2 mb-6">
            <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>Search:</span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
                  style={{ background: "var(--color-cream-dark)", color: "var(--color-text-primary)" }}>
              {search}
              <button onClick={() => push({ search: null })} aria-label="Clear search">
                <X size={11} />
              </button>
            </span>
          </div>
        )}

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-xl animate-pulse"
                   style={{ background: "var(--color-border)" }} />
            ))}
          </div>
        ) : data?.data.length === 0 ? (
          <div className="text-center py-24">
            <p className="font-display text-2xl mb-2" style={{ color: "var(--color-text-primary)" }}>
              No books found
            </p>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              Try a different search or browse all genres.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {(data?.data ?? []).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>

            {/* Pagination */}
            {data && data.meta.total_pages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-12">
                <button
                  onClick={() => handlePage(page - 1)}
                  disabled={page <= 1}
                  className="px-4 py-2 rounded-xl text-sm border transition-all disabled:opacity-30"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
                >
                  ← Prev
                </button>

                {Array.from({ length: data.meta.total_pages }, (_, i) => i + 1)
                  .filter((p) => Math.abs(p - page) <= 2 || p === 1 || p === data.meta.total_pages)
                  .reduce<(number | "…")[]>((acc, p, i, arr) => {
                    if (i > 0 && (p as number) - (arr[i - 1] as number) > 1) acc.push("…");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === "…" ? (
                      <span key={`ellipsis-${i}`} className="px-1 text-sm"
                            style={{ color: "var(--color-text-muted)" }}>…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => handlePage(p as number)}
                        className="w-10 h-10 rounded-xl text-sm font-medium transition-all"
                        style={(p as number) === page
                          ? { background: "var(--color-primary)", color: "#FAF7F2" }
                          : { border: `1px solid var(--color-border)`, color: "var(--color-text-secondary)" }}
                      >
                        {p}
                      </button>
                    )
                  )}

                <button
                  onClick={() => handlePage(page + 1)}
                  disabled={page >= data.meta.total_pages}
                  className="px-4 py-2 rounded-xl text-sm border transition-all disabled:opacity-30"
                  style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense>
      <ProductsContent />
    </Suspense>
  );
}
