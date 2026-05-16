"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LogOut, Package, ShieldCheck, User, Pencil, Trash2, Plus, X } from "lucide-react";
import { useAuthStore } from "@/lib/store/authStore";
import { useLogout } from "@/lib/api/auth";
import { useUIStore } from "@/lib/store/uiStore";
import {
  useAddresses, useCreateAddress, useUpdateAddress, useDeleteAddress,
  addressDisplayLabel, LABEL_COLOURS, Address, CreateAddressInput,
} from "@/lib/api/addresses";
import AddressForm from "@/components/store/AddressForm";

const MAX_ADDRESSES = 10;

export default function AccountPage() {
  const router = useRouter();
  const user   = useAuthStore((s) => s.user);
  const logout = useLogout();
  const { addToast } = useUIStore();

  const { data: addresses = [], isLoading: addrLoading } = useAddresses(!!user);
  const createAddress = useCreateAddress();
  const updateAddress = useUpdateAddress();
  const deleteAddress = useDeleteAddress();

  const [showAddForm, setShowAddForm]   = useState(false);
  const [editingAddr, setEditingAddr]   = useState<Address | null>(null);

  useEffect(() => { if (!user) router.push("/login?next=/account"); }, [user, router]);
  if (!user) return null;

  const initials = `${user.first_name[0] ?? ""}${user.last_name[0] ?? ""}`.toUpperCase();

  function handleLogout() {
    logout.mutate(undefined, {
      onSuccess: () => { addToast({ message: "Signed out.", type: "info" }); router.push("/"); },
    });
  }

  async function handleCreate(data: CreateAddressInput) {
    try {
      await createAddress.mutateAsync(data);
      addToast({ message: "Address saved.", type: "success" });
      setShowAddForm(false);
    } catch (err: any) {
      addToast({ message: err?.message ?? "Could not save address.", type: "error" });
      throw err;
    }
  }

  async function handleUpdate(data: CreateAddressInput) {
    if (!editingAddr) return;
    try {
      await updateAddress.mutateAsync({ id: editingAddr.id, ...data });
      addToast({ message: "Address updated.", type: "success" });
      setEditingAddr(null);
    } catch (err: any) {
      addToast({ message: err?.message ?? "Could not update address.", type: "error" });
      throw err;
    }
  }

  async function handleDelete(addr: Address) {
    if (!confirm(`Delete this ${addressDisplayLabel(addr)} address?`)) return;
    try {
      await deleteAddress.mutateAsync(addr.id);
      addToast({ message: "Address removed.", type: "success" });
    } catch (err: any) {
      addToast({ message: err?.message ?? "Could not delete address.", type: "error" });
    }
  }

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
            <p className="text-sm mt-0.5" style={{ color: "rgba(250,247,242,0.55)" }}>{user.email}</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 sm:px-8 py-10 space-y-8">
        {/* Navigation cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { href: "/orders", icon: Package, label: "My Orders", sub: "View your order history" },
            ...(user.role !== "CUSTOMER"
              ? [{ href: "/admin", icon: ShieldCheck, label: "Admin Dashboard", sub: "Manage the store" }]
              : []),
          ].map(({ href, icon: Icon, label, sub }) => (
            <Link key={href} href={href}
              className="group flex items-center gap-4 p-5 rounded-2xl border transition-all"
              style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--color-accent)")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                   style={{ background: "var(--color-background)" }}>
                <Icon size={20} style={{ color: "var(--color-primary)" }} />
              </div>
              <div>
                <p className="font-semibold text-sm" style={{ color: "var(--color-text-primary)" }}>{label}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>{sub}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* ── Saved Addresses ────────────────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-display font-bold text-xl" style={{ color: "var(--color-text-primary)" }}>
                Saved Addresses
              </h2>
              <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                {addresses.length} / {MAX_ADDRESSES} saved
              </p>
            </div>
            {!showAddForm && !editingAddr && addresses.length < MAX_ADDRESSES && (
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-full transition-all"
                style={{ background: "var(--color-primary)", color: "#FAF7F2" }}
              >
                <Plus size={14} /> Add address
              </button>
            )}
          </div>

          {/* Add form */}
          {showAddForm && (
            <div className="rounded-2xl border p-5 mb-4"
                 style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm" style={{ color: "var(--color-text-primary)" }}>New address</h3>
                <button onClick={() => setShowAddForm(false)}>
                  <X size={16} style={{ color: "var(--color-text-muted)" }} />
                </button>
              </div>
              <AddressForm onSubmit={handleCreate} onCancel={() => setShowAddForm(false)} />
            </div>
          )}

          {/* Address cards */}
          {addrLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-24 rounded-2xl animate-pulse" style={{ background: "var(--color-border)" }} />
              ))}
            </div>
          ) : addresses.length === 0 && !showAddForm ? (
            <div className="text-center py-10 rounded-2xl border"
                 style={{ borderColor: "var(--color-border)", borderStyle: "dashed" }}>
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>No saved addresses yet.</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="mt-2 text-sm font-semibold"
                style={{ color: "var(--color-accent)" }}
              >
                Add your first address →
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {addresses.map((addr) => {
                const badge = LABEL_COLOURS[addr.label];
                const isEditing = editingAddr?.id === addr.id;

                return (
                  <div key={addr.id} className="rounded-2xl border overflow-hidden"
                       style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
                    {/* Card header */}
                    <div className="flex items-center justify-between px-5 py-3 border-b"
                         style={{ borderColor: "var(--color-border)" }}>
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                            style={{ background: badge.bg, color: badge.color }}>
                        {addressDisplayLabel(addr)}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditingAddr(isEditing ? null : addr)}
                          className="p-1.5 rounded-lg transition-colors"
                          style={{ color: "var(--color-text-muted)" }}
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(addr)}
                          className="p-1.5 rounded-lg transition-colors"
                          style={{ color: "var(--color-text-muted)" }}
                          title="Delete"
                          onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-muted)")}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Address text */}
                    {!isEditing && (
                      <div className="px-5 py-4 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                        <p className="font-medium" style={{ color: "var(--color-text-primary)" }}>{addr.full_name}</p>
                        <p>{addr.line_1}{addr.line_2 ? `, ${addr.line_2}` : ""}</p>
                        <p>{addr.city}{addr.state ? `, ${addr.state}` : ""} {addr.postcode}</p>
                        <p>{addr.country_code === "US" ? "United States" : addr.country_code}</p>
                      </div>
                    )}

                    {/* Edit form inline */}
                    {isEditing && (
                      <div className="px-5 py-4">
                        <AddressForm
                          initial={addr}
                          onSubmit={handleUpdate}
                          onCancel={() => setEditingAddr(null)}
                          submitLabel="Update address"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Account details */}
        <div className="rounded-2xl border p-6"
             style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
          <h2 className="font-semibold text-sm mb-4" style={{ color: "var(--color-text-secondary)" }}>Account Details</h2>
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

        <button onClick={handleLogout} disabled={logout.isPending}
          className="flex items-center gap-2 text-sm transition-colors" style={{ color: "#ef4444" }}>
          <LogOut size={15} />
          {logout.isPending ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </div>
  );
}
