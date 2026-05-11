"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useRegister } from "@/lib/api/auth";
import { useUIStore } from "@/lib/store/uiStore";

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
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-[var(--color-surface)] rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-2">Create account</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mb-8">
          Already have one?{" "}
          <Link href="/login" className="text-[var(--color-accent)] hover:underline font-medium">Sign in</Link>
        </p>
        {error && <p className="text-sm text-red-500 mb-4 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          {(["first_name", "last_name", "email", "password"] as const).map((field) => (
            <div key={field}>
              <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1 block capitalize">
                {field.replace("_", " ")}
              </label>
              <input
                type={field === "password" ? "password" : field === "email" ? "email" : "text"}
                required
                value={form[field]}
                onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
              />
            </div>
          ))}
          <button
            type="submit" disabled={register.isPending}
            className="w-full py-3 bg-[var(--color-accent)] text-white rounded-xl font-medium text-sm hover:opacity-90 transition-base disabled:opacity-60"
          >
            {register.isPending ? "Creating…" : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}
