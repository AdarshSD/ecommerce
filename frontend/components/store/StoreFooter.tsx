import Link from "next/link";
import { BookOpen, Mail, MapPin } from "lucide-react";
import { StoreConfig } from "@/lib/api/config";
import Logo from "./Logo";

interface Props {
  config: StoreConfig | null;
}

export default function StoreFooter({ config }: Props) {
  const year = new Date().getFullYear();
  const storeName = config?.store_name ?? "Leaf & Lore";
  const tagline = config?.store_tagline ?? "Stories rooted in every page.";

  return (
    <footer style={{ background: "var(--color-primary)" }}>
      <div className="max-w-7xl mx-auto px-5 sm:px-8 pt-16 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-14">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Logo light />
            <p className="mt-4 text-sm leading-relaxed" style={{ color: "rgba(250,247,242,0.55)" }}>
              {tagline}
            </p>
            <div className="flex items-center gap-1.5 mt-4 text-xs" style={{ color: "rgba(250,247,242,0.4)" }}>
              <MapPin size={12} />
              <span>Independent · Est. 2024</span>
            </div>
          </div>

          {/* Shop */}
          <div>
            <p className="text-xs font-semibold tracking-[0.15em] uppercase mb-4"
               style={{ color: "var(--color-accent)" }}>
              Shop
            </p>
            <ul className="space-y-2.5">
              {[
                { href: "/products", label: "All Books" },
                { href: "/products?is_bestseller=true", label: "Bestsellers" },
                { href: "/products?is_featured=true", label: "Staff Picks" },
                { href: "/products?is_new_arrival=true", label: "New Arrivals" },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm transition-colors duration-200"
                    style={{ color: "rgba(250,247,242,0.6)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#FAF7F2")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(250,247,242,0.6)")}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <p className="text-xs font-semibold tracking-[0.15em] uppercase mb-4"
               style={{ color: "var(--color-accent)" }}>
              Account
            </p>
            <ul className="space-y-2.5">
              {[
                { href: "/login", label: "Sign In" },
                { href: "/register", label: "Create Account" },
                { href: "/orders", label: "Order History" },
                { href: "/account", label: "My Account" },
              ].map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm transition-colors duration-200"
                    style={{ color: "rgba(250,247,242,0.6)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#FAF7F2")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(250,247,242,0.6)")}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="text-xs font-semibold tracking-[0.15em] uppercase mb-4"
               style={{ color: "var(--color-accent)" }}>
              Help
            </p>
            <ul className="space-y-3">
              {config?.support_email && (
                <li className="flex items-center gap-2 text-sm" style={{ color: "rgba(250,247,242,0.6)" }}>
                  <Mail size={13} />
                  <a href={`mailto:${config.support_email}`}
                     className="hover:text-[#FAF7F2] transition-colors">{config.support_email}</a>
                </li>
              )}
              {config?.shipping_policy && (
                <li className="text-xs leading-relaxed" style={{ color: "rgba(250,247,242,0.45)" }}>
                  {config.shipping_policy}
                </li>
              )}
              <li>
                <div className="flex items-center gap-2 text-xs" style={{ color: "rgba(250,247,242,0.4)" }}>
                  <BookOpen size={12} />
                  <span>Free shipping on orders over $50</span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-3"
             style={{ borderColor: "rgba(250,247,242,0.08)" }}>
          <p className="text-xs" style={{ color: "rgba(250,247,242,0.35)" }}>
            © {year} {storeName}. All rights reserved.
          </p>
          <p className="text-xs" style={{ color: "rgba(250,247,242,0.25)" }}>
            Built with care for stories.
          </p>
        </div>
      </div>
    </footer>
  );
}
