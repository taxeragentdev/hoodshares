import { SESSION_TIME_ZONE } from "@/lib/game/session";

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
