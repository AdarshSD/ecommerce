import { fetchStoreConfig, StoreConfig } from "@/lib/api/config";
import StoreShell from "@/components/store/StoreShell";

export const revalidate = 60;

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  let config: StoreConfig | null = null;
  try {
    config = await fetchStoreConfig();
  } catch {
    // Backend not running — use CSS variable defaults
  }

  const cssVars = config
    ? ({
        "--color-primary":         config.primary_colour,
        "--color-primary-dark":    "#0D2218",
        "--color-primary-mid":     "#2D5438",
        "--color-secondary":       config.secondary_colour,
        "--color-accent":          config.accent_colour,
        "--color-background":      config.background_colour,
        "--color-surface":         config.surface_colour,
        "--color-cream-dark":      "#F0EBE3",
        "--color-text-primary":    config.text_primary_colour,
        "--color-text-secondary":  config.text_secondary_colour,
        "--color-text-muted":      "#9CA3AF",
        "--color-border":          config.border_colour,
        "--font-family":           `'${config.font_family}', sans-serif`,
      } as React.CSSProperties)
    : {};

  return (
    <div style={cssVars} className="flex flex-col min-h-screen">
      {config && (
        <link
          rel="stylesheet"
          href={`https://fonts.googleapis.com/css2?family=${encodeURIComponent(config.font_family)}:wght@300;400;500;600;700&display=swap`}
        />
      )}
      <StoreShell config={config}>{children}</StoreShell>
    </div>
  );
}
