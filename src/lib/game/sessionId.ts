import { SESSION_TIME_ZONE, sessionPhase } from "@/lib/game/session";

function sessionDateUtc(sessionDay: string): Date {
  const [year, month, day] = sessionDay.split("-").map(Number);
  return new Date(Date.UTC(year, (month || 1) - 1, day || 1, 12, 0, 0));
}

function formatSessionDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function isWeekdayUtc(date: Date): boolean {
  const weekday = date.getUTCDay();
  return weekday !== 0 && weekday !== 6;
}

/** Calendar day in America/New_York, used as the session key for scores. */
export function sessionId(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: SESSION_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const year = parts.find((p) => p.type === "year")?.value ?? "0000";
  const month = parts.find((p) => p.type === "month")?.value ?? "01";
  const day = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${year}-${month}-${day}`;
}

/** Monday of the NY week for a YYYY-MM-DD session id. */
export function weekStartId(sessionDay = sessionId()): string {
  const [year, month, day] = sessionDay.split("-").map(Number);
  if (!year || !month || !day) return sessionDay;
  const utc = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const weekday = utc.getUTCDay();
  const back = weekday === 0 ? 6 : weekday - 1;
  utc.setUTCDate(utc.getUTCDate() - back);
  return utc.toISOString().slice(0, 10);
}

export function weekId(now = new Date()): string {
  return weekStartId(sessionId(now));
}

export function isSessionInWeek(sessionDay: string, week = weekId()): boolean {
  return weekStartId(sessionDay) === week;
}

/**
 * The session a player can still edit. Before the open that is today.
 * Once the cash session is live or settled, it is the next weekday.
 */
export function nextSessionId(now = new Date()): string {
  const today = sessionId(now);
  if (sessionPhase(now) === "preopen") return today;
  const utc = sessionDateUtc(today);
  utc.setUTCDate(utc.getUTCDate() + 1);
  while (!isWeekdayUtc(utc)) {
    utc.setUTCDate(utc.getUTCDate() + 1);
  }
  return formatSessionDay(utc);
}

export function formatSessionLabel(sessionDay: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(sessionDateUtc(sessionDay));
}

/** Same session day for every wallet. Friday Sep 25, not "your round 1". */
export function formatRoundDay(sessionDay: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(sessionDateUtc(sessionDay));
}
