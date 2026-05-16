"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { useRegister } from "@/lib/api/auth";
import { useUIStore } from "@/lib/store/uiStore";

function AuthInput({
  label, type, value, onChange, placeholder, required = true,
}: {
  label: string; type: string; value: string;
  onChange: (v: string) => void; placeholder?: string; required?: boolean;
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
          required
          value={value}
          placeholder={placeholder}
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

export default function RegisterPage() {
  const router = useRouter();
  const register = useRegister();
  const { addToast } = useUIStore();
  const [form, setForm] = useState({ email: "", password: "", first_name: "", last_name: "" });
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    register.mutate(form, {
      onSuccess: (data) => {
        addToast({ message: `Welcome, ${data.data.user.first_name}!`, type: "success" });
        router.push("/");
      },
      onError: (err: any) => setError(err?.message ?? "Registration failed."),
    });
  }

  return (
    <div>
      <h1 className="font-display font-bold text-3xl mb-1" style={{ color: "var(--color-text-primary)" }}>
        Create your account
      </h1>
      <p className="text-sm mb-8" style={{ color: "var(--color-text-secondary)" }}>
        Already have one?{" "}
        <Link href="/login" className="font-semibold hover:underline" style={{ color: "var(--color-accent)" }}>
          Sign in
        </Link>
      </p>

      {error && (
        <div className="mb-5 px-4 py-3 rounded-xl text-sm" style={{ background: "#fef2f2", color: "#dc2626" }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <AuthInput label="First name" type="text" value={form.first_name}
                     onChange={(v) => setForm((f) => ({ ...f, first_name: v }))} />
          <AuthInput label="Last name" type="text" value={form.last_name}
                     onChange={(v) => setForm((f) => ({ ...f, last_name: v }))} />
        </div>
        <AuthInput label="Email address" type="email" value={form.email}
                   onChange={(v) => setForm((f) => ({ ...f, email: v }))} />
        <AuthInput label="Password" type="password" value={form.password}
                   onChange={(v) => setForm((f) => ({ ...f, password: v }))} />

        <button
          type="submit"
          disabled={register.isPending}
          className="w-full mt-2 py-3.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-60"
          style={{ background: "var(--color-primary)", color: "#FAF7F2" }}
        >
          {register.isPending ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-8 text-center text-xs" style={{ color: "var(--color-text-muted)" }}>
        By creating an account you agree to our{" "}
        <span className="underline cursor-pointer">Terms of Service</span>.
      </p>
    </div>
  );
}
