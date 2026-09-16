import type { ReactNode } from "react";

export function Section({
  id,
  children,
  className = "",
}: {
  id?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={`mx-auto w-full max-w-6xl scroll-mt-24 px-5 py-20 sm:px-8 sm:py-28 ${className}`}
    >
      {children}
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <header className="max-w-2xl">
      <p className="text-acid font-mono text-xs tracking-[0.24em] uppercase">
        {eyebrow}
      </p>
      <h2 className="font-display text-ink mt-4 text-3xl leading-[1.1] font-bold tracking-tight sm:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="text-ink-2 mt-4 text-base leading-relaxed">
          {description}
        </p>
      )}
    </header>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="border-line bg-surface-2 text-ink-2 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[11px] tracking-[0.14em] uppercase">
      {children}
    </span>
  );
}
