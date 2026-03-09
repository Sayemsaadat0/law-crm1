import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Compares a date string with today's date
 * @param dateString - ISO date string (yyyy-mm-dd)
 * @returns 'today' | 'past' | 'future'
 */
export function compareDateWithToday(dateString: string): 'today' | 'past' | 'future' {
  const inputDate = new Date(dateString);
  const today = new Date();
  
  // Reset time to midnight for accurate date comparison
  inputDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  if (inputDate.getTime() === today.getTime()) {
    return 'today';
  } else if (inputDate.getTime() < today.getTime()) {
    return 'past';
  } else {
    return 'future';
  }
}
