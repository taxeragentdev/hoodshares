import type { ReactNode } from "react";

/**
 * A single card mark: the artwork plus the viewBox it was drawn against.
 *
 * Marks come from three sources with different native grids — vendored token
 * SVGs are 24x24, hand-drawn work is 100x100 — so each one carries its own
 * viewBox instead of forcing every source onto one grid.
 */
export interface Mark {
  viewBox: string;
  node: ReactNode;
}

/** Grid the hand-drawn marks in this folder are authored against. */
export const DRAWN_VIEWBOX = "0 0 100 100";
