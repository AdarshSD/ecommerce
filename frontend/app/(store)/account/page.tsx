"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, Package, ShieldCheck, User } from "lucide-react";
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
      onSuccess: () => { addToast({ message: "Signed out.", type: "info" }); router.push("/"); },
    });
  }

  const initials = `${user.first_name[0] ?? ""}${user.last_name[0] ?? ""}`.toUpperCase();

  return (
    <div className="min-h-screen" style={{ background: "var(--color-background)" }}>
      {/* Header band */}
      <div className="py-14" style={{ background: "var(--color-primary)" }}>
        <div className="max-w-2xl mx-auto px-5 sm:px-8 flex items-center gap-5">
          <div className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0 font-display font-bold text-xl"
               style={{ background: "var(--color-accent)", color: "var(--color-primary-dark)" }}>
            {initials || <User size={24} />}
          </div>
          <div>
            <h1 className="font-display font-bold text-3xl" style={{ color: "#FAF7F2" }}>
              {user.first_name} {user.last_name}
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "rgba(250,247,242,0.55)" }}>
              {user.email}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 sm:px-8 py-10">
        {/* Navigation cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          <Link
            href="/orders"
            className="group flex items-center gap-4 p-5 rounded-2xl border transition-all"
            style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
          >
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                 style={{ background: "var(--color-background)" }}>
              <Package size={20} style={{ color: "var(--color-primary)" }} />
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: "var(--color-text-primary)" }}>My Orders</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>View your order history</p>
            </div>
          </Link>

          {user.role !== "CUSTOMER" && (
            <Link
              href="/admin"
              className="group flex items-center gap-4 p-5 rounded-2xl border transition-all"
              style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                   style={{ background: "var(--color-background)" }}>
                <ShieldCheck size={20} style={{ color: "var(--color-primary)" }} />
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ color: "var(--color-text-primary)" }}>Admin Dashboard</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>Manage the store</p>
              </div>
            </Link>
          )}
        </div>

        {/* Account info */}
        <div className="rounded-2xl border p-6 mb-8"
             style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
          <h2 className="font-semibold text-sm mb-4" style={{ color: "var(--color-text-secondary)" }}>
            Account Details
          </h2>
          <div className="space-y-3">
            {[
              { label: "Name", value: `${user.first_name} ${user.last_name}` },
              { label: "Email", value: user.email },
              { label: "Role", value: user.role },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between text-sm py-2 border-b"
                   style={{ borderColor: "var(--color-border)" }}>
                <span style={{ color: "var(--color-text-muted)" }}>{label}</span>
                <span className="font-medium" style={{ color: "var(--color-text-primary)" }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Sign out */}
        <button
          onClick={handleLogout}
          disabled={logout.isPending}
          className="flex items-center gap-2 text-sm transition-colors"
          style={{ color: "#ef4444" }}
        >
          <LogOut size={15} />
          {logout.isPending ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </div>
  );
}
