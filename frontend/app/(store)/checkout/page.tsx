"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { useCart } from "@/lib/api/cart";
import { useOrders, usePlaceOrder } from "@/lib/api/orders";
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

  if (confirmedOrder) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-2">Order confirmed!</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mb-1">Reference: {confirmedOrder.payment_reference}</p>
        <p className="text-sm text-[var(--color-text-secondary)] mb-8">Total: ${Number(confirmedOrder.total).toFixed(2)}</p>
        <Link href="/orders" className="text-[var(--color-accent)] hover:underline text-sm font-medium">View my orders →</Link>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <p className="text-[var(--color-text-secondary)]">Your cart is empty.</p>
        <Link href="/products" className="mt-4 inline-block text-[var(--color-accent)] hover:underline text-sm">Browse books →</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-3xl font-semibold text-[var(--color-text-primary)] mb-8">Checkout</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left: address */}
        <div>
          <h2 className="font-medium text-[var(--color-text-primary)] mb-4">Delivery address</h2>
          <div className="space-y-3">
            {addresses.map((addr) => (
              <label key={addr.id} className={`flex gap-3 p-4 rounded-xl border cursor-pointer transition-base ${selectedAddress === addr.id ? "border-[var(--color-accent)] bg-[var(--color-surface)]" : "border-[var(--color-border)] bg-[var(--color-surface)]"}`}>
                <input type="radio" name="address" value={addr.id} checked={selectedAddress === addr.id} onChange={() => setSelectedAddress(addr.id)} className="mt-1" />
                <div className="text-sm">
                  <p className="font-medium text-[var(--color-text-primary)]">{addr.full_name}</p>
                  <p className="text-[var(--color-text-secondary)]">{addr.line_1}{addr.line_2 ? `, ${addr.line_2}` : ""}</p>
                  <p className="text-[var(--color-text-secondary)]">{addr.city}, {addr.postcode} {addr.country_code}</p>
                </div>
              </label>
            ))}
            <button onClick={() => setShowNewAddr(!showNewAddr)} className="text-sm text-[var(--color-accent)] hover:underline">
              + Add new address
            </button>
            {showNewAddr && (
              <form onSubmit={handleAddAddress} className="border border-[var(--color-border)] rounded-xl p-4 space-y-3">
                {[["full_name","Full name"],["line_1","Street address"],["city","City"],["postcode","Postcode"]].map(([field, label]) => (
                  <div key={field}>
                    <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1 block">{label}</label>
                    <input required value={(newAddress as any)[field]} onChange={(e) => setNewAddress((p) => ({...p, [field]: e.target.value}))}
                      className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]" />
                  </div>
                ))}
                <button type="submit" className="w-full py-2 bg-[var(--color-primary)] text-white rounded-lg text-sm font-medium hover:opacity-90">Save address</button>
              </form>
            )}
            <div>
              <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1 block">Delivery notes (optional)</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] text-sm focus:outline-none resize-none" />
            </div>
          </div>
        </div>

        {/* Right: summary */}
        <div>
          <h2 className="font-medium text-[var(--color-text-primary)] mb-4">Order summary</h2>
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-4 space-y-3">
            {cart.items.map((item) => (
              <div key={item.product_id} className="flex justify-between text-sm">
                <span className="text-[var(--color-text-primary)] truncate pr-4">{item.title} × {item.quantity}</span>
                <span className="text-[var(--color-text-secondary)] whitespace-nowrap">${item.line_total.toFixed(2)}</span>
              </div>
            ))}
            <div className="border-t border-[var(--color-border)] pt-3 flex justify-between font-semibold text-[var(--color-text-primary)]">
              <span>Subtotal</span>
              <span>${cart.subtotal.toFixed(2)}</span>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)]">Shipping and tax calculated at confirmation.</p>
            <button onClick={handlePlaceOrder} disabled={placeOrder.isPending}
              className="w-full py-3.5 bg-[var(--color-accent)] text-white rounded-xl font-medium text-sm hover:opacity-90 transition-base disabled:opacity-60 mt-2">
              {placeOrder.isPending ? "Placing order…" : "Place order"}
            </button>
            <p className="text-xs text-center text-[var(--color-text-secondary)]">Demo checkout — no real payment taken</p>
          </div>
        </div>
      </div>
    </div>
  );
}
