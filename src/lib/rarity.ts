export const RARITIES = [
  "common",
  "rare",
  "epic",
  "legendary",
  "mythic",
] as const;

export type Rarity = (typeof RARITIES)[number];

export interface RarityConfig {
  id: Rarity;
  label: string;
  /** Single-letter code stamped in the corner of the card face. */
  letter: string;
  /** Drop chance as a percentage of the 10,000 card supply. */
  chance: number;
  supply: number;
  /**
   * Unused for scoring. Kept so foil colors on the card face stay distinct.
   * Daily Lineup is percent move × 100, then the duplicate cut.
   */
  multiplier: number;
  hex: string;
  /** Foil treatment printed on the card face. */
  foil: string;
  /* Tailwind classes are written out in full so the compiler can find them. */
  text: string;
  border: string;
  bg: string;
  glow: string;
}

export const RARITY: Record<Rarity, RarityConfig> = {
  common: {
    id: "common",
    label: "Common",
    letter: "C",
    chance: 55,
    supply: 5500,
    multiplier: 1,
    hex: "#9aa0a6",
    foil: "Matte",
    text: "text-common",
    border: "border-common/30",
    bg: "bg-common/10",
    glow: "shadow-[0_0_0_0_transparent]",
  },
  rare: {
    id: "rare",
    label: "Rare",
    letter: "R",
    chance: 27,
    supply: 2700,
    multiplier: 1.1,
    hex: "#38bdf8",
    foil: "Holo",
    text: "text-rare",
    border: "border-rare/40",
    bg: "bg-rare/10",
    glow: "shadow-[0_0_50px_-16px_#38bdf8]",
  },
  epic: {
    id: "epic",
    label: "Epic",
    letter: "E",
    chance: 13,
    supply: 1300,
    multiplier: 1.2,
    hex: "#a855f7",
    foil: "Prism",
    text: "text-epic",
    border: "border-epic/45",
    bg: "bg-epic/10",
    glow: "shadow-[0_0_60px_-14px_#a855f7]",
  },
  legendary: {
    id: "legendary",
    label: "Legendary",
    letter: "L",
    chance: 4.2,
    supply: 420,
    multiplier: 1.35,
    hex: "#fbbf24",
    foil: "Gold Leaf",
    text: "text-legendary",
    border: "border-legendary/50",
    bg: "bg-legendary/10",
    glow: "shadow-[0_0_70px_-12px_#fbbf24]",
  },
  mythic: {
    id: "mythic",
    label: "Mythic",
    letter: "M",
    chance: 0.8,
    supply: 80,
    multiplier: 1.5,
    hex: "#ff3d8b",
    foil: "Refractor",
    text: "text-mythic",
    border: "border-mythic/60",
    bg: "bg-mythic/10",
    glow: "shadow-[0_0_80px_-10px_#ff3d8b]",
  },
};

export const RARITY_LIST = RARITIES.map((id) => RARITY[id]);

export const TOTAL_SUPPLY = RARITY_LIST.reduce((sum, r) => sum + r.supply, 0);
