import type { ReactNode } from "react";

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-stone">{hint}</span> : null}
      {error ? (
        <span className="mt-1 block text-sm text-danger" role="alert">
          {error}
        </span>
      ) : null}
    </label>
  );
}

export const controlClass =
  "w-full rounded-md border border-line bg-paper px-3 py-2.5 text-[15px] text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] placeholder:text-stone/70";

export function Button({
  children,
  tone = "clay",
  type = "button",
  className = "",
  disabled,
  onClick,
}: {
  children: ReactNode;
  tone?: "clay" | "forest" | "ghost";
  type?: "button" | "submit";
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
}) {
  const tones = {
    clay: "bg-clay text-white hover:bg-clay-deep",
    forest: "bg-forest text-cream hover:bg-forest-deep",
    ghost: "border border-line bg-paper text-ink hover:border-ink/30",
  };
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-md px-4 py-2.5 text-sm font-semibold tracking-wide transition disabled:cursor-not-allowed disabled:opacity-50 ${tones[tone]} ${className}`}
    >
      {children}
    </button>
  );
}

export function Notice({ tone = "danger", children }: { tone?: "danger" | "ok" | "quiet"; children: ReactNode }) {
  const tones = {
    danger: "border-danger/30 bg-[#f8ece8] text-danger",
    ok: "border-leaf/30 bg-[#e7f0ea] text-forest",
    quiet: "border-line bg-paper text-ink",
  };
  return (
    <p role="status" className={`rounded-md border px-3 py-2.5 text-sm leading-relaxed ${tones[tone]}`}>
      {children}
    </p>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-well ${className}`} />;
}

export function EmptyState({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-line bg-paper px-6 py-14 text-center">
      <p className="font-display text-3xl text-forest">{title}</p>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-stone">{body}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex gap-0.5 text-gold" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg key={star} viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
          <path
            d="m10 1.8 2.2 4.7 5.1.6-3.8 3.5.9 5.1L10 13.3 5.6 15.7l.9-5.1L2.7 7.1l5.1-.6L10 1.8Z"
            fill={star <= Math.round(value) ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="1.2"
          />
        </svg>
      ))}
    </span>
  );
}
