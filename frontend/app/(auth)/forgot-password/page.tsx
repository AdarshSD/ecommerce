"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react";
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
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-6"
             style={{ background: "var(--color-cream-dark)" }}>
          <CheckCircle size={28} style={{ color: "var(--color-primary)" }} />
        </div>
        <h1 className="font-display font-bold text-2xl mb-3" style={{ color: "var(--color-text-primary)" }}>
          Check your email
        </h1>
        <p className="text-sm mb-8" style={{ color: "var(--color-text-secondary)" }}>
          If an account with <strong>{email}</strong> exists, we&apos;ve sent a password reset link.
          It may take a minute or two to arrive.
        </p>
        <Link href="/login" className="inline-flex items-center gap-2 text-sm font-medium"
              style={{ color: "var(--color-accent)" }}>
          <ArrowLeft size={14} /> Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link href="/login" className="inline-flex items-center gap-1.5 text-sm mb-8"
            style={{ color: "var(--color-text-muted)" }}>
        <ArrowLeft size={14} /> Back to sign in
      </Link>

      <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-6"
           style={{ background: "var(--color-cream-dark)" }}>
        <Mail size={20} style={{ color: "var(--color-primary)" }} />
      </div>

      <h1 className="font-display font-bold text-3xl mb-2" style={{ color: "var(--color-text-primary)" }}>
        Reset your password
      </h1>
      <p className="text-sm mb-8" style={{ color: "var(--color-text-secondary)" }}>
        Enter the email address on your account and we&apos;ll send you a reset link.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold mb-1.5 tracking-wide"
                 style={{ color: "var(--color-text-secondary)" }}>
            Email address
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all"
            style={{ background: "var(--color-background)", borderColor: "var(--color-border)", color: "var(--color-text-primary)" }}
            onFocus={(e) => (e.target.style.borderColor = "var(--color-primary)")}
            onBlur={(e) => (e.target.style.borderColor = "var(--color-border)")}
          />
        </div>
        <button
          type="submit"
          disabled={forgot.isPending}
          className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-60"
          style={{ background: "var(--color-primary)", color: "#FAF7F2" }}
        >
          {forgot.isPending ? "Sending…" : "Send reset link"}
        </button>
      </form>
    </div>
  );
}
