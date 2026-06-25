import { useState } from 'react'
import type { SavedItem } from '../App'
import { exportItemsToCsv } from '../utils/exportToCSV'

interface Props {
  items: SavedItem[]
  onDeleteItem: (id: string) => void
  onBack: () => void
}

export default function HistoryScreen({ items, onDeleteItem, onBack }: Props) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = (id: string) => {
    setDeletingId(id)
    // Brief animation delay before actual removal
    setTimeout(() => {
      onDeleteItem(id)
      setDeletingId(null)
    }, 300)
  }

  const formatDate = (ts: number) => {
    const d = new Date(ts)
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatTime = (ts: number) => {
    const d = new Date(ts)
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="min-h-screen bg-surface-950 flex flex-col animate-fade-in">
      {/* ── Header ───────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-surface-950/80 border-b border-white/5">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 sm:px-6 py-3">
          {/* Back to Scanner */}
          <button
            id="btn-back-to-scanner"
            onClick={onBack}
            className="btn-press flex items-center gap-2 px-4 py-2 rounded-xl
                       bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400
                       text-sm font-bold text-white shadow-glow hover:shadow-glow-lg
                       transition-all duration-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to Scanner
          </button>

          {/* Title, Count, and Export */}
          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <h1 className="text-base font-bold text-white tracking-tight">
                Scan History
              </h1>
              <p className="text-[10px] font-medium text-surface-400 tracking-widest uppercase mt-0.5">
                {items.length} record{items.length !== 1 ? 's' : ''}
              </p>
            </div>
            
            {items.length > 0 && (
              <button
                id="btn-export-csv"
                onClick={() => exportItemsToCsv(items)}
                className="btn-press flex items-center gap-2 px-3 py-2 rounded-xl
                           bg-surface-800/80 hover:bg-surface-700/80 border border-white/10
                           text-xs font-semibold text-white transition-all duration-200"
                title="Export to CSV"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4 text-primary-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                <span className="hidden sm:inline">Export</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── Content ──────────────────────────────────────────── */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-5">
        {items.length === 0 ? (
          /* ── Empty State ──────────────────────────────────── */
          <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
            <div className="w-20 h-20 rounded-2xl bg-surface-800/80 border border-white/5 flex items-center justify-center mb-5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-9 h-9 text-surface-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <p className="text-lg font-bold text-surface-300">
              No records yet
            </p>
            <p className="text-sm text-surface-500 mt-1.5 max-w-[280px]">
              Scanned products will appear here. Go back to the scanner to capture your first item.
            </p>
            <button
              onClick={onBack}
              className="btn-press mt-6 px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-sm font-semibold text-white shadow-glow transition-colors"
            >
              Start Scanning
            </button>
          </div>
        ) : (
          /* ── Data Table ───────────────────────────────────── */
          <div className="animate-slide-up">
            {/* Desktop Table */}
            <div className="hidden sm:block rounded-2xl border border-white/5 overflow-hidden bg-surface-900/50 backdrop-blur-sm">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/5 bg-surface-800/40">
                    <th className="px-5 py-3.5 text-[11px] font-bold text-surface-400 uppercase tracking-widest">
                      Date / Time
                    </th>
                    <th className="px-5 py-3.5 text-[11px] font-bold text-surface-400 uppercase tracking-widest">
                      Product Name
                    </th>
                    <th className="px-5 py-3.5 text-[11px] font-bold text-surface-400 uppercase tracking-widest">
                      Batch Number
                    </th>
                    <th className="px-5 py-3.5 text-[11px] font-bold text-surface-400 uppercase tracking-widest text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {items.map((item, index) => (
                    <tr
                      key={item.id}
                      className={`group transition-all duration-300 ${
                        deletingId === item.id
                          ? 'opacity-0 scale-95 origin-left'
                          : 'hover:bg-white/[0.02]'
                      }`}
                      style={{
                        animation: `fadeIn 0.3s ease-out ${index * 0.03}s both`,
                      }}
                    >
                      {/* Date/Time */}
                      <td className="px-5 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-white">
                            {formatDate(item.timestamp)}
                          </span>
                          <span className="text-xs text-surface-500 mt-0.5">
                            {formatTime(item.timestamp)}
                          </span>
                        </div>
                      </td>

                      {/* Product Name */}
                      <td className="px-5 py-4">
                        <span className="text-sm font-semibold text-white">
                          {item.productName}
                        </span>
                      </td>

                      {/* Batch Number */}
                      <td className="px-5 py-4">
                        <span className="inline-flex px-2.5 py-1 rounded-lg bg-primary-500/10 text-xs font-mono font-semibold text-primary-400 border border-primary-500/10">
                          {item.batchNo || '—'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <button
                          id={`btn-delete-${item.id}`}
                          onClick={() => handleDelete(item.id)}
                          disabled={deletingId === item.id}
                          className="btn-press inline-flex items-center justify-center w-9 h-9 rounded-xl
                                     bg-transparent hover:bg-red-500/10 border border-transparent hover:border-red-500/20
                                     text-surface-500 hover:text-red-400
                                     transition-all duration-200 disabled:opacity-50"
                          aria-label={`Delete ${item.productName}`}
                          title="Delete item"
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
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                            <line x1="10" y1="11" x2="10" y2="17" />
                            <line x1="14" y1="11" x2="14" y2="17" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List (< sm breakpoint) */}
            <div className="sm:hidden space-y-2.5">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className={`rounded-xl border border-white/5 bg-surface-900/50 p-4 transition-all duration-300 ${
                    deletingId === item.id
                      ? 'opacity-0 scale-95'
                      : ''
                  }`}
                  style={{
                    animation: `fadeIn 0.3s ease-out ${index * 0.04}s both`,
                  }}
                >
                  {/* Top row: date + delete */}
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-1.5 text-xs text-surface-400">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-3.5 h-3.5 text-surface-500"
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
                      <span className="font-medium">
                        {formatDate(item.timestamp)} · {formatTime(item.timestamp)}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                      className="btn-press w-8 h-8 rounded-lg flex items-center justify-center
                                 bg-transparent hover:bg-red-500/10 border border-transparent hover:border-red-500/20
                                 text-surface-500 hover:text-red-400 transition-all disabled:opacity-50"
                      aria-label={`Delete ${item.productName}`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-3.5 h-3.5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        <line x1="10" y1="11" x2="10" y2="17" />
                        <line x1="14" y1="11" x2="14" y2="17" />
                      </svg>
                    </button>
                  </div>

                  {/* Product name */}
                  <p className="text-sm font-semibold text-white truncate">
                    {item.productName}
                  </p>

                  {/* Batch number */}
                  {item.batchNo && (
                    <span className="inline-flex mt-2 px-2.5 py-1 rounded-lg bg-primary-500/10 text-[11px] font-mono font-semibold text-primary-400 border border-primary-500/10">
                      {item.batchNo}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ── Footer Summary ───────────────────────────────────── */}
      {items.length > 0 && (
        <footer className="border-t border-white/5 bg-surface-950/80 backdrop-blur-xl">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
            <p className="text-xs text-surface-500">
              Showing <span className="font-semibold text-surface-300">{items.length}</span> saved record{items.length !== 1 ? 's' : ''}
            </p>
            <p className="text-[10px] text-surface-600">
              Stored locally on this device
            </p>
          </div>
        </footer>
      )}
    </div>
  )
}
