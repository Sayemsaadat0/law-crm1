import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, isValid, parseISO, startOfDay } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

function toValidDate(dateInput: string | Date | null | undefined): Date | null {
  if (dateInput === null || dateInput === undefined) return null
  if (dateInput instanceof Date) {
    return isValid(dateInput) ? dateInput : null
  }
  const s = String(dateInput).trim()
  if (!s) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const d = parseISO(s)
    return isValid(d) ? d : null
  }
  const d = new Date(s)
  return isValid(d) ? d : null
}

/** Display dates as DD/MM/YYYY across the app (API storage remains yyyy-MM-dd). */
export function formatDisplayDate(
  dateInput: string | Date | null | undefined,
  fallback = "—"
): string {
  const d = toValidDate(dateInput)
  if (!d) return fallback
  return format(d, "dd/MM/yyyy")
}

/** DD-MM-YYYY (hyphens) for fields that explicitly use this pattern (API storage remains yyyy-MM-dd). */
export function formatDisplayDateHyphen(
  dateInput: string | Date | null | undefined,
  fallback = "—"
): string {
  const d = toValidDate(dateInput)
  if (!d) return fallback
  return format(d, "dd-MM-yyyy")
}

/** Date and time as DD/MM/YYYY HH:mm */
export function formatDisplayDateTime(
  dateInput: string | Date | null | undefined,
  fallback = "—"
): string {
  const d = toValidDate(dateInput)
  if (!d) return fallback
  return format(d, "dd/MM/yyyy HH:mm")
}

/** yyyy-MM-dd for <input type="date"> and stable data attributes */
export function formatIsoDateInput(dateInput: string | Date | null | undefined): string {
  const d = toValidDate(dateInput)
  if (!d) return ""
  return format(d, "yyyy-MM-dd")
}

/** Short month label for calendar dropdowns (e.g. Jan, Feb) */
export function formatCalendarMonthShort(date: Date): string {
  return format(date, "MMM")
}

/** Maps API party relation codes to readable labels (UI / PDF). */
const PARTY_RELATION_LABELS: Record<string, string> = {
  opposite_party: "Opposite Party",
  defendant: "Defendant",
  respondent: "Respondent",
  plaintiff: "Plaintiff",
  Petitioner: "Petitioner",
  Appellant: "Appellant",
}

export function formatPartyRelationLabel(relation: string | undefined | null): string {
  if (relation === undefined || relation === null) return ""
  const key = String(relation).trim()
  if (!key) return ""
  if (PARTY_RELATION_LABELS[key] !== undefined) return PARTY_RELATION_LABELS[key]
  if (key.includes("_")) {
    return key
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ")
  }
  return key
}

/**
 * Compares a date string with today's date
 * @param dateString - ISO date string (yyyy-mm-dd)
 * @returns 'today' | 'past' | 'future'
 */
export function compareDateWithToday(dateString: string): 'today' | 'past' | 'future' {
  const inputDate = toValidDate(dateString)
  if (!inputDate) return "past"
  const a = startOfDay(inputDate)
  const b = startOfDay(new Date())
  if (a.getTime() === b.getTime()) return "today"
  if (a.getTime() < b.getTime()) return "past"
  return "future"
}
