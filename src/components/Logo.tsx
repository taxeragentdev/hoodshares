import { BrandMark } from "./BrandMark";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      <BrandMark className="h-7 w-7" />
      <span className="font-display text-ink text-lg font-bold tracking-tight">
        Hood<span className="text-acid">Shares</span>
      </span>
    </span>
  );
}
