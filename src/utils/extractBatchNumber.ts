/**
 * extractBatchNumber.ts
 *
 * Extracts a batch/lot number from raw OCR text using a layered regex strategy.
 *
 * Strategy (evaluated in priority order):
 *   1. Keyword-prefixed patterns — match identifiers following known labels
 *      like "Batch No", "B.No", "Lot No", "Batch #", etc.
 *   2. Standalone alphanumeric blocks — match clean sequences that *look* like
 *      batch codes (mixed letters+digits, or long digit-only runs) while
 *      filtering out noise like dates, prices, and common English words.
 */

// ────────────────────────────────────────────────────────────────────────────
// Noise filters — patterns we explicitly reject as false positives
// ────────────────────────────────────────────────────────────────────────────

/** Date-like: 01/2025, 2025-01-31, 31.01.2025, Jan 2025, etc. */
const DATE_RE =
  /^(?:\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}|\d{1,2}[\/\-\.]\d{2,4}|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*[\s.\-]*\d{2,4})$/i

/** Price-like: ₹120, $9.99, Rs.500, MRP 120.00 */
const PRICE_RE =
  /^(?:[₹$€£]|rs\.?|mrp\.?)\s*\d/i

/** Pure decimal number: 12.50, 0.5, 100.00 */
const DECIMAL_RE = /^\d+\.\d{1,2}$/

/** Very short number-only strings (≤ 3 digits) — too ambiguous */
const SHORT_NUM_RE = /^\d{1,3}$/

/** Common noise words that OCR picks up */
const NOISE_WORDS = new Set([
  'the', 'and', 'for', 'use', 'with', 'net', 'wt', 'weight', 'qty',
  'price', 'date', 'exp', 'mfg', 'mfd', 'pack', 'size', 'vol',
  'ingredients', 'contains', 'warning', 'storage', 'store', 'best',
  'before', 'after', 'opening', 'product', 'name', 'brand', 'made',
  'india', 'usa', 'china',
])

function isNoise(candidate: string): boolean {
  const lower = candidate.toLowerCase().trim()
  if (DATE_RE.test(lower)) return true
  if (PRICE_RE.test(lower)) return true
  if (DECIMAL_RE.test(lower)) return true
  if (SHORT_NUM_RE.test(lower)) return true
  if (NOISE_WORDS.has(lower)) return true
  // Purely alphabetic strings shorter than 4 chars (e.g. "mg", "ml", "gm")
  if (/^[a-zA-Z]{1,3}$/.test(candidate)) return true
  return false
}

// ────────────────────────────────────────────────────────────────────────────
// Strategy 1: Keyword-prefixed extraction
// ────────────────────────────────────────────────────────────────────────────

/**
 * Matches lines like:
 *   "Batch No. ABC123"  "B.No: XY-456"  "Lot# 7890AB"
 *   "Batch Number: WX/2025/001"  "BATCH NO ABC-1234"
 *   "Lot : L2025-0042"
 *
 * The keyword group is case-insensitive and allows optional separators
 * (colon, hash, dot, dash, whitespace) between label and value.
 */
const KEYWORD_RE =
  /(?:batch|b\.?\s*no|lot)\s*(?:no\.?|number|#|:|\.)?\s*[:\-#.\s]*\s*([A-Za-z0-9][A-Za-z0-9\-\/\\.]{2,})/i

function extractByKeyword(text: string): string | null {
  const match = text.match(KEYWORD_RE)
  if (match && match[1]) {
    const candidate = match[1].trim().replace(/[.\s]+$/, '') // strip trailing dots/spaces
    if (!isNoise(candidate)) return candidate
  }

  // Try line-by-line for multi-line OCR output — keyword at line start or end
  const lines = text.split('\n')
  for (const line of lines) {
    const m = line.match(KEYWORD_RE)
    if (m && m[1]) {
      const candidate = m[1].trim().replace(/[.\s]+$/, '')
      if (!isNoise(candidate)) return candidate
    }
  }

  return null
}

// ────────────────────────────────────────────────────────────────────────────
// Strategy 2: Standalone alphanumeric block detection
// ────────────────────────────────────────────────────────────────────────────

/**
 * Looks for tokens that resemble batch codes:
 *   - Mixed alpha + numeric (e.g. "AB1234", "X5Y-2025", "LOT2025A")
 *   - Long digit-only strings ≥ 4 chars (e.g. "20250142")
 *   - Alphanumeric with separators like dashes/slashes (e.g. "WX/2025/001")
 *
 * Must be at least 4 characters long to reduce false positives.
 */
const BATCH_LIKE_RE = /\b([A-Za-z]{1,5}\d[A-Za-z0-9\-\/\\.]{2,}|\d{4,}[A-Za-z][A-Za-z0-9\-\/\\.]*|[A-Za-z0-9]{2,}[\-\/][A-Za-z0-9\-\/\\.]{2,})\b/g

function extractByPattern(text: string): string | null {
  const candidates: string[] = []

  // Scan each line for batch-like tokens
  const lines = text.split('\n')
  for (const line of lines) {
    let match: RegExpExecArray | null
    BATCH_LIKE_RE.lastIndex = 0
    while ((match = BATCH_LIKE_RE.exec(line)) !== null) {
      const candidate = match[1].trim().replace(/[.\s]+$/, '')
      if (candidate.length >= 4 && !isNoise(candidate)) {
        candidates.push(candidate)
      }
    }
  }

  if (candidates.length === 0) return null

  // Heuristic: prefer candidates with mixed alpha+digits, longer is better
  candidates.sort((a, b) => {
    const mixedA = /[a-zA-Z]/.test(a) && /\d/.test(a) ? 1 : 0
    const mixedB = /[a-zA-Z]/.test(b) && /\d/.test(b) ? 1 : 0
    if (mixedB !== mixedA) return mixedB - mixedA // mixed first
    return b.length - a.length // longer first
  })

  return candidates[0]
}

// ────────────────────────────────────────────────────────────────────────────
// Public API
// ────────────────────────────────────────────────────────────────────────────

export interface BatchExtractionResult {
  /** The extracted batch number, or null if nothing found */
  batchNo: string | null
  /** Which strategy found the match */
  source: 'keyword' | 'pattern' | 'none'
  /** Confidence hint: 'high' for keyword matches, 'medium' for pattern matches */
  confidence: 'high' | 'medium' | 'low'
}

/**
 * Extract a batch/lot number from raw OCR text.
 *
 * @param rawText - The full OCR text output from Tesseract.js
 * @returns The extraction result with the batch number and metadata
 */
export function extractBatchNumber(rawText: string): BatchExtractionResult {
  if (!rawText || !rawText.trim()) {
    return { batchNo: null, source: 'none', confidence: 'low' }
  }

  // Normalize: collapse multiple whitespace, normalize common OCR artifacts
  const normalized = rawText
    .replace(/\r\n/g, '\n')
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .replace(/\s{2,}/g, ' ')

  // Strategy 1: keyword-prefixed (high confidence)
  const keywordResult = extractByKeyword(normalized)
  if (keywordResult) {
    return { batchNo: keywordResult, source: 'keyword', confidence: 'high' }
  }

  // Strategy 2: standalone pattern matching (medium confidence)
  const patternResult = extractByPattern(normalized)
  if (patternResult) {
    return { batchNo: patternResult, source: 'pattern', confidence: 'medium' }
  }

  return { batchNo: null, source: 'none', confidence: 'low' }
}
