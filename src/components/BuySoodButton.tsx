import { TOKEN_BUY_URL } from "@/lib/token";

type BuySoodSize = "nav" | "hero" | "block";

const SIZES: Record<BuySoodSize, string> = {
  nav: "h-10 px-3.5 text-[13px] sm:px-4",
  hero: "px-7 py-3.5 text-sm",
  block: "w-full justify-center px-6 py-3.5 text-sm",
};

export function BuySoodButton({
  size = "nav",
  className = "",
}: {
  size?: BuySoodSize;
  className?: string;
}) {
  return (
    <a
      href={TOKEN_BUY_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="BUY $SOOD"
      className={`group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-acid font-bold tracking-wide text-black uppercase shadow-[0_0_28px_rgba(204,255,0,0.32)] transition duration-300 hover:bg-acid-dim hover:shadow-[0_0_36px_rgba(204,255,0,0.5)] ${SIZES[size]} ${className}`}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full"
      />
      <span
        aria-hidden
        className="relative z-10 flex h-5 w-5 items-center justify-center rounded-full bg-black/15 font-display text-[11px] font-bold"
      >
        $
      </span>
      <span className="relative z-10 font-display tracking-tight">BUY $SOOD</span>
      <svg
        aria-hidden
        viewBox="0 0 16 16"
        className="relative z-10 h-3.5 w-3.5 opacity-80 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="M4 12 12 4M6.5 4H12v5.5" />
      </svg>
    </a>
  );
}
