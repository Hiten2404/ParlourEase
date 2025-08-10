import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Normalize Firestore Timestamp | Date | string to Date
export function toDateSafe(value: unknown): Date {
  // Avoid importing Firestore types here to keep this util lightweight.
  // Detect Timestamp by duck-typing on toDate function.
  if (value && typeof (value as any).toDate === 'function') {
    try { return (value as any).toDate(); } catch {}
  }
  if (value instanceof Date) return value;
  return new Date(value as any);
}