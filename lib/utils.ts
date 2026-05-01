import { format, parseISO } from "date-fns";
import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/** Format a Date or ISO string as "h:mm a" (e.g. "8:30 AM") */
export function formatTime(dt: Date | string | null | undefined): string {
  if (!dt) return "—";
  const d = typeof dt === "string" ? parseISO(dt) : dt;
  return format(d, "h:mm a");
}

/** Format a Date or ISO string as "MMM d, yyyy" (e.g. "Apr 28, 2026") */
export function formatDate(dt: Date | string | null | undefined): string {
  if (!dt) return "—";
  return format(utcDateToLocal(dt), "MMM d, yyyy");
}

/** Format a Date or ISO string as "EEEE, MMMM d, yyyy" */
export function formatDateLong(dt: Date | string | null | undefined): string {
  if (!dt) return "—";
  return format(utcDateToLocal(dt), "EEEE, MMMM d, yyyy");
}

/**
 * Converts a UTC-midnight Date (as returned by Prisma @db.Date columns) to a
 * local-midnight Date with the same calendar date. Prevents UTC→local rollback
 * in negative-offset timezones (e.g. 2026-04-30T00:00Z → Apr 29 local in UTC-4).
 */
function utcDateToLocal(dt: Date | string): Date {
  const iso = typeof dt === "string" ? dt : dt.toISOString();
  const [year, month, day] = iso.slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Returns today's date string "yyyy-MM-dd" in US/Pacific time.
 * Pacific is the westernmost continental US timezone, so this date
 * never rolls over before any North American user's local midnight.
 */
export function getTodayString(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Los_Angeles",
  }).format(new Date());
}

/** Format minutes as "1h 23m" or "45m" */
export function formatDuration(minutes: number | null | undefined): string {
  if (minutes == null || minutes < 0) return "—";
  if (minutes === 0) return "0m";
  const total = Math.round(minutes);
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

/**
 * Combine a surgical day date (Date object) with a time string "HH:mm"
 * to produce a full DateTime in local time.
 */
export function combineDateAndTime(date: Date, timeStr: string): Date {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

/**
 * Extract "HH:mm" from a Date or ISO string for use in <input type="time">
 */
export function toTimeInput(dt: Date | string | null | undefined): string {
  if (!dt) return "";
  const d = typeof dt === "string" ? new Date(dt) : dt;
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

/**
 * Combine a date with an "HH:mm" string, returning null if timeStr is absent.
 * Shared by server actions to avoid duplication.
 */
export function parseTime(dayDate: Date, timeStr: string | undefined): Date | null {
  if (!timeStr) return null;
  return combineDateAndTime(dayDate, timeStr);
}

/** Minutes between two dates. Returns null if either is missing. */
export function minutesBetween(
  start: Date | string | null | undefined,
  end: Date | string | null | undefined
): number | null {
  if (!start || !end) return null;
  const s = typeof start === "string" ? new Date(start) : start;
  const e = typeof end === "string" ? new Date(end) : end;
  const diff = (e.getTime() - s.getTime()) / 60000;
  return diff >= 0 ? diff : null;
}
