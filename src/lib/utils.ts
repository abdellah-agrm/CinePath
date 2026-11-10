import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  try {
    return twMerge(clsx(inputs));
  } catch (error) {
    console.error("[Utils] Error merging classes:", error);
    return "";
  }
}

export function formatPrice(amount: number | string | undefined | null, currency = "MAD"): string {
  try {
    if (amount === undefined || amount === null) return `0.00 ${currency}`;
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    if (isNaN(num)) return `0.00 ${currency}`;
    return `${num.toFixed(2)} ${currency}`;
  } catch (error) {
    console.error("[Utils] Error formatting price:", error);
    return `0.00 ${currency}`;
  }
}
