/**
 * Normalize DOB from various Excel formats to DD-MM-YYYY
 * Handles:
 * - Excel serial dates (numbers)
 * - Date objects
 * - String formats like "25-Jan-2004", "14-03-2001"
 */
export function normalizeDOB(value: any): string {
  if (!value) return ""

  try {
    // Handle Excel serial date (number)
    if (typeof value === "number") {
      // Excel serial date starts from 1900-01-01 (serial 1)
      // JavaScript Date starts from 1970-01-01
      // Excel incorrectly treats 1900 as a leap year, so we need to account for that
      const excelEpoch = new Date(1899, 11, 30) // December 30, 1899
      const date = new Date(excelEpoch.getTime() + value * 86400000) // 86400000 ms in a day
      return formatToDDMMYYYY(date)
    }

    // Handle Date object
    if (value instanceof Date) {
      return formatToDDMMYYYY(value)
    }

    // Handle string
    if (typeof value === "string") {
      const trimmed = value.trim()

      // Check if already in DD-MM-YYYY format
      if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) {
        return trimmed
      }

      // Try parsing as ISO date, various formats
      const parsed = new Date(trimmed)
      if (!isNaN(parsed.getTime())) {
        return formatToDDMMYYYY(parsed)
      }

      // Try DD/MM/YYYY or D/M/YYYY format
      const slashMatch = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
      if (slashMatch) {
        const [, day, month, year] = slashMatch
        return `${day.padStart(2, "0")}-${month.padStart(2, "0")}-${year}`
      }

      // Return as-is if we can't parse
      return trimmed
    }

    return String(value)
  } catch (error) {
    console.error("[v0] Error normalizing DOB:", error, value)
    return String(value)
  }
}

/**
 * Format a Date object to DD-MM-YYYY
 */
function formatToDDMMYYYY(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0")
  const month = String(date.getMonth() + 1).padStart(2, "0") // Months are 0-indexed
  const year = date.getFullYear()
  return `${day}-${month}-${year}`
}

/**
 * Format DOB for display as DD MMM YYYY (e.g., "04 Apr 2009")
 * Accepts various input formats that normalizeDOB can handle
 */
export function formatDOBForDisplay(value: any): string {
  if (!value) return ""

  try {
    // First normalize the DOB to DD-MM-YYYY format
    const normalized = normalizeDOB(value)
    if (!normalized) return ""

    // Parse DD-MM-YYYY format
    const parts = normalized.match(/^(\d{2})-(\d{2})-(\d{4})$/)
    if (!parts) return normalized // Return as-is if we can't parse

    const [, day, month, year] = parts
    const monthIndex = parseInt(month, 10) - 1
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    
    if (monthIndex < 0 || monthIndex > 11) return normalized // Invalid month
    
    return `${day} ${monthNames[monthIndex]} ${year}`
  } catch (error) {
    console.error("[v0] Error formatting DOB for display:", error, value)
    return String(value)
  }
}
