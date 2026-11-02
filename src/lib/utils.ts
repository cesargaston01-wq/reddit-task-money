import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formats a dollar amount: "3" for whole numbers, "3.50" otherwise. */
export function formatAmount(value: number | string | null | undefined) {
  const n = Number(value ?? 0);
  return Number.isInteger(n) ? n.toFixed(0) : n.toFixed(2);
}
