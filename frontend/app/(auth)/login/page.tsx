"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useLogin } from "@/lib/api/auth";
import { useMergeCart } from "@/lib/api/cart";
import { useUIStore } from "@/lib/store/uiStore";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/";
  const login = useLogin();
  const mergeCart = useMergeCart();
  const { addToast } = useUIStore();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [conflict, setConflict] = useState<any>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    login.mutate(form, {
      onSuccess: (data) => {
        if (data.cart_conflict) {
          setConflict(data.cart_conflict);
        } else {
          addToast({ message: `Welcome back, ${data.data.user.first_name}!`, type: "success" });
          router.push(next);
        }
      },
      onError: (err: any) => setError(err?.message ?? "Invalid email or password."),
    });
  }

  async function handleMerge(strategy: string) {
    mergeCart.mutate(strategy, {
      onSuccess: () => {
        addToast({ message: "Cart merged successfully!", type: "success" });
        router.push(next);
      },
      onError: () => router.push(next),
    });
  }

  if (conflict) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-[var(--color-surface)] rounded-2xl shadow-lg p-8">
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-2">You have items in two carts</h2>
          <p className="text-sm text-[var(--color-text-secondary)] mb-6">What would you like to do?</p>
          <div className="space-y-3">
            <button onClick={() => handleMerge("combine")} className="w-full py-3 bg-[var(--color-accent)] text-white rounded-xl text-sm font-medium hover:opacity-90">
              Combine both carts
            </button>
            <button onClick={() => handleMerge("keep_user")} className="w-full py-3 border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-xl text-sm hover:border-[var(--color-accent)]">
              Keep my saved cart
            </button>
            <button onClick={() => handleMerge("keep_guest")} className="w-full py-3 border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-xl text-sm hover:border-[var(--color-accent)]">
              Use guest cart
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-[var(--color-surface)] rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-2">Sign in</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mb-8">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="text-[var(--color-accent)] hover:underline font-medium">Register</Link>
        </p>
        {error && <p className="text-sm text-red-500 mb-4 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1 block">Email</label>
            <input
              type="email" required value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1 block">Password</label>
            <input
              type="password" required value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
            />
          </div>
          <Link href="/forgot-password" className="block text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] text-right">
            Forgot password?
          </Link>
          <button
            type="submit" disabled={login.isPending}
            className="w-full py-3 bg-[var(--color-accent)] text-white rounded-xl font-medium text-sm hover:opacity-90 transition-base disabled:opacity-60"
          >
            {login.isPending ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
