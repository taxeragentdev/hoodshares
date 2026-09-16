/** Official HoodShares mark — chart window + lime spark from brand-assets. */

type BrandMarkProps = {
  className?: string;
  /** `badge` is the app icon (black rounded square). `mark` is the chart alone. */
  variant?: "mark" | "badge";
};

export function BrandMark({
  className = "h-7 w-7",
  variant = "mark",
}: BrandMarkProps) {
  if (variant === "badge") {
    return (
      <svg
        viewBox="0 0 512 512"
        className={className}
        fill="none"
        aria-hidden
        role="presentation"
      >
        <rect width="512" height="512" rx="96" fill="#050505" />
        <rect
          x="56"
          y="96"
          width="400"
          height="320"
          rx="64"
          stroke="#ccff00"
          strokeWidth="35.2"
        />
        <path
          d="M144 328 224 240 288 296 376 184"
          stroke="#ccff00"
          strokeWidth="38.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="376" cy="184" r="38.4" fill="#ccff00" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      fill="none"
      aria-hidden
      role="presentation"
    >
      <rect
        x="3.5"
        y="6"
        width="25"
        height="20"
        rx="4"
        stroke="#ccff00"
        strokeWidth="2.2"
      />
      <path
        d="M9 20.5 14 15 18 18.5 23.5 11.5"
        stroke="#ccff00"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="23.5" cy="11.5" r="2.4" fill="#ccff00" />
    </svg>
  );
}
