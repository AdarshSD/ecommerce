import Link from "next/link";
import { fetchStoreConfig } from "@/lib/api/config";
import HomepageSections from "@/components/store/HomepageSections";

export const revalidate = 60;

export default async function HomePage() {
  let config = null;
  try {
    config = await fetchStoreConfig();
  } catch {
    // fallback
  }

  const visibleSections = (config?.homepage_sections ?? [])
    .filter((s) => s.is_visible && s.type !== "hero")
    .sort((a, b) => a.display_order - b.display_order);

  return (
    <div>
      {/* Hero */}
      <section className="bg-primary text-white py-24 px-4 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold mb-4 tracking-tight">
          {config?.hero_title ?? config?.store_name ?? "Leaf & Lore"}
        </h1>
        <p className="text-lg text-white/70 mb-8 max-w-xl mx-auto">
          {config?.hero_subtitle ?? config?.store_tagline ?? "Stories rooted in every page"}
        </p>
        <Link
          href="/products"
          className="inline-block bg-[var(--color-accent)] text-white px-8 py-3 rounded-lg font-medium hover:opacity-90 transition-base text-sm"
        >
          Shop all {config?.product_type_label_plural ?? "Books"}
        </Link>
      </section>

      {/* Product sections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <HomepageSections
          sections={visibleSections}
          currencySymbol={config?.currency_symbol ?? "$"}
        />
      </div>
    </div>
  );
}
