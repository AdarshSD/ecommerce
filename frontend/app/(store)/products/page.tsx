"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useProducts } from "@/lib/api/products";
import { useCategories } from "@/lib/api/categories";
import ProductCard from "@/components/store/ProductCard";

const SORT_OPTIONS = [
  { value: "newest",      label: "Newest" },
  { value: "bestseller",  label: "Bestsellers" },
  { value: "price_asc",   label: "Price: Low → High" },
  { value: "price_desc",  label: "Price: High → Low" },
  { value: "title_asc",   label: "Title A–Z" },
];

function ProductsContent() {
  const params = useSearchParams();

  const [search, setSearch]         = useState(params.get("search") ?? "");
  const [inputValue, setInputValue] = useState(params.get("search") ?? "");
  const [sort, setSort]             = useState("newest");
  const [categoryId, setCategoryId] = useState(params.get("category_id") ?? "");
  const [page, setPage]             = useState(1);

  // Honour boolean filter flags from URL (e.g. from nav links)
  const isFeatured    = params.get("is_featured") === "true"    || undefined;
  const isBestseller  = params.get("is_bestseller") === "true"  || undefined;
  const isNewArrival  = params.get("is_new_arrival") === "true" || undefined;

  const { data: categoriesData } = useCategories();

  const filters = {
    page,
    page_size: 20,
    sort,
    search: search || undefined,
    category_id: categoryId || undefined,
    is_featured:    isFeatured,
    is_bestseller:  isBestseller,
    is_new_arrival: isNewArrival,
  };

  const { data, isLoading } = useProducts(filters);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [search, sort, categoryId]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(inputValue);
  }

  const activeLabel = isFeatured
    ? "Staff Picks"
    : isBestseller
    ? "Bestsellers"
    : isNewArrival
    ? "New Arrivals"
    : categoryId && categoriesData
    ? (categoriesData.find((c) => c.id === categoryId)?.name ?? "All Books")
    : "All Books";

  return (
    <div style={{ background: "var(--color-background)", minHeight: "100vh" }}>
      {/* Page header */}
      <div className="py-14 px-5 sm:px-8 text-center" style={{ background: "var(--color-primary)" }}>
        <p className="text-xs tracking-[0.2em] uppercase font-medium mb-2" style={{ color: "var(--color-accent)" }}>
          Browse
        </p>
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
        {/* Search + Sort bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <form onSubmit={handleSearch} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                     style={{ color: "var(--color-text-muted)" }} />
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Search by title or author…"
                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm outline-none border"
                style={{
                  background: "var(--color-surface)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-text-primary)",
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--color-accent)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
              />
            </div>
            <button
              type="submit"
              className="px-5 py-3 rounded-xl text-sm font-semibold transition-all"
              style={{ background: "var(--color-primary)", color: "#FAF7F2" }}
            >
              Search
            </button>
          </form>

          <select
            value={sort}
            onChange={(e) => { setSort(e.target.value); setPage(1); }}
            className="px-4 py-3 rounded-xl text-sm outline-none border appearance-none cursor-pointer"
            style={{
              background: "var(--color-surface)",
              borderColor: "var(--color-border)",
              color: "var(--color-text-primary)",
            }}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Genre pills */}
        {!isFeatured && !isBestseller && !isNewArrival && categoriesData && (
          <div className="flex flex-wrap gap-2 mb-8">
            <button
              onClick={() => setCategoryId("")}
              className="px-4 py-1.5 rounded-full text-xs font-medium transition-all border"
              style={
                !categoryId
                  ? { background: "var(--color-primary)", color: "#FAF7F2", borderColor: "var(--color-primary)" }
                  : { background: "transparent", color: "var(--color-text-secondary)", borderColor: "var(--color-border)" }
              }
            >
              All
            </button>
            {categoriesData.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryId(cat.id === categoryId ? "" : cat.id)}
                className="px-4 py-1.5 rounded-full text-xs font-medium transition-all border"
                style={
                  cat.id === categoryId
                    ? { background: "var(--color-primary)", color: "#FAF7F2", borderColor: "var(--color-primary)" }
                    : { background: "transparent", color: "var(--color-text-secondary)", borderColor: "var(--color-border)" }
                }
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* Active filters */}
        {search && (
          <div className="flex items-center gap-2 mb-6">
            <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>Search:</span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
                  style={{ background: "var(--color-cream-dark)", color: "var(--color-text-primary)" }}>
              {search}
              <button onClick={() => { setSearch(""); setInputValue(""); }}>
                <X size={11} />
              </button>
            </span>
          </div>
        )}

        {/* Results grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-xl animate-pulse"
                   style={{ background: "var(--color-border)" }} />
            ))}
          </div>
        ) : data?.data.length === 0 ? (
          <div className="text-center py-24">
            <p className="font-display text-2xl mb-2" style={{ color: "var(--color-text-primary)" }}>No books found</p>
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
              <div className="flex justify-center gap-2 mt-12">
                {page > 1 && (
                  <button
                    onClick={() => setPage(page - 1)}
                    className="px-4 py-2 rounded-xl text-sm border transition-all"
                    style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
                  >
                    ← Prev
                  </button>
                )}
                {Array.from({ length: data.meta.total_pages }, (_, i) => i + 1)
                  .filter((p) => Math.abs(p - page) <= 2)
                  .map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className="w-10 h-10 rounded-xl text-sm font-medium transition-all"
                      style={
                        p === page
                          ? { background: "var(--color-primary)", color: "#FAF7F2" }
                          : { border: `1px solid var(--color-border)`, color: "var(--color-text-secondary)" }
                      }
                    >
                      {p}
                    </button>
                  ))}
                {page < data.meta.total_pages && (
                  <button
                    onClick={() => setPage(page + 1)}
                    className="px-4 py-2 rounded-xl text-sm border transition-all"
                    style={{ borderColor: "var(--color-border)", color: "var(--color-text-secondary)" }}
                  >
                    Next →
                  </button>
                )}
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
