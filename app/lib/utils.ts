import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines multiple class names using clsx and tailwind-merge
 * This allows for conditional classes and prevents duplicate utility classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
} 