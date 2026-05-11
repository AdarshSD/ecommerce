import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: "var(--color-background)" }}>
      <div className="px-4 py-4">
        <Link href="/" className="text-[var(--color-primary)] font-semibold text-lg">
          Leaf &amp; Lore
        </Link>
      </div>
      {children}
    </div>
  );
}
