/**
 * Utility for merging Tailwind CSS classes
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines class names with Tailwind CSS merge support
 * Handles conditional classes and resolves Tailwind conflicts
 *
 * @example
 * ```tsx
 * cn('px-2 py-1', isActive && 'bg-blue-500', 'px-4')
 * // Result: 'py-1 bg-blue-500 px-4' (px-4 overrides px-2)
 * ```
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
