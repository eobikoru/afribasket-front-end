export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true">
      <rect width="64" height="64" rx="16" fill="#143028" />
      <path d="M16 28.5h32l-3.4 16.4a6.5 6.5 0 0 1-6.4 5.1H25.8a6.5 6.5 0 0 1-6.4-5.1L16 28.5Z" fill="#F4EFE6" />
      <path d="M21 35.2h22M22.4 41h19.2M23.8 46.2h16.4" stroke="#C8963E" strokeWidth="1.7" />
      <path d="M22.5 28.5c.4-7 5-12 9.5-12s9.1 5 9.5 12" fill="none" stroke="#F4EFE6" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M42.5 14.5c3.2 1.1 5.4 3.6 5.8 7" fill="none" stroke="#D85A2A" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ tone = "light" }: { tone?: "light" | "dark" }) {
  const word = tone === "light" ? "text-cream" : "text-forest";
  return (
    <span className={`inline-flex items-center gap-2.5 ${word}`}>
      <LogoMark className="h-9 w-9" />
      <span className="font-display text-[1.35rem] leading-none tracking-tight">
        Afri<span className="font-medium">Basket</span>
      </span>
    </span>
  );
}
