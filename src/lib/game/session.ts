/**
 * Live rounds follow the US cash-equity session, not UTC midnight.
 *
 * Robinhood Chain stock tokens track NYSE/Nasdaq names. Those names print
 * an official open at 09:30 America/New_York and an official close at 16:00.
 * Scoring is the % move between those two prints (or between the open and
 * the moment a player locks a card). A UTC-midnight round would score
 * overnight noise and weekend gaps that the underlying exchange does not.
 *
 * Weekends and US market holidays have no Daily Lineup. The demo on /play
 * compresses one session into ROUND_DURATION_MS so the lock mechanic is
 * visible without waiting for the bell.
 */

export const SESSION_TIME_ZONE = "America/New_York";
export const SESSION_OPEN = { hour: 9, minute: 30 } as const;
export const SESSION_CLOSE = { hour: 16, minute: 0 } as const;

export const SESSION_LABEL = "09:30 to 16:00 ET, weekdays";

export type SessionPhase = "weekend" | "preopen" | "open" | "closed";

interface NyClock {
  weekday: number;
  hour: number;
  minute: number;
}

function nyClock(now = new Date()): NyClock {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: SESSION_TIME_ZONE,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const weekdayName = parts.find((p) => p.type === "weekday")?.value ?? "Mon";
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(weekdayName);
  let hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  // Some runtimes emit 24 for midnight when hour12 is false.
  if (hour === 24) hour = 0;
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return { weekday, hour, minute };
}

function minutesSinceMidnight(hour: number, minute: number): number {
  return hour * 60 + minute;
}

export function sessionPhase(now = new Date()): SessionPhase {
  const { weekday, hour, minute } = nyClock(now);
  if (weekday === 0 || weekday === 6) return "weekend";
  const t = minutesSinceMidnight(hour, minute);
  const open = minutesSinceMidnight(SESSION_OPEN.hour, SESSION_OPEN.minute);
  const close = minutesSinceMidnight(SESSION_CLOSE.hour, SESSION_CLOSE.minute);
  if (t < open) return "preopen";
  if (t < close) return "open";
  return "closed";
}

export function sessionPhaseLabel(phase: SessionPhase = sessionPhase()): string {
  switch (phase) {
    case "weekend":
      return "Market closed, weekend";
    case "preopen":
      return "Before the open, lineups lock at 09:30 ET";
    case "open":
      return "Session live. Lock a card or wait for the close.";
    case "closed":
      return "Session settled at the 16:00 ET close";
  }
}
