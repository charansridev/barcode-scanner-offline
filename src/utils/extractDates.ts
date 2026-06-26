export interface DateExtractionResult {
  date: string
  confidence: 'high' | 'medium' | 'low'
}

function cleanDateString(dateStr: string): string {
  // Remove trailing/leading punctuation
  return dateStr.replace(/^[^\w\d]+|[^\w\d]+$/g, '').trim()
}

export function extractMfgDate(lines: string[]): DateExtractionResult {
  // Match patterns like: "Mfg. Dt. : APR-26", "MFG: 10/24", "PKD 05/2023"
  const mfgRegex = /(?:mfg|pkd|mfd|packed|manufacturing)[\s\.]*(?:dt|date)?[\s\.\:\-]*([A-Za-z]{3}[\s\-\/]*\d{2,4}|\d{2,4}[\s\-\/]*[A-Za-z]{3}|\d{1,2}[\s\-\/\.]\d{2,4})/i

  for (const line of lines) {
    const match = line.match(mfgRegex)
    if (match && match[1]) {
      return {
        date: cleanDateString(match[1]),
        confidence: 'high'
      }
    }
  }

  // Fallback: look for generic dates if preceded by a line with just "Mfg"
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase()
    if (line.includes('mfg') || line.includes('pkd') || line.includes('mfd')) {
      const nextLine = lines[i + 1]
      if (nextLine) {
        const dateMatch = nextLine.match(/([A-Za-z]{3}[\s\-\/]*\d{2,4}|\d{1,2}[\s\-\/\.]\d{2,4})/)
        if (dateMatch && dateMatch[1]) {
          return {
            date: cleanDateString(dateMatch[1]),
            confidence: 'medium'
          }
        }
      }
    }
  }

  return { date: '', confidence: 'low' }
}

export function extractExpDate(lines: string[]): DateExtractionResult {
  // Match patterns like: "Exp. Dt. : MAR-30", "EXP: 10/25", "Best Before 12/24", "USE BY 01-2025"
  const expRegex = /(?:exp|expiry|best before|use by)[\s\.]*(?:dt|date)?[\s\.\:\-]*([A-Za-z]{3}[\s\-\/]*\d{2,4}|\d{2,4}[\s\-\/]*[A-Za-z]{3}|\d{1,2}[\s\-\/\.]\d{2,4})/i

  for (const line of lines) {
    const match = line.match(expRegex)
    if (match && match[1]) {
      return {
        date: cleanDateString(match[1]),
        confidence: 'high'
      }
    }
  }

  // Fallback: look for generic dates if preceded by a line with just "Exp"
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase()
    if (line.includes('exp') || line.includes('best before') || line.includes('use by')) {
      const nextLine = lines[i + 1]
      if (nextLine) {
        const dateMatch = nextLine.match(/([A-Za-z]{3}[\s\-\/]*\d{2,4}|\d{1,2}[\s\-\/\.]\d{2,4})/)
        if (dateMatch && dateMatch[1]) {
          return {
            date: cleanDateString(dateMatch[1]),
            confidence: 'medium'
          }
        }
      }
    }
  }

  return { date: '', confidence: 'low' }
}
