"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useSectionProducts } from "@/lib/api/products";
import ProductCard from "./ProductCard";

interface Props {
  sectionId: string;
  title: string | null;
  subtitle?: string | null;
  currencySymbol?: string;
  viewAllHref?: string;
  sectionIcon?: string;
  sectionLabel?: string;
  darkBg?: boolean;
}

export default function SectionRow({
  sectionId,
  title,
  subtitle,
  currencySymbol = "$",
  viewAllHref,
  sectionIcon,
  sectionLabel,
  darkBg = false,
}: Props) {
  const { data: products, isLoading } = useSectionProducts(sectionId);

  const bgStyle = darkBg
    ? { background: "var(--color-primary-dark)" }
    : { background: "var(--color-surface)" };
  const headingColor = darkBg ? "#FAF7F2" : "var(--color-text-primary)";
  const subColor = darkBg ? "rgba(250,247,242,0.5)" : "var(--color-text-secondary)";

  return (
    <section className="py-24" style={bgStyle}>
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        {/* Header */}
        <div className="flex items-end justify-between mb-12">
          <div>
            {sectionLabel && (
              <p className="text-xs tracking-[0.2em] uppercase font-medium mb-2"
                 style={{ color: "var(--color-accent)" }}>
                {sectionLabel}
              </p>
            )}
            {title && (
              <h2 className="font-display font-bold text-3xl" style={{ color: headingColor }}>
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-sm mt-1" style={{ color: subColor }}>{subtitle}</p>
            )}
          </div>
          {viewAllHref && (
            <Link
              href={viewAllHref}
              className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium transition-colors group"
              style={{ color: "var(--color-accent)" }}
            >
              View all <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-xl animate-pulse"
                   style={{ background: darkBg ? "rgba(255,255,255,0.06)" : "var(--color-border)" }} />
            ))}
          </div>
        ) : !products || products.length === 0 ? null : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {products.slice(0, 10).map((p) => (
              <ProductCard key={p.id} product={p} currencySymbol={currencySymbol} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
