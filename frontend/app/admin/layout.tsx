"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { LayoutDashboard, BookOpen, ShoppingBag, Package, Tag, LogOut } from "lucide-react";
import { useAuthStore } from "@/lib/store/authStore";
import { useLogout } from "@/lib/api/auth";

const NAV = [
  { href: "/admin",           label: "Dashboard",  Icon: LayoutDashboard },
  { href: "/admin/products",  label: "Books",       Icon: BookOpen },
  { href: "/admin/orders",    label: "Orders",      Icon: ShoppingBag },
  { href: "/admin/inventory", label: "Inventory",   Icon: Package },
  { href: "/admin/categories",label: "Genres",      Icon: Tag },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const pathname = usePathname();
  const logout = useLogout();

  useEffect(() => {
    if (!user || (user.role === "CUSTOMER")) {
      router.push("/login");
    }
  }, [user, router]);

  if (!user || user.role === "CUSTOMER") return null;

  return (
    <div className="flex min-h-screen" style={{ background: "#f8fafc" }}>
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 flex flex-col" style={{ background: "#0f172a" }}>
        <div className="px-5 py-5 border-b border-white/10">
          <Link href="/" className="text-white font-semibold text-base">Leaf & Lore</Link>
          <p className="text-slate-400 text-xs mt-0.5">Admin</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ href, label, Icon }) => {
            const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
            return (
              <Link key={href} href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-base ${active ? "bg-white/10 text-white" : "text-slate-400 hover:text-white hover:bg-white/5"}`}>
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="px-3 py-4 border-t border-white/10">
          <button onClick={() => logout.mutate(undefined, { onSuccess: () => router.push("/") })}
            className="flex items-center gap-3 px-3 py-2.5 w-full text-left text-slate-400 hover:text-white text-sm transition-base rounded-lg hover:bg-white/5">
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white border-b border-slate-200 px-6 py-4">
          <p className="text-sm text-slate-500">Signed in as <span className="font-medium text-slate-700">{user.email}</span></p>
        </header>
        <main className="px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
