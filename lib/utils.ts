import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, isValid } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | null | undefined, currency = "INR"): string {
  if (amount === null || amount === undefined || isNaN(amount)) return "₹0";
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency === "INR" ? "INR" : "USD",
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `₹${amount.toLocaleString()}`;
  }
}

export function formatDate(date: Date | string | null | undefined, pattern = "dd MMM yyyy"): string {
  if (!date) return "-";
  const d = typeof date === "string" ? new Date(date) : date;
  if (!isValid(d)) return "-";
  return format(d, pattern);
}

export function formatDateTime(date: Date | string | null | undefined): string {
  return formatDate(date, "dd MMM yyyy, hh:mm a");
}

export function calculateOccupancy(totalBeds: number, occupiedBeds: number): number {
  if (!totalBeds || totalBeds <= 0) return 0;
  return Math.min(100, Math.round((occupiedBeds / totalBeds) * 100));
}

export function getBedStatusColor(status: string) {
  switch (status?.toUpperCase()) {
    case "AVAILABLE":
      return {
        bg: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800",
        badge: "bg-emerald-500 text-white",
        dot: "bg-emerald-500",
        label: "Available",
      };
    case "OCCUPIED":
      return {
        bg: "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800",
        badge: "bg-rose-500 text-white",
        dot: "bg-rose-500",
        label: "Occupied",
      };
    case "RESERVED":
      return {
        bg: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800",
        badge: "bg-amber-500 text-white",
        dot: "bg-amber-500",
        label: "Reserved",
      };
    case "MAINTENANCE":
    default:
      return {
        bg: "bg-slate-500/10 text-slate-600 border-slate-500/20 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-700",
        badge: "bg-slate-500 text-white",
        dot: "bg-slate-500",
        label: "Maintenance",
      };
  }
}

export function getInvoiceStatusColor(status: string) {
  switch (status?.toUpperCase()) {
    case "PAID":
      return "bg-emerald-500/15 text-emerald-700 border-emerald-300 dark:text-emerald-400 dark:border-emerald-800";
    case "PARTIALLY_PAID":
      return "bg-amber-500/15 text-amber-700 border-amber-300 dark:text-amber-400 dark:border-amber-800";
    case "OVERDUE":
      return "bg-rose-500/15 text-rose-700 border-rose-300 dark:text-rose-400 dark:border-rose-800";
    case "WAIVED":
      return "bg-purple-500/15 text-purple-700 border-purple-300 dark:text-purple-400 dark:border-purple-800";
    case "PENDING":
    default:
      return "bg-blue-500/15 text-blue-700 border-blue-300 dark:text-blue-400 dark:border-blue-800";
  }
}

export function getComplaintStatusColor(status: string) {
  switch (status?.toUpperCase()) {
    case "RESOLVED":
    case "CLOSED":
      return "bg-emerald-500/15 text-emerald-700 border-emerald-300 dark:text-emerald-400 dark:border-emerald-800";
    case "IN_PROGRESS":
      return "bg-sky-500/15 text-sky-700 border-sky-300 dark:text-sky-400 dark:border-sky-800";
    case "ASSIGNED":
      return "bg-indigo-500/15 text-indigo-700 border-indigo-300 dark:text-indigo-400 dark:border-indigo-800";
    case "OPEN":
    default:
      return "bg-amber-500/15 text-amber-700 border-amber-300 dark:text-amber-400 dark:border-amber-800";
  }
}
