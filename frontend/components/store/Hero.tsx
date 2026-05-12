"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { useSectionProducts } from "@/lib/api/products";

export default function Hero() {
  const { data: featured } = useSectionProducts("section-featured");
  const covers = featured?.slice(0, 3).map((p) => p.cover_image_url).filter(Boolean) ?? [];

  const placeholders = [
    "linear-gradient(135deg, #2D5438 0%, #1A3A2A 100%)",
    "linear-gradient(135deg, #1A3A2A 0%, #0D2218 100%)",
    "linear-gradient(135deg, #0D2218 0%, #2D5438 100%)",
  ];

  return (
    <section
      className="relative min-h-screen flex items-center overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0D1F0D 0%, #1A3A2A 50%, #0D2218 100%)" }}
    >
      {/* Decorative radial glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full pointer-events-none"
           style={{ background: "radial-gradient(circle, rgba(201,168,76,0.12), transparent 70%)" }} />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full pointer-events-none"
           style={{ background: "radial-gradient(circle, rgba(82,183,136,0.1), transparent 70%)" }} />

      {/* Noise texture */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative max-w-7xl mx-auto px-5 sm:px-8 pt-20 pb-20 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center w-full">
        {/* Left — Copy */}
        <div className="space-y-8">
          {/* Pill badge */}
          <div className="animate-fade-up inline-flex items-center gap-2 border rounded-full px-4 py-1.5"
               style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(8px)", borderColor: "rgba(255,255,255,0.12)" }}>
            <Sparkles size={12} style={{ color: "var(--color-accent)" }} />
            <span className="text-xs tracking-widest uppercase" style={{ color: "rgba(250,247,242,0.65)" }}>
              Curated for the Discerning Reader
            </span>
          </div>

          {/* Headline */}
          <h1
            className="animate-fade-up-2 font-display font-bold leading-[1.05] tracking-tight"
            style={{ fontSize: "clamp(3rem, 6vw, 5.5rem)", color: "#FAF7F2" }}
          >
            Where Every<br />
            <em className="not-italic" style={{ color: "var(--color-accent)" }}>Story</em>{" "}
            Finds<br />
            Its Reader
          </h1>

          {/* Subheadline */}
          <p className="animate-fade-up-3 text-lg leading-relaxed max-w-md" style={{ color: "rgba(250,247,242,0.55)" }}>
            Discover handpicked fiction, thought-provoking non-fiction, and everything in between.
            Over 10,000 titles. One extraordinary collection.
          </p>

          {/* CTAs */}
          <div className="animate-fade-up-4 flex flex-wrap gap-4">
            <Link
              href="/products"
              className="group inline-flex items-center gap-2.5 font-semibold px-7 py-3.5 rounded-full transition-all duration-300 text-sm tracking-wide"
              style={{ background: "var(--color-accent)", color: "var(--color-primary-dark)" }}
            >
              Explore the Collection
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/products?is_bestseller=true"
              className="inline-flex items-center gap-2.5 font-medium px-7 py-3.5 rounded-full transition-all duration-300 text-sm tracking-wide border"
              style={{ color: "rgba(250,247,242,0.85)", borderColor: "rgba(255,255,255,0.2)" }}
            >
              View Bestsellers
            </Link>
          </div>

          {/* Social proof */}
          <div className="animate-fade-up-4 flex items-center gap-6 pt-2">
            {[["30+", "Titles"], ["50K+", "Readers"], ["4.8", "Avg. Rating"]].map(([val, label], i, arr) => (
              <div key={label} className="flex items-center gap-6">
                <div>
                  <p className="text-2xl font-bold" style={{ color: "#FAF7F2" }}>{val}</p>
                  <p className="text-xs uppercase tracking-widest" style={{ color: "rgba(250,247,242,0.35)" }}>{label}</p>
                </div>
                {i < arr.length - 1 && <div className="w-px h-8" style={{ background: "rgba(255,255,255,0.12)" }} />}
              </div>
            ))}
          </div>
        </div>

        {/* Right — Floating books */}
        <div className="relative flex items-center justify-center h-[480px] lg:h-[560px]">
          {/* Back book */}
          <div className="absolute animate-float" style={{ transform: "rotate(-6deg) translateX(-80px) translateY(20px)", zIndex: 10 }}>
            <div className="w-36 h-52 sm:w-44 sm:h-64 rounded-lg overflow-hidden"
                 style={{ boxShadow: "0 32px 64px rgba(0,0,0,0.6), -4px 4px 0 #1A3A2A" }}>
              {covers[0]
                ? <img src={covers[0]} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full" style={{ background: placeholders[0] }} />}
            </div>
          </div>

          {/* Centre book */}
          <div className="absolute animate-float2" style={{ transform: "rotate(2deg)", zIndex: 20 }}>
            <div className="w-44 h-64 sm:w-52 sm:h-80 rounded-xl overflow-hidden"
                 style={{ boxShadow: "0 40px 80px rgba(0,0,0,0.7), -6px 6px 0 #0D2218" }}>
              {covers[1]
                ? <img src={covers[1]} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full" style={{ background: placeholders[1] }} />}
            </div>
            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 font-bold text-sm px-4 py-1.5 rounded-full shadow-lg whitespace-nowrap"
                 style={{ background: "var(--color-accent)", color: "var(--color-primary-dark)" }}>
              From $9.99
            </div>
          </div>

          {/* Right book */}
          <div className="absolute animate-float3" style={{ transform: "rotate(8deg) translateX(80px) translateY(10px)", zIndex: 10 }}>
            <div className="w-32 h-48 sm:w-40 sm:h-60 rounded-lg overflow-hidden"
                 style={{ boxShadow: "0 24px 48px rgba(0,0,0,0.6), 4px 4px 0 #1A3A2A" }}>
              {covers[2]
                ? <img src={covers[2]} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full" style={{ background: placeholders[2] }} />}
            </div>
          </div>

          {/* Glow ring */}
          <div className="absolute w-72 h-72 rounded-full"
               style={{ background: "radial-gradient(circle, rgba(201,168,76,0.18) 0%, transparent 70%)", zIndex: 0 }} />
        </div>
      </div>

      {/* Scroll cue */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
           style={{ color: "rgba(250,247,242,0.25)" }}>
        <span className="text-[10px] tracking-[0.2em] uppercase">Scroll</span>
        <div className="w-px h-10" style={{ background: "linear-gradient(to bottom, rgba(250,247,242,0.25), transparent)" }} />
      </div>
    </section>
  );
}
