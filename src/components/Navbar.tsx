"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BuySoodButton } from "./BuySoodButton";
import { ConnectWalletButton } from "./ConnectWalletButton";
import { Logo } from "./Logo";
import { XLink } from "./XLink";

const PLAY_LINKS = [
  { href: "/inventory", label: "Inventory" },
  { href: "/play", label: "Play" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/packs", label: "Packs" },
];

const MORE_LINKS = [
  { href: "/#faq", label: "FAQ" },
  { href: "/#collection", label: "Collection" },
  { href: "/#scoring", label: "Scoring" },
  { href: "/#treasury", label: "Treasury" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    if (!moreOpen) return;
    function handleClick(event: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) {
        setMoreOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [moreOpen]);

  return (
    <header className="border-line bg-void/80 sticky top-0 z-50 border-b backdrop-blur-xl">
      <nav className="mx-auto flex h-16 w-full max-w-7xl items-center gap-8 px-5 sm:px-8">
        <Link
          href="/"
          className="shrink-0"
          onClick={() => {
            setOpen(false);
            setMoreOpen(false);
          }}
        >
          <Logo />
        </Link>

        <ul className="hidden min-w-0 flex-1 items-center gap-8 lg:flex">
          {PLAY_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-ink-2 hover:text-ink text-sm font-medium transition-colors"
              >
                {link.label}
              </Link>
            </li>
          ))}
          <li className="relative" ref={moreRef}>
            <button
              type="button"
              aria-expanded={moreOpen}
              onClick={() => setMoreOpen((value) => !value)}
              className="text-ink-2 hover:text-ink text-sm font-medium transition-colors"
            >
              More
            </button>
            {moreOpen && (
              <ul className="border-line bg-surface-2 absolute top-full left-0 z-50 mt-3 w-44 overflow-hidden rounded-xl border py-1 shadow-xl">
                {MORE_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => setMoreOpen(false)}
                      className="text-ink hover:bg-surface-3 block px-4 py-2.5 text-sm"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>
        </ul>

        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
          <XLink className="hidden sm:inline-flex" />
          <BuySoodButton />
          <Link
            href="/mint"
            className="border-acid/40 text-acid hover:bg-acid/10 hidden rounded-full border px-3 py-2 text-sm font-semibold whitespace-nowrap transition-colors sm:inline-flex sm:px-4"
          >
            Get HoodPass
          </Link>
          <ConnectWalletButton />
          <button
            type="button"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
            className="border-line text-ink hover:border-line-bright flex h-10 w-10 items-center justify-center rounded-full border lg:hidden"
          >
            <span className="flex flex-col gap-1.5">
              <span className={`bg-ink block h-px w-4 transition ${open ? "translate-y-[4px] rotate-45" : ""}`} />
              <span className={`bg-ink block h-px w-4 transition ${open ? "opacity-0" : ""}`} />
              <span className={`bg-ink block h-px w-4 transition ${open ? "-translate-y-[4px] -rotate-45" : ""}`} />
            </span>
          </button>
        </div>
      </nav>

      {open && (
        <div className="border-line bg-void/95 border-t lg:hidden">
          <ul className="mx-auto flex max-w-7xl flex-col gap-1 px-5 py-3 sm:px-8">
            <li className="px-3 py-2">
              <BuySoodButton size="block" />
            </li>
            {[...PLAY_LINKS, ...MORE_LINKS].map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="text-ink hover:text-acid block rounded-lg px-3 py-2.5 text-sm font-medium"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}
