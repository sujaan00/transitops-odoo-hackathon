import { format } from "date-fns";
import { asNumber } from "@/lib/utils";

export const INR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0
});

export const NUMBER = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 1
});

export function formatCurrency(value: unknown) {
  return INR.format(asNumber(value));
}

export function formatNumber(value: unknown, suffix = "") {
  return `${NUMBER.format(asNumber(value))}${suffix}`;
}

export function formatPercent(value: unknown) {
  return `${NUMBER.format(asNumber(value))}%`;
}

export function formatDate(value: Date | string | null | undefined) {
  if (!value) {
    return "Not set";
  }
  return format(new Date(value), "dd MMM yyyy");
}

export function formatDateTime(value: Date | string | null | undefined) {
  if (!value) {
    return "Not set";
  }
  return format(new Date(value), "dd MMM yyyy, h:mm a");
}
