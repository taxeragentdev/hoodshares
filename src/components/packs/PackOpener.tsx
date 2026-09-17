"use client";

import { useEffect, useRef, useState } from "react";
import { AssetCard } from "@/components/AssetCard";
import { cardTicker } from "@/lib/cards";
import type { OpenedCard } from "@/lib/packs";
import { HoodPack, PackShards } from "./HoodPack";

type Phase = "idle" | "lifting" | "tearing" | "bursting" | "done";

interface PackOpenerProps {
  opened: OpenedCard[] | null;
  onOpen: () => boolean | Promise<boolean>;
  onClear: () => void;
  resetLabel?: string;
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function PackOpener({ opened, onOpen, onClear, resetLabel = "Open another" }: PackOpenerProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [tear, setTear] = useState(0);
  const [lift, setLift] = useState(0);
  const [tilt, setTilt] = useState({ x: 5, y: -6 });
  const [shine, setShine] = useState({ x: 42, y: 28 });
  const sceneRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const dragged = useRef(false);
  const startX = useRef(0);
  const tearRef = useRef(0);
  const animRef = useRef<number>(0);
  const timers = useRef<number[]>([]);
  const opening = useRef(false);
  const tiltTarget = useRef({ x: 5, y: -6 });
  const shineTarget = useRef({ x: 42, y: 28 });
  const tiltCurrent = useRef({ x: 5, y: -6 });
  const shineCurrent = useRef({ x: 42, y: 28 });

  useEffect(() => {
    tearRef.current = tear;
  }, [tear]);

  useEffect(() => {
    return () => {
      cancelAnimationFrame(animRef.current);
      timers.current.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  useEffect(() => {
    if (phase !== "idle" || prefersReducedMotion()) return;
    let frame = 0;
    const tick = () => {
      const t = tiltCurrent.current;
      const g = tiltTarget.current;
      t.x += (g.x - t.x) * 0.14;
      t.y += (g.y - t.y) * 0.14;
      const s = shineCurrent.current;
      const sg = shineTarget.current;
      s.x += (sg.x - s.x) * 0.14;
      s.y += (sg.y - s.y) * 0.14;
      if (Math.abs(t.x - g.x) > 0.02 || Math.abs(t.y - g.y) > 0.02) {
        setTilt({ x: t.x, y: t.y });
        setShine({ x: s.x, y: s.y });
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [phase]);

  function later(ms: number, fn: () => void) {
    const id = window.setTimeout(fn, ms);
    timers.current.push(id);
  }

  function tween(
    from: number,
    to: number,
    duration: number,
    apply: (v: number) => void,
    done?: () => void,
  ) {
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) ** 3;
      apply(from + (to - from) * eased);
      if (t < 1) animRef.current = requestAnimationFrame(tick);
      else done?.();
    };
    animRef.current = requestAnimationFrame(tick);
  }

  function finishTear(from = tearRef.current) {
    tween(from, 1, 420, setTear, () => {
      setPhase("bursting");
      later(980, () => setPhase("done"));
    });
  }

  function playOpen() {
    if (prefersReducedMotion()) {
      setLift(1);
      setTear(1);
      setPhase("done");
      return;
    }
    setPhase("lifting");
    tween(0, 1, 380, setLift, () => {
      setPhase("tearing");
      tween(0, 1, 980, setTear, () => {
        setPhase("bursting");
        later(980, () => setPhase("done"));
      });
    });
  }

  async function beginOpen() {
    if (phase !== "idle" || opening.current) return;
    opening.current = true;
    try {
      const ok = await onOpen();
      if (!ok) return;
      playOpen();
    } finally {
      opening.current = false;
    }
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (phase !== "idle") return;
    dragging.current = true;
    dragged.current = false;
    startX.current = event.clientX;
    sceneRef.current?.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (phase === "idle" && sceneRef.current && !dragging.current) {
      const rect = sceneRef.current.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width - 0.5;
      const py = (event.clientY - rect.top) / rect.height - 0.5;
      tiltTarget.current = { x: -py * 7, y: px * 9 };
      shineTarget.current = { x: 50 + px * 28, y: 34 + py * 20 };
    }
    if (!dragging.current) return;
    const raw = (event.clientX - startX.current) / 200;
    if (!dragged.current && Math.abs(event.clientX - startX.current) < 10) return;
    if (!dragged.current) {
      dragged.current = true;
      if (!opened) {
        dragging.current = false;
        void beginOpen();
        return;
      }
      setPhase("tearing");
      setLift(1);
    }
    const next = Math.min(1, Math.max(0, raw));
    setTear(next);
    if (next >= 0.9) {
      dragging.current = false;
      finishTear(next);
    }
  }

  function handlePointerUp() {
    if (!dragging.current) return;
    dragging.current = false;
    if (!dragged.current) {
      beginOpen();
      return;
    }
    if (tearRef.current >= 0.4 || opened) {
      finishTear();
    } else {
      setTear(0);
      setLift(0);
      setPhase("idle");
    }
  }

  function handleReset() {
    cancelAnimationFrame(animRef.current);
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
    dragging.current = false;
    setTear(0);
    setLift(0);
    setPhase("idle");
    tiltTarget.current = { x: 5, y: -6 };
    shineTarget.current = { x: 42, y: 28 };
    tiltCurrent.current = { x: 5, y: -6 };
    shineCurrent.current = { x: 42, y: 28 };
    setTilt({ x: 5, y: -6 });
    setShine({ x: 42, y: 28 });
    onClear();
  }

  const showPack = phase !== "done";
  const cardsLive = Boolean(opened) && phase !== "idle";
  const stacked = phase === "lifting" || phase === "tearing";
  const packHiding = phase === "bursting";
  const spread = phase === "bursting" || phase === "done";

  return (
    <div className={phase === "idle" ? "" : "mt-6"}>
      <div
        className={
          phase === "idle"
            ? "grid items-center gap-6 sm:gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(280px,1fr)] lg:gap-12"
            : undefined
        }
      >
      <div
        ref={sceneRef}
        role="img"
        aria-label="HoodShares booster pack. Drag across it or tap to tear it open."
        className={`relative touch-none select-none transition-[max-width,min-height] duration-500 ${
          spread || stacked
            ? "mx-auto min-h-[300px] w-full max-w-3xl sm:min-h-[340px]"
            : "mx-auto aspect-[1024/1536] h-[min(48svh,22rem)] w-auto sm:h-[min(56svh,28rem)] lg:mx-0 lg:ml-auto lg:h-[min(calc(100svh-14rem),30rem)]"
        }`}
        onPointerDown={showPack ? handlePointerDown : undefined}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerLeave={() => {
          if (phase !== "idle") return;
          tiltTarget.current = { x: 5, y: -6 };
          shineTarget.current = { x: 42, y: 28 };
        }}
      >
        {cardsLive && opened && (
          <div className="relative z-0 grid grid-cols-5 items-start gap-2 pt-1 sm:gap-3">
            {opened.map((item, index) => {
              const mid = (opened.length - 1) / 2;
              const cells = mid - index;
              return (
                <div
                  key={`${item.card.id}-${index}`}
                  className="flex flex-col"
                  style={{
                    transform: stacked
                      ? `translate(calc(${cells * 100}% + ${cells * 10}px), ${72 + index * 5}px) scale(${0.34 + tear * 0.06}) rotate(${(index - mid) * 5}deg)`
                      : "translate(0, 0) scale(1) rotate(0deg)",
                    opacity: stacked ? 0.2 + tear * 0.55 : 1,
                    zIndex: stacked ? opened.length - index : index + 1,
                    filter: stacked ? "brightness(0.9)" : "none",
                    transition: stacked
                      ? "opacity 180ms linear"
                      : `transform 880ms cubic-bezier(0.16, 1.14, 0.28, 1) ${index * 72}ms, opacity 360ms ease ${index * 40}ms`,
                  }}
                >
                  <AssetCard card={item.card} size="md" interactive={phase === "done"} />
                  <p
                    className="text-ink-3 mt-2 text-center font-mono text-[10px] font-bold tracking-widest"
                    style={{
                      opacity: phase === "done" ? 1 : 0,
                      transform: phase === "done" ? "translateY(0)" : "translateY(6px)",
                      transition: "opacity 320ms ease 180ms, transform 320ms ease 180ms",
                    }}
                  >
                    {cardTicker(item.card)}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {phase === "bursting" && (
          <div
            aria-hidden
            className="animate-pack-flash pointer-events-none absolute inset-0 z-30"
          />
        )}

        {showPack && (
          <div
            className={`absolute inset-0 z-20 ${
              phase === "idle" ? "cursor-grab active:cursor-grabbing" : ""
            }`}
            style={{
              opacity: packHiding ? 0 : 1,
              transform: packHiding ? "translateY(48px) scale(0.82)" : undefined,
              transition: "opacity 420ms ease, transform 560ms cubic-bezier(0.22, 1, 0.36, 1)",
              pointerEvents: packHiding ? "none" : "auto",
            }}
          >
            <div className={phase === "idle" ? "animate-pack-idle" : ""}>
              <HoodPack
                tiltX={tilt.x}
                tiltY={tilt.y}
                shineX={shine.x}
                shineY={shine.y}
                tearProgress={tear}
                lift={lift}
              />
              <PackShards progress={tear} />
            </div>
          </div>
        )}
      </div>

      {phase === "idle" && (
        <div className="flex min-w-0 flex-col justify-center">
          <p className="text-ink-2 text-sm leading-relaxed">
            Drag across the pack to tear it, or tap the button.
          </p>
          <button
            type="button"
            onClick={beginOpen}
            className="bg-acid hover:bg-acid-dim mt-6 w-full rounded-full py-3.5 text-sm font-bold tracking-wide text-black uppercase transition-colors"
          >
            Tear open
          </button>
        </div>
      )}
      </div>

      {(phase === "lifting" || phase === "tearing") && (
        <p className="text-ink-3 mt-6 text-center font-mono text-[11px] tracking-wide">
          The foil is tearing.
        </p>
      )}

      {phase === "done" && opened && (
        <button
          type="button"
          onClick={handleReset}
          className="border-line hover:border-acid hover:text-acid text-ink-2 mt-6 w-full rounded-full border py-3 text-sm font-semibold transition-colors"
        >
          {resetLabel}
        </button>
      )}
    </div>
  );
}
