"use client";

import Link from "next/link";
import { useCategories } from "@/lib/api/categories";

const GENRE_GRADIENTS: Record<string, string> = {
  "Fiction":              "from-indigo-900/80 to-indigo-950/90",
  "Non-Fiction":          "from-slate-800/80 to-slate-900/90",
  "Mystery & Thriller":   "from-red-900/80 to-red-950/90",
  "Science Fiction":      "from-blue-900/80 to-blue-950/90",
  "Fantasy":              "from-purple-900/80 to-purple-950/90",
  "Biography & Memoir":   "from-amber-900/80 to-amber-950/90",
  "History":              "from-stone-800/80 to-stone-900/90",
  "Self-Help":            "from-emerald-900/80 to-emerald-950/90",
  "Romance":              "from-pink-900/80 to-pink-950/90",
  "Horror":               "from-zinc-900/80 to-zinc-950/90",
  "Children's":           "from-yellow-800/80 to-yellow-900/90",
  "Graphic Novel":        "from-violet-900/80 to-violet-950/90",
  "Philosophy":           "from-teal-900/80 to-teal-950/90",
  "Travel":               "from-cyan-900/80 to-cyan-950/90",
  "Science & Nature":     "from-green-900/80 to-green-950/90",
};

const GENRE_SYMBOLS: Record<string, string> = {
  "Fiction": "✦", "Non-Fiction": "◈", "Mystery & Thriller": "⬡",
  "Science Fiction": "◎", "Fantasy": "✧", "Biography & Memoir": "◉",
  "History": "⬟", "Self-Help": "◇", "Romance": "♡",
  "Horror": "◆", "Children's": "★", "Graphic Novel": "▲",
  "Philosophy": "∞", "Travel": "◈", "Science & Nature": "✿",
};

function getGradient(name: string) {
  return GENRE_GRADIENTS[name] ?? "from-gray-800/80 to-gray-900/90";
}

export default function GenreGrid() {
  const { data: categories, isLoading } = useCategories();

  return (
    <section className="py-24" style={{ background: "var(--color-primary-dark)" }}>
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-xs tracking-[0.2em] uppercase font-medium mb-3" style={{ color: "var(--color-accent)" }}>
            Explore
          </p>
          <h2 className="font-display font-bold text-white leading-tight"
              style={{ fontSize: "clamp(2rem, 4vw, 3rem)" }}>
            Find Your Next Read
          </h2>
          <p className="mt-3 text-base max-w-md mx-auto" style={{ color: "rgba(250,247,242,0.45)" }}>
            From sweeping epics to quiet meditations — every taste, every mood.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-36 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,0.05)" }} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {(categories ?? []).map((genre) => (
              <Link
                key={genre.id}
                href={`/products?category_id=${genre.id}`}
                className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${getGradient(genre.name)} p-6 transition-all duration-300 border`}
                style={{ minHeight: "140px", borderColor: "rgba(255,255,255,0.05)" }}
              >
                {/* Hover glow */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300"
                     style={{ background: "radial-gradient(circle at 30% 70%, var(--color-accent), transparent 70%)" }} />

                {/* Decorative symbol */}
                <div className="absolute top-3 right-4 font-display font-bold select-none transition-opacity opacity-10 group-hover:opacity-20"
                     style={{ fontSize: "60px", lineHeight: 1, color: "var(--color-accent)" }}>
                  {GENRE_SYMBOLS[genre.name] ?? "◈"}
                </div>

                {/* Content */}
                <div className="relative">
                  <p className="font-semibold text-base leading-tight mb-1.5 transition-colors"
                     style={{ color: "rgba(250,247,242,0.9)" }}>
                    {genre.name}
                  </p>
                  <p className="text-xs font-medium" style={{ color: "rgba(250,247,242,0.35)" }}>
                    {genre.product_count} {genre.product_count === 1 ? "title" : "titles"}
                  </p>
                </div>

                {/* Arrow */}
                <div className="absolute bottom-4 right-4 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0"
                     style={{ background: "rgba(255,255,255,0.1)" }}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5h6M5 2l3 3-3 3" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
