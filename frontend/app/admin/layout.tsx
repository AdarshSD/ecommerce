"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  LayoutDashboard, BookOpen, ShoppingBag,
  Package, Tag, LogOut, Store,
} from "lucide-react";
import { useAuthStore } from "@/lib/store/authStore";
import { useLogout } from "@/lib/api/auth";

const NAV = [
  { href: "/admin",            label: "Dashboard",  Icon: LayoutDashboard },
  { href: "/admin/products",   label: "Books",      Icon: BookOpen },
  { href: "/admin/orders",     label: "Orders",     Icon: ShoppingBag },
  { href: "/admin/inventory",  label: "Inventory",  Icon: Package },
  { href: "/admin/categories", label: "Genres",     Icon: Tag },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const pathname = usePathname();
  const logout = useLogout();

  useEffect(() => {
    if (!user || user.role === "CUSTOMER") router.push("/login");
  }, [user, router]);

  if (!user || user.role === "CUSTOMER") return null;

  return (
    <div className="flex min-h-screen" style={{ background: "#f8fafc" }}>
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 flex flex-col" style={{ background: "#0f172a" }}>
        {/* Brand */}
        <div className="px-4 py-5 border-b" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                 style={{ background: "#C9A84C" }}>
              <Store size={13} style={{ color: "#0D2218" }} />
            </div>
            <div>
              <p className="text-white text-sm font-semibold leading-none">Leaf & Lore</p>
              <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>Admin Console</p>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-0.5">
          {NAV.map(({ href, label, Icon }) => {
            const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all"
                style={active
                  ? { background: "rgba(201,168,76,0.15)", color: "#C9A84C" }
                  : { color: "rgba(255,255,255,0.45)" }
                }
                onMouseEnter={(e) => { if (!active) (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.8)"; }}
                onMouseLeave={(e) => { if (!active) (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.45)"; }}
              >
                <Icon size={15} />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* User + Logout */}
        <div className="px-2 py-4 border-t" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          <div className="px-3 py-2 mb-2">
            <p className="text-xs font-medium truncate" style={{ color: "rgba(255,255,255,0.6)" }}>
              {user.first_name} {user.last_name}
            </p>
            <p className="text-[10px] truncate" style={{ color: "rgba(255,255,255,0.3)" }}>{user.email}</p>
          </div>
          <button
            onClick={() => logout.mutate(undefined, { onSuccess: () => router.push("/") })}
            className="flex items-center gap-3 px-3 py-2.5 w-full text-left text-sm rounded-lg transition-all"
            style={{ color: "rgba(255,255,255,0.35)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}
          >
            <LogOut size={15} /> Sign out
          </button>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 overflow-auto flex flex-col">
        <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between">
          <nav className="flex items-center gap-1.5 text-sm" style={{ color: "#64748b" }}>
            <Link href="/admin" className="hover:text-slate-900 transition-colors">Admin</Link>
            {pathname !== "/admin" && (
              <>
                <span>/</span>
                <span className="font-medium text-slate-900 capitalize">
                  {pathname.split("/").filter(Boolean).slice(1).join(" / ")}
                </span>
              </>
            )}
          </nav>
          <Link href="/" className="text-xs hover:text-slate-900 transition-colors" style={{ color: "#94a3b8" }}>
            ← Back to store
          </Link>
        </header>
        <main className="flex-1 px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
