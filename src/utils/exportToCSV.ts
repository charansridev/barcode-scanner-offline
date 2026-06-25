import type { SavedItem } from '../App'

/**
 * Formats a timestamp into YYYY-MM-DD HH:mm:ss for the CSV
 */
function formatTimestampForCsv(ts: number): string {
  const d = new Date(ts)
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

/**
 * Escapes a string for CSV by wrapping in quotes and escaping inner quotes
 */
function escapeCsv(str: string): string {
  if (str === null || str === undefined) return '""'
  const stringified = String(str)
  // If string contains quotes, commas, or newlines, wrap in quotes and escape inner quotes
  if (/[",\n\r]/.test(stringified)) {
    return `"${stringified.replace(/"/g, '""')}"`
  }
  return stringified
}

/**
 * Converts a list of SavedItems to a CSV string and triggers a native download
 */
export function exportItemsToCsv(items: SavedItem[], filename = 'inventory_report.csv') {
  if (!items || items.length === 0) return

  // Define headers
  const headers = ['ID', 'Date/Time', 'Product Name', 'Batch Number']

  // Create rows
  const rows = items.map((item) => {
    return [
      escapeCsv(item.id),
      escapeCsv(formatTimestampForCsv(item.timestamp)),
      escapeCsv(item.productName),
      escapeCsv(item.batchNo),
    ].join(',')
  })

  // Combine headers and rows
  const csvContent = [headers.join(','), ...rows].join('\n')

  // Create a Blob from the CSV string
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  
  // Create a temporary link to trigger the download
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  // Clean up the object URL
  setTimeout(() => URL.revokeObjectURL(url), 100)
}
