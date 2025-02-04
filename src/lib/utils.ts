import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Combine clsx and tailwind-merge to create a custom classnames function that supports both Tailwind CSS and custom CSS classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}