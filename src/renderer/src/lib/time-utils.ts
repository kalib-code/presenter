/**
 * Utility functions for flexible time parsing and formatting
 */

/**
 * Parse various time formats into seconds
 * Supports formats like:
 * - "5min", "30sec", "2hr", "1h30m", "2h15m30s"
 * - "3:30", "1:23:45", "05:30", "00:05:30"
 * - "300" (plain seconds)
 * - "5m 30s", "1h 30m", "2 hours 15 minutes"
 */
export function parseTimeToSeconds(input: string): number {
  if (!input || typeof input !== 'string') return 0

  const normalizedInput = input.toLowerCase().trim()

  // Handle plain numbers (seconds)
  if (/^\d+$/.test(normalizedInput)) {
    return parseInt(normalizedInput, 10)
  }

  // Handle HH:MM:SS, MM:SS, or H:MM formats
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(normalizedInput)) {
    const parts = normalizedInput.split(':').map((p) => parseInt(p, 10))
    if (parts.length === 2) {
      // MM:SS format
      return parts[0] * 60 + parts[1]
    } else if (parts.length === 3) {
      // HH:MM:SS format
      return parts[0] * 3600 + parts[1] * 60 + parts[2]
    }
  }

  // Handle abbreviated formats (5min, 30sec, 2hr, etc.)
  let totalSeconds = 0

  // Hours
  const hourMatches = normalizedInput.match(/(\d+)\s*(?:h|hr|hour|hours)/g)
  if (hourMatches) {
    hourMatches.forEach((match) => {
      const hours = parseInt(match.match(/\d+/)?.[0] || '0', 10)
      totalSeconds += hours * 3600
    })
  }

  // Minutes
  const minuteMatches = normalizedInput.match(/(\d+)\s*(?:m|min|minute|minutes)/g)
  if (minuteMatches) {
    minuteMatches.forEach((match) => {
      const minutes = parseInt(match.match(/\d+/)?.[0] || '0', 10)
      totalSeconds += minutes * 60
    })
  }

  // Seconds
  const secondMatches = normalizedInput.match(/(\d+)\s*(?:s|sec|second|seconds)/g)
  if (secondMatches) {
    secondMatches.forEach((match) => {
      const seconds = parseInt(match.match(/\d+/)?.[0] || '0', 10)
      totalSeconds += seconds
    })
  }

  return totalSeconds
}

/**
 * Format seconds into HH:MM:SS format
 */
export function formatTimeFromSeconds(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

/**
 * Format seconds into a human-readable string (e.g., "5 min", "1h 30m", "2h 15m 30s")
 */
export function formatTimeToHumanReadable(totalSeconds: number): string {
  if (totalSeconds === 0) return '0s'

  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const parts: string[] = []

  if (hours > 0) {
    parts.push(`${hours}h`)
  }

  if (minutes > 0) {
    parts.push(`${minutes}m`)
  }

  if (seconds > 0 || parts.length === 0) {
    parts.push(`${seconds}s`)
  }

  return parts.join(' ')
}

/**
 * Smart time formatter that chooses the best format based on context
 */
export function formatTimeAuto(
  totalSeconds: number,
  format: 'short' | 'long' | 'precise' = 'short'
): string {
  switch (format) {
    case 'short':
      return formatTimeToHumanReadable(totalSeconds)
    case 'long':
      return formatTimeFromSeconds(totalSeconds)
    case 'precise':
      return `${formatTimeFromSeconds(totalSeconds)} (${formatTimeToHumanReadable(totalSeconds)})`
    default:
      return formatTimeFromSeconds(totalSeconds)
  }
}

/**
 * Format time input as user types (auto-add colons for HH:MM:SS format)
 * This is useful for input fields that should format time as the user types
 */
export function formatTimeInput(value: string): string {
  // Remove all non-digits
  const digits = value.replace(/\D/g, '')

  // Limit to 6 digits (HHMMSS)
  const limitedDigits = digits.slice(0, 6)

  // Add colons at appropriate positions
  if (limitedDigits.length <= 2) {
    return limitedDigits
  } else if (limitedDigits.length <= 4) {
    return `${limitedDigits.slice(0, 2)}:${limitedDigits.slice(2)}`
  } else {
    return `${limitedDigits.slice(0, 2)}:${limitedDigits.slice(2, 4)}:${limitedDigits.slice(4)}`
  }
}

/**
 * Validate if a time string is in a valid format
 */
export function isValidTimeFormat(input: string): boolean {
  try {
    const seconds = parseTimeToSeconds(input)
    return seconds >= 0 && seconds < 86400 // Max 24 hours
  } catch {
    return false
  }
}

/**
 * Convert between different time formats
 */
export function convertTimeFormat(
  input: string,
  targetFormat: 'seconds' | 'hhmm' | 'hhmmss' | 'human'
): string {
  const seconds = parseTimeToSeconds(input)

  switch (targetFormat) {
    case 'seconds':
      return seconds.toString()
    case 'hhmm':
      const hours = Math.floor(seconds / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
    case 'hhmmss':
      return formatTimeFromSeconds(seconds)
    case 'human':
      return formatTimeToHumanReadable(seconds)
    default:
      return formatTimeFromSeconds(seconds)
  }
}
