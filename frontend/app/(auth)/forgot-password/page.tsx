"use client";

import { useState } from "react";
import { useForgotPassword } from "@/lib/api/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const forgot = useForgotPassword();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    forgot.mutate(email, { onSuccess: () => setSent(true) });
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <h1 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-3">Check your email</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            If an account with that address exists, a reset link has been sent.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-[var(--color-surface)] rounded-2xl shadow-lg p-8">
        <h1 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-2">Reset password</h1>
        <p className="text-sm text-[var(--color-text-secondary)] mb-8">Enter your email and we&apos;ll send a reset link.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email" required value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your email"
            className="w-full px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
          />
          <button type="submit" disabled={forgot.isPending}
            className="w-full py-3 bg-[var(--color-accent)] text-white rounded-xl font-medium text-sm hover:opacity-90 disabled:opacity-60">
            {forgot.isPending ? "Sending…" : "Send reset link"}
          </button>
        </form>
      </div>
    </div>
  );
}
