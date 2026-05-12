import Link from "next/link";
import Logo from "@/components/store/Logo";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex" style={{ background: "var(--color-background)" }}>
      {/* Left panel — brand */}
      <div
        className="hidden lg:flex lg:w-[45%] flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, #0D2218 0%, #1A3A2A 60%, #2D5438 100%)" }}
      >
        {/* Decorative radial glow */}
        <div className="absolute top-1/3 left-1/4 w-80 h-80 rounded-full pointer-events-none"
             style={{ background: "radial-gradient(circle, rgba(201,168,76,0.12), transparent 70%)" }} />

        {/* Logo */}
        <Link href="/">
          <Logo light />
        </Link>

        {/* Centre quote */}
        <div className="relative space-y-6 z-10">
          <blockquote
            className="font-display font-bold leading-tight"
            style={{ fontSize: "clamp(1.75rem, 2.8vw, 2.5rem)", color: "#FAF7F2" }}
          >
            &ldquo;A reader lives a thousand&nbsp;lives before he dies.&rdquo;
          </blockquote>
          <p className="text-sm font-medium" style={{ color: "rgba(250,247,242,0.4)" }}>
            — George R.R. Martin
          </p>

          {/* Decorative book spines */}
          <div className="flex items-end gap-1.5 pt-6">
            {[
              { h: 80, c: "rgba(201,168,76,0.3)" },
              { h: 100, c: "rgba(250,247,242,0.1)" },
              { h: 64, c: "rgba(201,168,76,0.15)" },
              { h: 112, c: "rgba(250,247,242,0.08)" },
              { h: 72, c: "rgba(201,168,76,0.2)" },
              { h: 88, c: "rgba(250,247,242,0.12)" },
              { h: 96, c: "rgba(201,168,76,0.1)" },
            ].map((s, i) => (
              <div key={i} className="w-7 rounded-t-sm flex-shrink-0"
                   style={{ height: s.h, background: s.c }} />
            ))}
          </div>
        </div>

        {/* Bottom */}
        <p className="text-xs" style={{ color: "rgba(250,247,242,0.25)" }}>
          © {new Date().getFullYear()} Leaf & Lore · Independent Booksellers
        </p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col">
        {/* Mobile header */}
        <div className="lg:hidden px-6 py-5 border-b" style={{ borderColor: "var(--color-border)" }}>
          <Link href="/">
            <Logo />
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
