/* import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
*/
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a given date into a human-readable string.
 * @param date - The date to format (can be Date object, string, or timestamp).
 * @param locale - The locale string for formatting (default: "en-US").
 * @param options - Intl.DateTimeFormat options for customization.
 * @returns Formatted date string.
 */
export function formatDate(
  date: string | number | Date,
  locale: string = "en-US",
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }
): string {
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) {
    throw new Error("Invalid date provided");
  }
  return new Intl.DateTimeFormat(locale, options).format(parsedDate);
}
