"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle, MapPin, Plus, X, ShoppingBag, Pencil, Trash2 } from "lucide-react";
import { useCart } from "@/lib/api/cart";
import { usePlaceOrder } from "@/lib/api/orders";
import { useAuthStore } from "@/lib/store/authStore";
import { useUIStore } from "@/lib/store/uiStore";
import {
  useAddresses, useCreateAddress, useUpdateAddress, useDeleteAddress,
  addressDisplayLabel, LABEL_COLOURS, CreateAddressInput, Address,
} from "@/lib/api/addresses";
import AddressForm from "@/components/store/AddressForm";

export default function CheckoutPage() {
  const router = useRouter();
  const user   = useAuthStore((s) => s.user);
  const { data: cart }    = useCart();
  const placeOrder        = usePlaceOrder();
  const { addToast }      = useUIStore();

  const { data: addresses = [] } = useAddresses(!!user);
  const createAddress = useCreateAddress();
  const updateAddress = useUpdateAddress();
  const deleteAddress = useDeleteAddress();

  const [selectedAddress, setSelectedAddress] = useState("");
  const [notes, setNotes]                     = useState("");
  const [showAddForm, setShowAddForm]          = useState(false);
  const [editingAddr, setEditingAddr]          = useState<Address | null>(null);
  const [confirmedOrder, setConfirmedOrder]    = useState<any>(null);

  // Pre-select first (Home) address
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddress) {
      setSelectedAddress(addresses[0].id);
    }
  }, [addresses, selectedAddress]);

  useEffect(() => {
    if (!user) router.push("/login?next=/checkout");
  }, [user, router]);

  async function handleAddAddress(data: CreateAddressInput) {
    try {
      const newAddr = await createAddress.mutateAsync(data);
      setSelectedAddress(newAddr.id);
      setShowAddForm(false);
      addToast({ message: "Address saved.", type: "success" });
    } catch (err: any) {
      addToast({ message: err?.message ?? "Could not save address.", type: "error" });
      throw err;
    }
  }

  async function handleUpdateAddress(data: CreateAddressInput) {
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

  async function handleDeleteAddress(addr: Address) {
    if (!confirm(`Delete this ${addressDisplayLabel(addr)} address?`)) return;
    try {
      await deleteAddress.mutateAsync(addr.id);
      if (selectedAddress === addr.id) setSelectedAddress("");
      addToast({ message: "Address removed.", type: "success" });
    } catch (err: any) {
      addToast({ message: err?.message ?? "Could not delete address.", type: "error" });
    }
  }

  function handlePlaceOrder() {
    if (!selectedAddress) {
      addToast({ message: "Please select a delivery address.", type: "error" });
      return;
    }
    placeOrder.mutate(
      { address_id: selectedAddress, notes: notes || undefined },
      {
        onSuccess: (order) => setConfirmedOrder(order),
        onError: (err: any) => addToast({ message: err?.message ?? "Checkout failed.", type: "error" }),
      }
    );
  }

  // ── Confirmed screen ───────────────────────────────────────────────────
  if (confirmedOrder) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--color-background)" }}>
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
               style={{ background: "var(--color-primary)" }}>
            <CheckCircle size={36} style={{ color: "var(--color-accent)" }} />
          </div>
          <h1 className="font-display font-bold text-3xl mb-2" style={{ color: "var(--color-text-primary)" }}>
            Order confirmed!
          </h1>
          <p className="text-sm mb-1" style={{ color: "var(--color-text-secondary)" }}>Thank you for your purchase.</p>
          <p className="font-mono text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>
            {confirmedOrder.payment_reference}
          </p>
          <p className="font-display font-bold text-2xl mt-4 mb-8" style={{ color: "var(--color-primary)" }}>
            ${Number(confirmedOrder.total).toFixed(2)}
          </p>
          <Link href="/orders"
            className="inline-flex items-center gap-2 font-semibold text-sm px-7 py-3.5 rounded-full"
            style={{ background: "var(--color-primary)", color: "#FAF7F2" }}>
            View my orders
          </Link>
        </div>
      </div>
    );
  }

  // ── Empty cart ─────────────────────────────────────────────────────────
  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-background)" }}>
        <div className="text-center">
          <ShoppingBag size={32} strokeWidth={1.5} className="mx-auto mb-4" style={{ color: "var(--color-text-muted)" }} />
          <p className="text-sm mb-4" style={{ color: "var(--color-text-secondary)" }}>Your cart is empty.</p>
          <Link href="/products" className="text-sm font-semibold" style={{ color: "var(--color-accent)" }}>
            Browse books →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--color-background)" }}>
      {/* Header */}
      <div className="py-10" style={{ background: "var(--color-primary)" }}>
        <div className="max-w-4xl mx-auto px-5 sm:px-8">
          <p className="text-xs tracking-[0.2em] uppercase font-medium mb-2" style={{ color: "var(--color-accent)" }}>
            Secure Checkout
          </p>
          <h1 className="font-display font-bold text-3xl" style={{ color: "#FAF7F2" }}>Complete your order</h1>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-5 sm:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* ── Left: Delivery ────────────────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <MapPin size={16} style={{ color: "var(--color-accent)" }} />
                <h2 className="font-semibold" style={{ color: "var(--color-text-primary)" }}>Delivery Address</h2>
              </div>
              {!showAddForm && addresses.length < 10 && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="inline-flex items-center gap-1 text-xs font-medium"
                  style={{ color: "var(--color-accent)" }}
                >
                  <Plus size={12} /> Add new
                </button>
              )}
            </div>

            {/* Saved addresses */}
            <div className="space-y-3 mb-4">
              {addresses.map((addr) => {
                const badge = LABEL_COLOURS[addr.label];
                const isEditing = editingAddr?.id === addr.id;
                return (
                  <div key={addr.id} className="rounded-xl border overflow-hidden transition-all"
                       style={{
                         borderColor: selectedAddress === addr.id ? "var(--color-primary)" : "var(--color-border)",
                         background: selectedAddress === addr.id ? "var(--color-surface)" : "transparent",
                       }}>
                    {/* Radio row */}
                    <div className="flex items-start gap-3 p-4">
                      <input
                        type="radio"
                        name="address"
                        value={addr.id}
                        checked={selectedAddress === addr.id}
                        onChange={() => { setSelectedAddress(addr.id); setEditingAddr(null); }}
                        className="mt-0.5 flex-shrink-0 cursor-pointer"
                      />
                      <div className="flex-1 text-sm min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                                style={{ background: badge.bg, color: badge.color }}>
                            {addressDisplayLabel(addr)}
                          </span>
                          <span className="font-medium truncate" style={{ color: "var(--color-text-primary)" }}>
                            {addr.full_name}
                          </span>
                        </div>
                        <p style={{ color: "var(--color-text-secondary)" }}>{addr.line_1}</p>
                        <p style={{ color: "var(--color-text-secondary)" }}>
                          {addr.city}{addr.state ? `, ${addr.state}` : ""} {addr.postcode}
                        </p>
                      </div>
                      {/* Edit / Delete */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => setEditingAddr(isEditing ? null : addr)}
                          className="p-1.5 rounded-lg transition-colors"
                          style={{ color: "var(--color-text-muted)" }}
                          title="Edit"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAddress(addr)}
                          className="p-1.5 rounded-lg transition-colors"
                          style={{ color: "var(--color-text-muted)" }}
                          title="Delete"
                          onMouseEnter={(e) => (e.currentTarget.style.color = "#ef4444")}
                          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-muted)")}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    {/* Inline edit form */}
                    {isEditing && (
                      <div className="px-4 pb-4 border-t" style={{ borderColor: "var(--color-border)" }}>
                        <div className="pt-4">
                          <AddressForm
                            initial={addr}
                            onSubmit={handleUpdateAddress}
                            onCancel={() => setEditingAddr(null)}
                            submitLabel="Update address"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {addresses.length === 0 && !showAddForm && (
                <p className="text-sm text-center py-6" style={{ color: "var(--color-text-muted)" }}>
                  No saved addresses.{" "}
                  <button onClick={() => setShowAddForm(true)} className="font-medium" style={{ color: "var(--color-accent)" }}>
                    Add one
                  </button>
                </p>
              )}
            </div>

            {/* Add address form inline */}
            {showAddForm && (
              <div className="rounded-2xl border p-5 mb-4"
                   style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-sm" style={{ color: "var(--color-text-primary)" }}>New address</h3>
                  <button onClick={() => setShowAddForm(false)}>
                    <X size={15} style={{ color: "var(--color-text-muted)" }} />
                  </button>
                </div>
                <AddressForm onSubmit={handleAddAddress} onCancel={() => setShowAddForm(false)} />
              </div>
            )}

            {/* Delivery notes */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--color-text-secondary)" }}>
                Delivery notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Any special instructions…"
                className="w-full px-4 py-3 rounded-xl border text-sm outline-none resize-none"
                style={{
                  background: "var(--color-background)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-text-primary)",
                }}
              />
            </div>
          </div>

          {/* ── Right: Summary ─────────────────────────────────────────── */}
          <div>
            <h2 className="font-semibold mb-4" style={{ color: "var(--color-text-primary)" }}>Order Summary</h2>
            <div className="rounded-2xl border overflow-hidden"
                 style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
              <div className="divide-y" style={{ borderColor: "var(--color-border)" }}>
                {cart.items.map((item) => (
                  <div key={item.product_id} className="flex justify-between items-start px-5 py-4 gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-snug" style={{ color: "var(--color-text-primary)" }}>
                        {item.title}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>Qty {item.quantity}</p>
                    </div>
                    <span className="text-sm font-semibold flex-shrink-0" style={{ color: "var(--color-primary)" }}>
                      ${Number(item.line_total).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="px-5 py-4 border-t space-y-2" style={{ borderColor: "var(--color-border)" }}>
                <div className="flex justify-between text-sm">
                  <span style={{ color: "var(--color-text-muted)" }}>Subtotal</span>
                  <span style={{ color: "var(--color-text-secondary)" }}>${cart.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: "var(--color-text-muted)" }}>Shipping</span>
                  <span style={{ color: "var(--color-text-secondary)" }}>Calculated at confirmation</span>
                </div>
                <div className="flex justify-between font-bold pt-2 border-t"
                     style={{ borderColor: "var(--color-border)" }}>
                  <span style={{ color: "var(--color-text-primary)" }}>Total</span>
                  <span className="font-display text-xl" style={{ color: "var(--color-primary)" }}>
                    ${cart.subtotal.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="px-5 pb-5">
                <button
                  onClick={handlePlaceOrder}
                  disabled={placeOrder.isPending || !selectedAddress}
                  className="w-full py-4 rounded-2xl font-semibold text-sm transition-all disabled:opacity-50"
                  style={{ background: "var(--color-primary)", color: "#FAF7F2" }}
                >
                  {placeOrder.isPending ? "Placing order…" : "Place order"}
                </button>
                <p className="text-xs text-center mt-3" style={{ color: "var(--color-text-muted)" }}>
                  Demo checkout — no real payment is taken
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
