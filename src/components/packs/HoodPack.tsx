"use client";

import Image from "next/image";

const PACK_SRC = "/standartpack.png";
export const PACK_W = 1024;
export const PACK_H = 1536;

function tearY(progress: number): number {
  return 7 + progress * 28;
}

function jaggedPoints(progress: number): string[] {
  const y = tearY(progress);
  const steps = 22;
  const pts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const x = (i / steps) * 100;
    const jagged =
      Math.sin(i * 2.15) * 1.55 + Math.sin(i * 5.1) * 0.5 + Math.cos(i * 1.35) * 0.35;
    pts.push(`${x.toFixed(2)}% ${(y + jagged).toFixed(2)}%`);
  }
  return pts;
}

export function bodyClip(progress: number): string {
  return `polygon(0% 100%, ${jaggedPoints(progress).join(", ")}, 100% 100%)`;
}

export function flapClip(progress: number): string {
  return `polygon(0% 0%, ${jaggedPoints(progress).join(", ")}, 100% 0%)`;
}

interface HoodPackProps {
  tiltX?: number;
  tiltY?: number;
  shineX?: number;
  shineY?: number;
  tearProgress?: number;
  lift?: number;
  className?: string;
}

export function HoodPack({
  tiltX = 0,
  tiltY = 0,
  shineX = 50,
  shineY = 35,
  tearProgress = 0,
  lift = 0,
  className = "",
}: HoodPackProps) {
  const peeling = tearProgress > 0.015;

  return (
    <div
      className={`relative ${className}`}
      style={{
        transform: `perspective(1400px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateY(${-lift * 22}px) scale(${1 + lift * 0.08})`,
        transformStyle: "preserve-3d",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute top-[12%] left-1/2 h-[70%] w-[62%] -translate-x-1/2 rounded-[28px] blur-2xl"
        style={{
          background:
            "radial-gradient(circle, rgba(204,255,0,0.3) 0%, transparent 70%)",
          opacity: 0.35 + tearProgress * 0.55 + lift * 0.25,
        }}
      />

      <div className="relative aspect-[1024/1536] w-full" style={{ transformStyle: "preserve-3d" }}>
        {peeling && (
          <div
            aria-hidden
            className="pointer-events-none absolute right-[14%] left-[14%] z-[1] h-[14%] -translate-y-1/2"
            style={{
              top: `${tearY(tearProgress)}%`,
              background:
                "radial-gradient(ellipse at center, rgba(204,255,0,0.55) 0%, rgba(255,255,255,0.18) 28%, transparent 72%)",
              opacity: 0.25 + tearProgress * 0.75,
              filter: "blur(6px)",
            }}
          />
        )}

        <div
          className="absolute inset-0 origin-top will-change-transform"
          style={{
            clipPath: peeling ? bodyClip(tearProgress) : undefined,
          }}
        >
          <PackFace shineX={shineX} shineY={shineY} />
        </div>

        {peeling && (
          <div
            className="absolute inset-0 origin-top will-change-transform"
            style={{
              clipPath: flapClip(tearProgress),
              transform: `rotateX(${-118 * tearProgress}deg) translateZ(${tearProgress * 12}px)`,
              opacity: 1 - tearProgress * 0.28,
              filter: `brightness(${1 + tearProgress * 0.2})`,
              backfaceVisibility: "hidden",
            }}
          >
            <PackFace shineX={shineX} shineY={shineY} torn />
          </div>
        )}

        {peeling && <TearSpark progress={tearProgress} />}
      </div>
    </div>
  );
}

function PackFace({
  shineX,
  shineY,
  torn = false,
}: {
  shineX: number;
  shineY: number;
  torn?: boolean;
}) {
  return (
    <div className="relative h-full w-full overflow-hidden">
      <Image
        src={PACK_SRC}
        alt={torn ? "" : "HoodShares booster pack"}
        width={PACK_W}
        height={PACK_H}
        priority
        unoptimized
        className="h-full w-full object-contain drop-shadow-[0_24px_40px_rgba(0,0,0,0.55)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-[6%] mix-blend-screen"
        style={{
          background: `radial-gradient(circle at ${shineX}% ${shineY}%, rgba(255,255,255,0.22) 0%, rgba(204,255,0,0.08) 22%, transparent 46%)`,
          opacity: torn ? 0.45 : 1,
        }}
      />
    </div>
  );
}

function TearSpark({ progress }: { progress: number }) {
  const y = `${tearY(progress)}%`;
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <span
        className="absolute right-[8%] left-[8%] h-[2px] -translate-y-1/2"
        style={{
          top: y,
          background:
            "linear-gradient(90deg, transparent 4%, #ccff00 22%, #fff 50%, #ccff00 78%, transparent 96%)",
          boxShadow: "0 0 18px 4px rgba(204,255,0,0.55)",
          opacity: progress > 0.05 && progress < 0.96 ? 1 : 0,
        }}
      />
    </div>
  );
}

export function PackShards({ progress }: { progress: number }) {
  if (progress < 0.1) return null;
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-visible">
      {Array.from({ length: 16 }, (_, i) => {
        const angle = -78 + i * 10.2;
        const dist = 22 + (i % 5) * 14;
        const rad = (angle * Math.PI) / 180;
        const x = Math.cos(rad) * dist * progress;
        const y = -10 + Math.sin(rad) * dist * progress - progress * 42;
        return (
          <span
            key={i}
            className="absolute top-[18%] left-1/2 h-1 w-2 -translate-x-1/2 rounded-[0.5px]"
            style={{
              background: i % 3 === 0 ? "#ccff00" : i % 3 === 1 ? "#2a2a2a" : "#c8d060",
              transform: `translate(${x}px, ${y}px) rotate(${angle + progress * 140}deg)`,
              opacity: Math.max(0, 0.95 - progress * 0.85),
            }}
          />
        );
      })}
    </div>
  );
}
