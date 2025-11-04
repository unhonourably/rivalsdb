'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

interface ItemRecord {
  id: string
  name?: string
  description?: string
  long_description?: string
  summary?: string
  category?: string
  type?: string
  item_type?: string
  slot?: string
  group_name?: string
  collection?: string
  rarity?: string
  tier?: string
  quality?: string
  grade?: string
  cost_label?: string
  currency?: string
  unlock_condition?: string
  requirement?: string
  icon?: string
  image?: string
  icon_url?: string
  thumbnail?: string
  stats?: unknown
  attributes?: unknown
  effects?: unknown
  bonuses?: unknown
  passives?: unknown
  details?: unknown
  raw?: unknown
  categoryLabel?: string
  typeLabel?: string
  rarityLabel?: string
}

const toTitleCase = (input: string | undefined | null): string => {
  if (!input) return ''
  return input
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const getAssetCandidates = (path?: string): string[] => {
  if (!path) return []
  const raw = typeof path === 'string' ? path : String(path)
  if (!raw) return []
  if (raw.startsWith('http')) return [raw]
  const normalized = raw.startsWith('/') ? raw : `/${raw}`
  const candidates = new Set<string>()
  candidates.add(`https://marvelrivalsapi.com${normalized}`)
  if (normalized.startsWith('/rivals/')) {
    candidates.add(`https://marvelrivalsapi.com${normalized.replace('/rivals', '')}`)
  } else {
    candidates.add(`https://marvelrivalsapi.com/rivals${normalized}`)
  }
  candidates.add(`https://cdn.marvelrivalsapi.com${normalized}`)
  return Array.from(candidates)
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

const formatNumber = (value: unknown): string | null => {
  if (value === null || value === undefined) return null
  if (typeof value === 'number') return value.toLocaleString()
  if (typeof value === 'string') {
    const numeric = Number(value)
    if (Number.isFinite(numeric)) return numeric.toLocaleString()
    return value
  }
  return String(value)
}

const createList = (input: unknown): string[] => {
  if (!input) return []
  if (Array.isArray(input)) {
    return input
      .map(entry => {
        if (entry === null || entry === undefined) return null
        if (typeof entry === 'string' || typeof entry === 'number') return String(entry)
        if (typeof entry === 'object') {
          const record = entry as Record<string, unknown>
          const name = record.name ?? record.title ?? record.stat ?? record.type ?? record.label
          const amount = record.value ?? record.amount ?? record.description ?? record.detail ?? record.text
          if (name && amount !== undefined) return `${toTitleCase(String(name))}: ${amount}`
          if (name) return String(name)
          if (amount !== undefined) return String(amount)
          return null
        }
        return null
      })
      .filter((entry): entry is string => Boolean(entry))
  }
  if (typeof input === 'object') {
    return Object.entries(input)
      .map(([key, value]) => {
        if (value === null || value === undefined || value === '') return null
        if (typeof value === 'object') {
          if ('value' in (value as Record<string, unknown>)) {
            const inner = value as Record<string, unknown>
            if (inner.value !== null && inner.value !== undefined) return `${toTitleCase(key)}: ${inner.value}`
            return null
          }
          return null
        }
        return `${toTitleCase(key.replace(/_/g, ' '))}: ${value}`
      })
      .filter((entry): entry is string => Boolean(entry))
  }
  if (typeof input === 'string' || typeof input === 'number') return [String(input)]
  return []
}

const pageSize = 30

export default function ItemsPage() {
  const [items, setItems] = useState<ItemRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [availableCategories, setAvailableCategories] = useState<string[]>(['All'])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalResults, setTotalResults] = useState(0)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim())
    }, 300)
    return () => clearTimeout(timeout)
  }, [searchQuery])

  useEffect(() => {
    const controller = new AbortController()
    let cancelled = false

    const fetchItems = async () => {
      try {
        setLoading(true)
        setError(null)
        const params = new URLSearchParams()
        params.set('page', String(page))
        params.set('limit', String(pageSize))
        if (debouncedQuery) {
          params.set('search', debouncedQuery)
        }
        if (category !== 'All') {
          params.set('category', category)
        }
        const response = await fetch(`/api/items?${params.toString()}`, {
          signal: controller.signal
        })
        if (!response.ok) {
          throw new Error(`Failed to load items (${response.status})`)
        }
        const data = await response.json()
        const list: ItemRecord[] = Array.isArray(data?.items) ? data.items : []
        if (cancelled) return
        setItems(list.map(item => ({ ...item, id: String(item.id) })))
        const incomingTotalPages = Math.max(Number(data?.totalPages) || 1, 1)
        setTotalPages(incomingTotalPages)
        const incomingTotal = Number(data?.total) || 0
        setTotalResults(incomingTotal)
        if (page > incomingTotalPages) {
          setPage(incomingTotalPages)
        }
        if (Array.isArray(data?.categories)) {
          const normalizedSet = new Set<string>(
            data.categories
              .filter((value: unknown): value is string => typeof value === 'string' && value.trim() !== '')
              .map((entry: string) => toTitleCase(entry))
              .filter((entry: string) => entry.trim() !== '')
          )
          const normalized = Array.from(normalizedSet)
          const combined = ['All', ...normalized]
          setAvailableCategories(combined)
          if (category !== 'All' && !combined.includes(category)) {
            setCategory('All')
          }
        }
      } catch (err) {
        if (controller.signal.aborted || cancelled) return
        const message = err instanceof Error ? err.message : 'Failed to load items'
        setError(message)
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchItems()

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [debouncedQuery, category, page])

  const startRange = totalResults === 0 ? 0 : (page - 1) * pageSize + 1
  const endRange = totalResults === 0 ? 0 : Math.min(page * pageSize, totalResults)

  return (
    <div className="min-h-screen flex flex-col bg-black">
      <Navbar />
      <div className="background"></div>

      <main className="flex-1 pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-wrap items-start justify-between gap-6 mb-10">
            <div>
              <h1 className="text-4xl md:text-5xl font-light text-white mb-3">Items</h1>
              <p className="text-gray-400 max-w-2xl">
                Explore every Marvel Rivals item, including rarity, categories, and special effects.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value)
                  setPage(1)
                }}
                className="flex-1 sm:w-72 px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:border-white/30"
              />
              <select
                value={category}
                onChange={e => {
                  setCategory(e.target.value)
                  setPage(1)
                }}
                className="flex-1 sm:w-48 px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:border-white/30"
              >
                {availableCategories.map(option => (
                  <option key={option} value={option} className="text-black">
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {!loading && !error && (
            <div className="flex items-center justify-between flex-wrap gap-4 mb-8 text-sm text-gray-400">
              <div>
                {totalResults > 0 ? (
                  <span>
                    Showing {startRange}–{endRange} of {totalResults} items
                  </span>
                ) : (
                  <span>No items to display</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                  disabled={page <= 1 || loading}
                  className="px-3 py-2 rounded-lg border border-white/10 text-white/80 hover:text-white hover:border-white/30 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Prev
                </button>
                <div className="px-3 py-2 rounded-lg border border-white/10 text-white/80">
                  Page {page} of {totalPages}
                </div>
                <button
                  type="button"
                  onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={page >= totalPages || loading || totalResults === 0}
                  className="px-3 py-2 rounded-lg border border-white/10 text-white/80 hover:text-white hover:border-white/30 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}

          {loading && (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
              <p className="text-gray-400 mt-4">This may take awhile.. (there are a lot of items)</p>
            </div>
          )}

          {error && !loading && (
            <div className="border border-red-500/30 bg-red-500/10 rounded-2xl p-6 text-center text-red-300">
              {error}
            </div>
          )}

          {!loading && !error && items.length > 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((item, index) => {
                  const iconCandidates = getAssetCandidates(
                    (item.icon as string) ||
                      (item.image as string) ||
                      (item.icon_url as string) ||
                      (item.thumbnail as string)
                  )
                  const typeLabel = item.typeLabel ?? toTitleCase((item.type as string) || (item.item_type as string) || (item.slot as string))
                  const categoryLabel = item.categoryLabel ?? toTitleCase((item.category as string) || (item.group_name as string) || (item.collection as string) || (item.slot as string))
                  const rarityLabel = item.rarityLabel ?? toTitleCase((item.rarity as string) || (item.tier as string) || (item.quality as string) || (item.grade as string))
                  const rawSource = item.raw && typeof item.raw === 'object' ? (item.raw as Record<string, unknown>) : {}
                  const rawCostValue = formatNumber(
                    rawSource['cost'] ??
                      rawSource['price'] ??
                      rawSource['shop_price'] ??
                      rawSource['purchase_cost'] ??
                      rawSource['credit_cost']
                  )
                  const costValue = item.cost_label && item.cost_label.trim() !== '' ? item.cost_label : rawCostValue ?? undefined
                  const rawCurrency = rawSource['currency']
                  const currencyValue = typeof item.currency === 'string' && item.currency.trim() !== ''
                    ? item.currency
                    : typeof rawCurrency === 'string' && rawCurrency.trim() !== ''
                      ? rawCurrency
                      : undefined
                  const rawUnlock = rawSource['unlock_condition'] ?? rawSource['requirement']
                  const unlockValue = typeof item.unlock_condition === 'string' && item.unlock_condition.trim() !== ''
                    ? item.unlock_condition
                    : typeof item.requirement === 'string' && item.requirement.trim() !== ''
                      ? item.requirement
                      : typeof rawUnlock === 'string' && rawUnlock.trim() !== ''
                        ? rawUnlock
                        : undefined
                  const tags = [categoryLabel, rarityLabel].filter(Boolean)
                  const detailEntries = [
                    { label: 'Type', value: typeLabel },
                    { label: 'Category', value: categoryLabel },
                    { label: 'Rarity', value: rarityLabel },
                    { label: 'Cost', value: costValue },
                    { label: 'Currency', value: currencyValue },
                    { label: 'Unlock', value: unlockValue }
                  ].filter(entry => Boolean(entry.value))
                  const sections = [
                    { title: 'Stats', lines: createList(item.stats) },
                    { title: 'Attributes', lines: createList(item.attributes) },
                    { title: 'Effects', lines: createList(item.effects) },
                    { title: 'Bonuses', lines: createList(item.bonuses) },
                    { title: 'Passives', lines: createList(item.passives) },
                    { title: 'Details', lines: createList(item.details) }
                  ].filter(section => section.lines.length > 0)

                  return (
                    <div
                      key={item.id ?? item.name}
                      className="border border-white/10 bg-white/[0.02] rounded-2xl p-6 flex flex-col gap-4 hover:border-white/20 transition-all opacity-0 animate-[fadeInUp_0.35s_ease_forwards]"
                      style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
                    >
                      <div className="flex items-start gap-4">
                        {iconCandidates.length > 0 && (
                          <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-white/10">
                            <SmartImage paths={iconCandidates} alt={item.name ?? 'Item'} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h2 className="text-lg font-semibold text-white truncate" title={item.name ?? ''}>
                            {item.name ?? 'Unknown Item'}
                          </h2>
                          {(item.description || item.long_description || item.summary) && (
                            <p className="text-sm text-gray-400 line-clamp-3">
                              {(item.description as string) || (item.long_description as string) || (item.summary as string)}
                            </p>
                          )}
                        </div>
                      </div>

                      {tags.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.3em] text-gray-500">
                          {tags.map(tag => (
                            <span key={tag} className="px-2 py-0.5 rounded-full border border-white/10 bg-white/5 text-white/80">
                              {tag}
                            </span>
                          ))}
                          {costValue && !tags.includes(costValue) && (
                            <span className="px-2 py-0.5 rounded-full border border-white/10 bg-white/5 text-white/80">
                              {costValue}
                            </span>
                          )}
                        </div>
                      )}

                      {detailEntries.length > 0 && (
                        <div className="grid grid-cols-1 gap-2 text-sm text-gray-300">
                          {detailEntries.map(entry => (
                            <div key={entry.label} className="flex justify-between gap-3">
                              <span className="text-gray-400 uppercase tracking-[0.2em] text-xs">{entry.label}</span>
                              <span className="text-white text-sm text-right break-words max-w-[60%]">{entry.value}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {sections.length > 0 && (
                        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-4 max-h-60 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                          {sections.map(section => (
                            <div key={section.title} className="space-y-2">
                              <div className="text-xs uppercase tracking-[0.35em] text-gray-500">{section.title}</div>
                              <ul className="space-y-1 text-sm text-gray-300">
                                {section.lines.map((line, index) => (
                                  <li key={`${section.title}-${index}`}>{line}</li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}

              </div>

            </>
          )}

          {!loading && !error && items.length === 0 && (
            <div className="border border-white/10 bg-white/[0.02] rounded-2xl p-10 text-center text-gray-400">
              No items match the current filters. Sync data via the admin page if needed.
            </div>
          )}
        </div>
      </main>

      <Footer />
      <style jsx>{`
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background-color: rgba(255,255,255,0.2);
          border-radius: 9999px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translate3d(0, 16px, 0);
          }
          to {
            opacity: 1;
            transform: translate3d(0, 0, 0);
          }
        }
      `}</style>
    </div>
  )
}