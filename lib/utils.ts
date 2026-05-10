import clsx, { ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amountInCents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amountInCents / 100);
}
export function formatCurrencyCompact(
  amountInCents?: number,
  currency: string = "GBP",
) {
  if (amountInCents === undefined) {
    return new Intl.NumberFormat("en-GB", { style: "currency", currency })
      .format(0)
      .replace(/[\d.,\s]+/, "")
      .trim();
  }

  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    notation: "compact",
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(amountInCents / 100);
}

export function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}
