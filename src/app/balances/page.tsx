'use client'

import { useEffect, useMemo, useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

const API_KEY = '188d3cd06e7db493dbd00811774d009528e8516c560a6b3e2751c2e411c40f9f'
const API_DOMAIN = 'https://marvelrivalsapi.com'
const API_BASE = `${API_DOMAIN}/api/v1`

interface BalancesResponse {
  total_patches?: number
  formatted_patches?: Array<{
    patchTitle?: string
    patchDate?: string
    patchType?: string
    previewText?: string
    imagePath?: string
    fullContent?: string
    htmlContent?: string
  }>
}

interface BalanceEntry {
  id: string
  title: string
  dateLabel?: string
  preview?: string
  content?: string
  html?: string
  imagePaths: string[]
}

const getAssetCandidates = (path?: string): string[] => {
  if (!path) return []
  const raw = typeof path === 'string' ? path : String(path)
  if (!raw) return []
  if (raw.startsWith('http')) return [raw]
  const normalized = raw.startsWith('/') ? raw : `/${raw}`
  const candidates = new Set<string>()
  candidates.add(`${API_DOMAIN}${normalized}`)
  if (normalized.startsWith('/rivals/')) {
    candidates.add(`${API_DOMAIN}${normalized.replace('/rivals', '')}`)
  } else {
    candidates.add(`${API_DOMAIN}/rivals${normalized}`)
  }
  candidates.add(`https://cdn.marvelrivalsapi.com${normalized}`)
  return Array.from(candidates)
}

const formatDateLabel = (value?: string | number): string | undefined => {
  if (!value) return undefined
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    if (typeof value === 'string' && value.trim()) return value
    return undefined
  }
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

const SmartImage: React.FC<{ paths: string[]; alt: string; className?: string }> = ({ paths, alt, className }) => {
  const [attempt, setAttempt] = useState(0)
  const src = paths[attempt]
  if (!src) return null
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      onError={() => {
        if (attempt < paths.length - 1) {
          setAttempt(prev => prev + 1)
        }
      }}
      style={{ opacity: 0, animation: 'fadeIn 0.3s forwards' }}
    />
  )
}

export default function BalancesPage() {
  const [entries, setEntries] = useState<BalanceEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedEntry, setSelectedEntry] = useState<BalanceEntry | null>(null)

  const fetchData = async (signal?: AbortSignal) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`${API_BASE}/balances?page=1&limit=50`, {
        headers: { 'x-api-key': API_KEY },
        signal
      })
      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again shortly.')
        }
        throw new Error(`Failed to load balances (${response.status})`)
      }
      const data: BalancesResponse = await response.json()
      const patches = Array.isArray(data?.formatted_patches) ? data.formatted_patches : []
      setEntries(
        patches.map((patch, index) => ({
          id: `balance-${patch.patchTitle ?? index}`,
          title: patch.patchTitle ?? patch.patchType ?? 'Balance Update',
          dateLabel: formatDateLabel(patch.patchDate),
          preview: patch.previewText,
          content: patch.fullContent,
          html: patch.htmlContent,
          imagePaths: getAssetCandidates(patch.imagePath)
        }))
      )
    } catch (err) {
      if (signal?.aborted) return
      setError(err instanceof Error ? err.message : 'Failed to load balances')
    } finally {
      if (!signal?.aborted) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    const controller = new AbortController()
    fetchData(controller.signal)
    return () => {
      controller.abort()
    }
  }, [])

  const handleReload = () => {
    fetchData()
  }

  const modalContent = useMemo(() => {
    if (!selectedEntry) return null
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedEntry(null)}></div>
        <div className="relative w-full max-w-3xl max-h-[85vh] rounded-2xl border border-white/10 bg-black/95 shadow-2xl animate-[fadeIn_0.3s_ease]">
          <div className="flex flex-col sm:flex-row h-full overflow-hidden">
            {selectedEntry.imagePaths.length > 0 && (
              <div className="sm:w-1/3 border-b sm:border-b-0 sm:border-r border-white/10 max-h-60 sm:max-h-full overflow-hidden">
                <SmartImage paths={selectedEntry.imagePaths} alt={selectedEntry.title} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-1 p-6 overflow-y-auto">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.3em] text-gray-400">Balances</div>
                  <h2 className="text-2xl font-light text-white">{selectedEntry.title}</h2>
                  {selectedEntry.dateLabel && <p className="text-sm text-gray-400 mt-1">{selectedEntry.dateLabel}</p>}
                </div>
                <button type="button" onClick={() => setSelectedEntry(null)} className="text-gray-400 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {selectedEntry.preview && <p className="text-gray-300 mb-4">{selectedEntry.preview}</p>}
              {selectedEntry.html ? (
                <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: selectedEntry.html }} />
              ) : (
                <p className="text-gray-200 whitespace-pre-line">{selectedEntry.content ?? 'No additional details available.'}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }, [selectedEntry])

  return (
    <div className="min-h-screen flex flex-col bg-black">
      <Navbar />
      <div className="background"></div>

      <main className="flex-1 pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-wrap items-start justify-between gap-6 mb-12">
            <div>
              <h1 className="text-4xl md:text-5xl font-light text-white mb-3">Balances</h1>
              <p className="text-gray-400 max-w-3xl">Track hero and gameplay tuning changes as they land in Marvel Rivals.</p>
            </div>
            <button
              type="button"
              onClick={handleReload}
              className="px-4 py-2 rounded-lg border border-white/15 bg-white/5 text-sm text-white hover:bg-white/10 transition-colors"
              disabled={loading}
            >
              {loading ? 'Reloading…' : 'Reload'}
            </button>
          </div>

          {loading && (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
              <p className="text-gray-400 mt-4">Fetching balance updates...</p>
            </div>
          )}

          {error && !loading && (
            <div className="border border-red-500/30 bg-red-500/10 rounded-2xl p-6 text-center text-red-300">{error}</div>
          )}

          {!loading && !error && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {entries.map(entry => (
                <div key={entry.id} className="group border border-white/10 bg-white/[0.02] rounded-2xl p-6 flex flex-col gap-4 hover:border-white/20 transition-all">
                  {entry.imagePaths.length > 0 && (
                    <div className="relative w-full h-40 rounded-xl overflow-hidden border border-white/10">
                      <SmartImage paths={entry.imagePaths} alt={entry.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1 flex flex-col">
                    <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-gray-500">
                      <span>Balances</span>
                      {entry.dateLabel && <span>{entry.dateLabel}</span>}
                    </div>
                    <h2 className="text-lg font-semibold text-white mt-2 mb-2 leading-snug">{entry.title}</h2>
                    {entry.preview && <p className="text-sm text-gray-400 flex-1">{entry.preview}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedEntry(entry)}
                    className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white hover:bg-white/10 transition-colors"
                  >
                    View Details
                  </button>
                </div>
              ))}

              {entries.length === 0 && (
                <div className="col-span-full text-center text-gray-400 py-20 border border-white/10 bg-white/[0.02] rounded-2xl">
                  No balance updates available.
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />

      {modalContent}
    </div>
  )
}

