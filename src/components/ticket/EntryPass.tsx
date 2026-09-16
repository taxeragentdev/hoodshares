"use client";

import Image from "next/image";
import { useRef, useState } from "react";

const PASS_SRC = "/hoodpass.png";
const PASS_W = 1031;
const PASS_H = 1525;

interface EntryPassProps {
  className?: string;
  interactive?: boolean;
  priority?: boolean;
}

export function EntryPass({
  className = "",
  interactive = true,
  priority = true,
}: EntryPassProps) {
  const root = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 8, y: -12 });
  const [shine, setShine] = useState({ x: 42, y: 28 });

  function handleMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!interactive || !root.current) return;
    const rect = root.current.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: -py * 10, y: px * 14 });
    setShine({ x: 50 + px * 32, y: 32 + py * 24 });
  }

  function handleLeave() {
    setTilt({ x: 8, y: -12 });
    setShine({ x: 42, y: 28 });
  }

  return (
    <div
      ref={root}
      className={`relative ${className}`}
      onPointerMove={handleMove}
      onPointerLeave={handleLeave}
      style={{
        transform: `perspective(1400px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transformStyle: "preserve-3d",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute top-[8%] left-1/2 h-[78%] w-[70%] -translate-x-1/2 rounded-[36px] blur-3xl"
        style={{
          background: "radial-gradient(circle, rgba(204,255,0,0.28) 0%, transparent 72%)",
        }}
      />

      <article className="relative aspect-[1031/1525] w-full">
        <Image
          src={PASS_SRC}
          alt="HoodPass"
          width={PASS_W}
          height={PASS_H}
          sizes="(max-width: 640px) 88vw, 420px"
          className="h-full w-full object-contain drop-shadow-[0_30px_80px_rgba(0,0,0,0.55)]"
          priority={priority}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-[8%] rounded-[28px] mix-blend-screen"
          style={{
            background: `radial-gradient(circle at ${shine.x}% ${shine.y}%, rgba(204,255,0,0.16) 0%, transparent 42%), linear-gradient(115deg, transparent 35%, rgba(255,255,255,0.1) 48%, transparent 62%)`,
          }}
        />
      </article>
    </div>
  );
}
