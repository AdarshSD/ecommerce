"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle, MapPin, Plus, ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/api/cart";
import { usePlaceOrder } from "@/lib/api/orders";
import { useAuthStore } from "@/lib/store/authStore";
import { useUIStore } from "@/lib/store/uiStore";
import { api } from "@/lib/api/client";

interface Address {
  id: string;
  full_name: string;
  line_1: string;
  line_2?: string;
  city: string;
  postcode: string;
  country_code: string;
  is_default: boolean;
}

const inputCls = "w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all";
const inputStyle = { background: "var(--color-background)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" };

function FieldInput({ label, value, onChange, required = true }: { label: string; value: string; onChange: (v: string) => void; required?: boolean }) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--color-text-secondary)" }}>{label}</label>
      <input
        required={required} value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputCls} style={inputStyle}
        onFocus={(e) => (e.target.style.borderColor = "var(--color-primary)")}
        onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
      />
    </div>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const { data: cart } = useCart();
  const placeOrder = usePlaceOrder();
  const { addToast } = useUIStore();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [confirmedOrder, setConfirmedOrder] = useState<any>(null);
  const [newAddress, setNewAddress] = useState({ full_name: "", line_1: "", city: "", postcode: "", country_code: "US" });
  const [showNewAddr, setShowNewAddr] = useState(false);

  useEffect(() => {
    if (!user) { router.push("/login?next=/checkout"); return; }
    api.get("/users/me/addresses").then((res: any) => {
      const addrs = res.data as Address[];
      setAddresses(addrs);
      const def = addrs.find((a) => a.is_default);
      if (def) setSelectedAddress(def.id);
    }).catch(() => {});
  }, [user, router]);

  async function handleAddAddress(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await api.post("/users/me/addresses", { ...newAddress, is_default: addresses.length === 0 }) as any;
      const addr = res.data as Address;
      setAddresses((prev) => [...prev, addr]);
      setSelectedAddress(addr.id);
      setShowNewAddr(false);
    } catch {
      addToast({ message: "Could not save address.", type: "error" });
    }
  }

  function handlePlaceOrder() {
    if (!selectedAddress) { addToast({ message: "Please select a delivery address.", type: "error" }); return; }
    placeOrder.mutate({ address_id: selectedAddress, notes: notes || undefined }, {
      onSuccess: (order) => setConfirmedOrder(order),
      onError: (err: any) => addToast({ message: err?.message ?? "Checkout failed.", type: "error" }),
    });
  }

  // Order confirmed screen
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
          <p className="text-sm mb-1" style={{ color: "var(--color-text-secondary)" }}>
            Thank you for your purchase.
          </p>
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

  // Empty cart
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
          {/* Left: Delivery */}
          <div>
            <div className="flex items-center gap-2.5 mb-6">
              <MapPin size={16} style={{ color: "var(--color-accent)" }} />
              <h2 className="font-semibold" style={{ color: "var(--color-text-primary)" }}>Delivery Address</h2>
            </div>

            <div className="space-y-3 mb-4">
              {addresses.map((addr) => (
                <label
                  key={addr.id}
                  className="flex gap-3 p-4 rounded-xl border cursor-pointer transition-all"
                  style={{
                    borderColor: selectedAddress === addr.id ? "var(--color-primary)" : "var(--color-border)",
                    background: selectedAddress === addr.id ? "var(--color-surface)" : "transparent",
                  }}
                >
                  <input type="radio" name="address" value={addr.id}
                         checked={selectedAddress === addr.id}
                         onChange={() => setSelectedAddress(addr.id)}
                         className="mt-0.5 flex-shrink-0 accent-[var(--color-primary)]" />
                  <div className="text-sm">
                    <p className="font-semibold" style={{ color: "var(--color-text-primary)" }}>{addr.full_name}</p>
                    <p style={{ color: "var(--color-text-secondary)" }}>
                      {addr.line_1}{addr.line_2 ? `, ${addr.line_2}` : ""}
                    </p>
                    <p style={{ color: "var(--color-text-secondary)" }}>
                      {addr.city}, {addr.postcode} · {addr.country_code}
                    </p>
                  </div>
                </label>
              ))}
            </div>

            <button
              onClick={() => setShowNewAddr(!showNewAddr)}
              className="inline-flex items-center gap-1.5 text-sm font-medium mb-4"
              style={{ color: "var(--color-accent)" }}
            >
              <Plus size={14} /> Add new address
            </button>

            {showNewAddr && (
              <form onSubmit={handleAddAddress}
                    className="rounded-2xl border p-5 space-y-4 mb-4"
                    style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
                <FieldInput label="Full name" value={newAddress.full_name}
                            onChange={(v) => setNewAddress((p) => ({ ...p, full_name: v }))} />
                <FieldInput label="Street address" value={newAddress.line_1}
                            onChange={(v) => setNewAddress((p) => ({ ...p, line_1: v }))} />
                <div className="grid grid-cols-2 gap-3">
                  <FieldInput label="City" value={newAddress.city}
                              onChange={(v) => setNewAddress((p) => ({ ...p, city: v }))} />
                  <FieldInput label="Postcode" value={newAddress.postcode}
                              onChange={(v) => setNewAddress((p) => ({ ...p, postcode: v }))} />
                </div>
                <button type="submit"
                        className="w-full py-3 rounded-xl text-sm font-semibold"
                        style={{ background: "var(--color-primary)", color: "#FAF7F2" }}>
                  Save address
                </button>
              </form>
            )}

            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--color-text-secondary)" }}>
                Delivery notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                placeholder="Any special instructions…"
                className="w-full px-4 py-3 rounded-xl border text-sm outline-none resize-none transition-all"
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = "var(--color-primary)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
              />
            </div>
          </div>

          {/* Right: Summary */}
          <div>
            <h2 className="font-semibold mb-6" style={{ color: "var(--color-text-primary)" }}>Order Summary</h2>
            <div className="rounded-2xl border overflow-hidden"
                 style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}>
              <div className="divide-y" style={{ borderColor: "var(--color-border)" }}>
                {cart.items.map((item) => (
                  <div key={item.product_id} className="flex justify-between items-start px-5 py-4 gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-snug" style={{ color: "var(--color-text-primary)" }}>
                        {item.title}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                        Qty {item.quantity}
                      </p>
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
