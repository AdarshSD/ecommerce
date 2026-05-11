import Link from "next/link";
import { StoreConfig } from "@/lib/api/config";

interface Props {
  config: StoreConfig | null;
}

export default function StoreFooter({ config }: Props) {
  const storeName = config?.store_name ?? "Leaf & Lore";

  return (
    <footer className="bg-primary text-white/70 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <p className="text-white font-semibold text-lg mb-2">{storeName}</p>
            {config?.store_tagline && (
              <p className="text-sm">{config.store_tagline}</p>
            )}
          </div>
          <div>
            <p className="text-white font-medium mb-3 text-sm">Shop</p>
            <ul className="space-y-2 text-sm">
              <li><Link href="/products" className="hover:text-white transition-base">All Books</Link></li>
              <li><Link href="/products?is_bestseller=true" className="hover:text-white transition-base">Bestsellers</Link></li>
              <li><Link href="/products?is_featured=true" className="hover:text-white transition-base">Staff Picks</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-white font-medium mb-3 text-sm">Help</p>
            <ul className="space-y-2 text-sm">
              {config?.support_email && (
                <li><a href={`mailto:${config.support_email}`} className="hover:text-white transition-base">{config.support_email}</a></li>
              )}
              {config?.shipping_policy && <li className="text-xs leading-relaxed">{config.shipping_policy}</li>}
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10 mt-8 pt-6 text-xs text-center">
          © {new Date().getFullYear()} {storeName}. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
