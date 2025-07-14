/**
 * Display utility functions for consistent status handling
 */

export interface DisplayStatus {
  isOnline?: boolean;
  isActive?: boolean;
  status?: 'online' | 'offline' | 'unknown' | 'syncing' | 'error';
}

/**
 * Determines if a display is available for content publishing
 * A display is considered "available" if it's either online OR active
 */
export function isDisplayAvailable(display: DisplayStatus): boolean {
  return Boolean(display.isOnline || display.isActive);
}

/**
 * Gets the effective status for display purposes
 * Returns 'online' if display is available, otherwise returns the actual status
 */
export function getEffectiveDisplayStatus(display: DisplayStatus): string {
  if (isDisplayAvailable(display)) {
    return 'online';
  }
  return display.status || 'offline';
}

/**
 * Filters displays to only include available ones
 */
export function getAvailableDisplays<T extends DisplayStatus>(displays: T[]): T[] {
  return displays.filter(isDisplayAvailable);
}

/**
 * Counts available displays from a list
 */
export function countAvailableDisplays(displays: DisplayStatus[]): number {
  return displays.filter(isDisplayAvailable).length;
}

/**
 * Counts unavailable displays from a list
 */
export function countUnavailableDisplays(displays: DisplayStatus[]): number {
  return displays.filter(display => !isDisplayAvailable(display)).length;
}

/**
 * Gets display statistics including available/unavailable counts
 */
export function getDisplayStatistics(displays: DisplayStatus[]) {
  const total = displays.length;
  const available = countAvailableDisplays(displays);
  const unavailable = countUnavailableDisplays(displays);
  
  return {
    total,
    available,
    unavailable,
    online: available, // Alias for backward compatibility
    offline: unavailable // Alias for backward compatibility
  };
} 