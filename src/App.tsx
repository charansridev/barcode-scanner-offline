import { useState, useCallback, useEffect } from 'react'
import CameraScanner from './components/CameraScanner'
import HistoryScreen from './components/HistoryScreen'

export interface SavedItem {
  id: string
  productName: string
  batchNo: string
  mfgDate?: string
  expDate?: string
  timestamp: number
  thumbnail: string | null
}

const STORAGE_KEY = 'scanvault_items'

/* ── localStorage helpers ──────────────────────────────────── */
function loadItems(): SavedItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function persistItems(items: SavedItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch (err) {
    console.error('Failed to persist items:', err)
  }
}

/* ── App ───────────────────────────────────────────────────── */
type Screen = 'scanner' | 'history'

export default function App() {
  const [screen, setScreen] = useState<Screen>('scanner')
  const [savedItems, setSavedItems] = useState<SavedItem[]>(loadItems)

  // Persist whenever savedItems changes
  useEffect(() => {
    persistItems(savedItems)
  }, [savedItems])

  const handleSaveItem = useCallback((item: SavedItem) => {
    setSavedItems((prev) => [item, ...prev])
  }, [])

  const handleDeleteItem = useCallback((id: string) => {
    setSavedItems((prev) => prev.filter((item) => item.id !== id))
  }, [])

  /* ── Scanner Screen ──────────────────────────────────────── */
  if (screen === 'scanner') {
    return (
      <div className="min-h-screen bg-surface-950 flex flex-col">
        {/* ── Header ─────────────────────────────────────── */}
        <header
          id="app-header"
          className="sticky top-0 z-50 backdrop-blur-xl bg-surface-950/80 border-b border-white/5"
        >
          <div className="max-w-lg mx-auto flex items-center justify-between px-4 py-3">
            {/* Title */}
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-glow">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4.5 h-4.5 text-white"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                  <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                  <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                  <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                  <line x1="7" y1="12" x2="17" y2="12" />
                </svg>
              </div>
              <div>
                <h1 className="text-base font-bold tracking-tight text-white leading-none">
                  ScanVault
                </h1>
                <p className="text-[10px] font-medium text-surface-400 tracking-widest uppercase mt-0.5">
                  Product Scanner
                </p>
              </div>
            </div>

            {/* View History Button */}
            <button
              id="btn-view-history"
              onClick={() => setScreen('history')}
              className="btn-press relative flex items-center gap-2 px-4 py-2 rounded-xl 
                         bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary-500/30
                         text-sm font-medium text-surface-300 hover:text-white
                         transition-all duration-200"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              View History
              {savedItems.length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 rounded-full bg-primary-500 text-[10px] font-bold text-white shadow-glow">
                  {savedItems.length}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* ── Main Content ───────────────────────────────── */}
        <main className="flex-1 flex flex-col">
          <CameraScanner onSaveItem={handleSaveItem} />
        </main>
      </div>
    )
  }

  /* ── History Screen ──────────────────────────────────────── */
  return (
    <HistoryScreen
      items={savedItems}
      onDeleteItem={handleDeleteItem}
      onBack={() => setScreen('scanner')}
    />
  )
}
