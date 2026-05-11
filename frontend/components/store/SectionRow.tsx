"use client";

import Link from "next/link";
import { useSectionProducts } from "@/lib/api/products";
import ProductCard from "./ProductCard";

interface Props {
  sectionId: string;
  title: string | null;
  subtitle?: string | null;
  currencySymbol?: string;
  viewAllHref?: string;
}

export default function SectionRow({ sectionId, title, subtitle, currencySymbol = "$", viewAllHref }: Props) {
  const { data: products, isLoading } = useSectionProducts(sectionId);

  if (isLoading) {
    return (
      <section className="py-10">
        {title && <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-6">{title}</h2>}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="aspect-[3/4] bg-[var(--color-border)] rounded-xl animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (!products || products.length === 0) return null;

  return (
    <section className="py-10">
      <div className="flex items-end justify-between mb-6">
        <div>
          {title && <h2 className="text-2xl font-semibold text-[var(--color-text-primary)]">{title}</h2>}
          {subtitle && <p className="text-sm text-[var(--color-text-secondary)] mt-1">{subtitle}</p>}
        </div>
        {viewAllHref && (
          <Link href={viewAllHref} className="text-sm font-medium text-[var(--color-accent)] hover:underline">
            View all →
          </Link>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {products.slice(0, 10).map((p) => (
          <ProductCard key={p.id} product={p} currencySymbol={currencySymbol} />
        ))}
      </div>
    </section>
  );
}
