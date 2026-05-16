"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useLogin } from "@/lib/api/auth";
import { useMergeCart } from "@/lib/api/cart";
import { useUIStore } from "@/lib/store/uiStore";

function AuthInput({
  label, type, value, onChange, required = true,
}: {
  label: string; type: string; value: string;
  onChange: (v: string) => void; required?: boolean;
}) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";

  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5 tracking-wide"
             style={{ color: "var(--color-text-secondary)" }}>
        {label}
        {required && <span className="ml-0.5" style={{ color: "#ef4444" }}>*</span>}
      </label>
      <div className="relative">
        <input
          type={isPassword && show ? "text" : type}
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all"
          style={{ background: "var(--color-background)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}
          onFocus={(e) => (e.target.style.borderColor = "var(--color-primary)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
        />
        {isPassword && (
          <button type="button" onClick={() => setShow((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--color-text-muted)" }}>
            {show ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
    </div>
  );
}

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
      <div>
        <h2 className="font-display font-bold text-2xl mb-2" style={{ color: "var(--color-text-primary)" }}>
          You have items in two carts
        </h2>
        <p className="text-sm mb-8" style={{ color: "var(--color-text-secondary)" }}>
          What would you like to do with them?
        </p>
        <div className="space-y-3">
          {[
            { label: "Combine both carts", strategy: "combine", primary: true },
            { label: "Keep my saved cart", strategy: "keep_user", primary: false },
            { label: "Use guest cart", strategy: "keep_guest", primary: false },
          ].map(({ label, strategy, primary }) => (
            <button
              key={strategy}
              onClick={() => handleMerge(strategy)}
              className="w-full py-3.5 rounded-xl text-sm font-semibold transition-all"
              style={primary
                ? { background: "var(--color-primary)", color: "#FAF7F2" }
                : { border: `1px solid var(--color-border)`, color: "var(--color-text-primary)", background: "transparent" }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display font-bold text-3xl mb-1" style={{ color: "var(--color-text-primary)" }}>
        Welcome back
      </h1>
      <p className="text-sm mb-8" style={{ color: "var(--color-text-secondary)" }}>
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-semibold hover:underline" style={{ color: "var(--color-accent)" }}>
          Create one
        </Link>
      </p>

      {error && (
        <div className="mb-5 px-4 py-3 rounded-xl text-sm" style={{ background: "#fef2f2", color: "#dc2626" }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <AuthInput label="Email address" type="email" value={form.email}
                   onChange={(v) => setForm((f) => ({ ...f, email: v }))} />
        <AuthInput label="Password" type="password" value={form.password}
                   onChange={(v) => setForm((f) => ({ ...f, password: v }))} />

        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-xs hover:underline"
                style={{ color: "var(--color-text-muted)" }}>
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={login.isPending}
          className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-60"
          style={{ background: "var(--color-primary)", color: "#FAF7F2" }}
        >
          {login.isPending ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-8 text-center text-xs" style={{ color: "var(--color-text-muted)" }}>
        By signing in you agree to our{" "}
        <span className="underline cursor-pointer">Terms of Service</span> and{" "}
        <span className="underline cursor-pointer">Privacy Policy</span>.
      </p>
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
