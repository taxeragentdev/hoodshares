import type { ReactNode } from "react";

export function RoundSection({
  label,
  day,
  children,
}: {
  label: string;
  day: string;
  children: ReactNode;
}) {
  return (
    <section className="border-line bg-surface rounded-3xl border p-5 sm:p-8">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <h2 className="font-display text-ink text-sm font-bold tracking-[0.18em] uppercase">
          {label}
        </h2>
        <span className="bg-surface-3 text-ink-2 rounded-md px-2 py-0.5 font-mono text-[11px] tracking-wide">
          {day}
        </span>
      </div>
      {children}
    </section>
  );
}
