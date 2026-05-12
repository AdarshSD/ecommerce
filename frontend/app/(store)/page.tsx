import { fetchStoreConfig } from "@/lib/api/config";
import Hero from "@/components/store/Hero";
import MarqueeBanner from "@/components/store/MarqueeBanner";
import HomepageSections from "@/components/store/HomepageSections";

export const revalidate = 60;

export default async function HomePage() {
  let config = null;
  try {
    config = await fetchStoreConfig();
  } catch {
    // fallback — backend not running
  }

  const visibleSections = (config?.homepage_sections ?? [])
    .filter((s) => s.is_visible && s.type !== "hero")
    .sort((a, b) => a.display_order - b.display_order);

  return (
    <div>
      <Hero />
      <MarqueeBanner />
      <HomepageSections
        sections={visibleSections}
        currencySymbol={config?.currency_symbol ?? "$"}
      />
    </div>
  );
}
