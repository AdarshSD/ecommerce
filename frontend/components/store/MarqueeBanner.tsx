const items = [
  "Literary Fiction", "★", "Mystery & Thriller", "★",
  "Science Fiction", "★", "Historical Fiction", "★",
  "Self-Help", "★", "Fantasy", "★",
  "Biography & Memoir", "★", "Philosophy", "★",
  "Graphic Novels", "★", "Children's Books", "★",
];

export default function MarqueeBanner() {
  const doubled = [...items, ...items];

  return (
    <div className="relative overflow-hidden py-3.5" style={{ background: "var(--color-primary)" }}>
      <div className="flex animate-marquee whitespace-nowrap">
        {doubled.map((item, i) => (
          <span
            key={i}
            className="mx-5 text-xs tracking-[0.2em] uppercase font-medium"
            style={{ color: item === "★" ? "var(--color-accent)" : "rgba(250,247,242,0.55)" }}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
