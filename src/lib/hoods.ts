/**
 * Archetype cards ("hoods") are the identity layer of the collection.
 *
 * They are never sold. Each one is awarded at the end of a season to the
 * players who best embodied a particular style of play, which is what gives
 * them status: they cannot be bought, only earned.
 *
 * Their in-game effect is deliberately limited to access and recognition
 * rather than raw power — a reward that made winners stronger would let the
 * early leaders compound their advantage until newcomers could never catch up.
 */

export const STAT_KEYS = ["focus", "speed", "strategy", "hands"] as const;

export type StatKey = (typeof STAT_KEYS)[number];

export const STAT_MAX = 6;

export const STAT_LABEL: Record<StatKey, string> = {
  focus: "Focus",
  speed: "Speed",
  strategy: "Strategy",
  hands: "Hands",
};

/** What each stat actually changes in a contest. */
export const STAT_EFFECT: Record<StatKey, string> = {
  focus: "Raises the contrarian bonus for backing cards the field ignored",
  speed: "Grants a later lineup lock and a bonus for submitting early",
  strategy: "Amplifies the weekly sector rotation multiplier",
  hands: "Increases the payout curve on consecutive-day streaks",
};

/** Eye treatment drawn into the hood's face cavity. */
export type EyeStyle = "visor" | "pixel" | "glow" | "slit";

export interface HoodArchetype {
  id: string;
  name: string;
  edition: string;
  tagline: string;
  /** The season-end criterion that awards this card. */
  earnedBy: string;
  /** Short label for the criterion, used on the card face. */
  earnedByShort: string;
  accent: string;
  eyes: EyeStyle;
  stats: Record<StatKey, number>;
  /** Perk granted by holding the card. Access and status, never raw power. */
  perk: string;
}

export const HOODS: HoodArchetype[] = [
  {
    id: "brokerhood",
    name: "Brokerhood",
    edition: "Season I",
    tagline: "Made to execute. Wired for markets.",
    earnedBy:
      "Awarded to the players with the highest consistency score across the season. Steady placement counts more than one lucky session.",
    earnedByShort: "Most consistent finisher",
    accent: "#e8e8e8",
    eyes: "visor",
    stats: { focus: 4, speed: 5, strategy: 5, hands: 3 },
    perk: "Seat in the invitational bracket that closes each season",
  },
  {
    id: "stonkzhood",
    name: "Stonkzhood",
    edition: "Season I",
    tagline: "Hype is temporary. Legends compound.",
    earnedBy:
      "Awarded for the single highest scoring session of the season. One enormous call is enough, though that usually does not happen.",
    earnedByShort: "Highest single session",
    accent: "#ff3d8b",
    eyes: "pixel",
    stats: { focus: 5, speed: 4, strategy: 3, hands: 2 },
    perk: "Entry to high-variance contests with doubled swing on every card",
  },
  {
    id: "retailhood",
    name: "Retailhood",
    edition: "Season I",
    tagline: "Not whales. We make waves.",
    earnedBy:
      "Awarded for the longest unbroken run of daily entries. No capital required, only turning up every single session.",
    earnedByShort: "Longest entry streak",
    accent: "#38bdf8",
    eyes: "glow",
    stats: { focus: 3, speed: 3, strategy: 3, hands: 4 },
    perk: "Founds and leads a guild, pooling members' scores into a league",
  },
  {
    id: "trenchorhood",
    name: "Trenchorhood",
    edition: "Season I",
    tagline: "Digging deeper. Building tomorrow.",
    earnedBy:
      "Awarded for collection depth: the widest set held through the full season, counting cards kept, not flipped.",
    earnedByShort: "Deepest collection held",
    accent: "#fbbf24",
    eyes: "slit",
    stats: { focus: 3, speed: 2, strategy: 4, hands: 5 },
    perk: "Early access to each new card series before it reaches open supply",
  },
];
