export default function Logo({ light = false }: { light?: boolean }) {
  const textColor = light ? "#FAF7F2" : "var(--color-primary)";
  const accentColor = "var(--color-accent)";

  return (
    <div className="flex items-center gap-2.5 select-none">
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="8" y="6" width="16" height="20" rx="2" fill={light ? "rgba(250,247,242,0.15)" : "var(--color-primary)"} />
        <rect x="10" y="6" width="14" height="20" rx="2" fill={light ? "rgba(250,247,242,0.25)" : "var(--color-primary-mid)"} />
        <rect x="10" y="6" width="3" height="20" rx="1" fill={accentColor} />
        <path
          d="M16 6 C16 6, 22 2, 24 4 C26 6, 22 10, 16 8 C16 8, 16 6, 16 6Z"
          fill={accentColor}
          opacity="0.9"
        />
        <path d="M16 6.5 C18 5, 22 4, 23.5 4.5" stroke="#FAF7F2" strokeWidth="0.5" opacity="0.6" />
        <rect x="15" y="12" width="7" height="1" rx="0.5" fill={light ? "rgba(250,247,242,0.3)" : "rgba(250,247,242,0.4)"} />
        <rect x="15" y="15" width="5" height="1" rx="0.5" fill={light ? "rgba(250,247,242,0.3)" : "rgba(250,247,242,0.4)"} />
        <rect x="15" y="18" width="6" height="1" rx="0.5" fill={light ? "rgba(250,247,242,0.3)" : "rgba(250,247,242,0.4)"} />
      </svg>

      <div className="flex flex-col leading-none">
        <span
          className="font-display font-bold tracking-wide"
          style={{ color: textColor, fontSize: "17px", letterSpacing: "0.04em" }}
        >
          Leaf <span style={{ color: accentColor }}>&amp;</span> Lore
        </span>
        <span
          className="tracking-[0.18em] uppercase"
          style={{ color: light ? "rgba(250,247,242,0.5)" : "var(--color-text-secondary)", fontSize: "7px", marginTop: "1px" }}
        >
          Independent Booksellers
        </span>
      </div>
    </div>
  );
}
