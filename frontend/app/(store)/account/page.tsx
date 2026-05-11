"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, Package } from "lucide-react";
import { useAuthStore } from "@/lib/store/authStore";
import { useLogout } from "@/lib/api/auth";
import { useUIStore } from "@/lib/store/uiStore";

export default function AccountPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();
  const { addToast } = useUIStore();

  useEffect(() => { if (!user) router.push("/login?next=/account"); }, [user, router]);
  if (!user) return null;

  function handleLogout() {
    logout.mutate(undefined, {
      onSuccess: () => { addToast({ message: "Logged out.", type: "info" }); router.push("/"); },
    });
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-3xl font-semibold text-[var(--color-text-primary)] mb-2">My Account</h1>
      <p className="text-[var(--color-text-secondary)] text-sm mb-8">
        {user.first_name} {user.last_name} · {user.email}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/orders" className="flex items-center gap-3 p-5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl hover:border-[var(--color-accent)] transition-base">
          <Package size={20} className="text-[var(--color-accent)]" />
          <div>
            <p className="font-medium text-[var(--color-text-primary)] text-sm">My Orders</p>
            <p className="text-xs text-[var(--color-text-secondary)]">View order history</p>
          </div>
        </Link>
        {user.role !== "CUSTOMER" && (
          <Link href="/admin" className="flex items-center gap-3 p-5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl hover:border-[var(--color-accent)] transition-base">
            <div>
              <p className="font-medium text-[var(--color-text-primary)] text-sm">Admin Dashboard</p>
              <p className="text-xs text-[var(--color-text-secondary)]">Manage the store</p>
            </div>
          </Link>
        )}
      </div>
      <button onClick={handleLogout} disabled={logout.isPending}
        className="mt-8 flex items-center gap-2 text-sm text-red-500 hover:text-red-600 transition-base">
        <LogOut size={16} /> {logout.isPending ? "Signing out…" : "Sign out"}
      </button>
    </div>
  );
}
