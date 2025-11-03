'use client'

import { useEffect, useMemo, useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

const API_KEY = '188d3cd06e7db493dbd00811774d009528e8516c560a6b3e2751c2e411c40f9f'
const API_BASE = 'https://marvelrivalsapi.com/api/v1'
const ITEMS_PER_PAGE = 30

interface ItemRecord {
  id?: number | string
  name?: string
  description?: string
  long_description?: string
  summary?: string
  category?: string
  type?: string
  item_type?: string
  slot?: string
  group?: string
  collection?: string
  rarity?: string
  tier?: string
  quality?: string
  grade?: string
  icon?: string
  image?: string
  icon_url?: string
  thumbnail?: string
  cost?: number | string
  price?: number | string
  shop_price?: number | string
  purchase_cost?: number | string
  credit_cost?: number | string
  currency?: string
  unlock_condition?: string
  requirement?: string
  stats?: unknown
  attributes?: unknown
  effects?: unknown
  bonuses?: unknown
  passives?: unknown
  details?: unknown
  [key: string]: unknown
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

export default function ItemsPage() {
  const [items, setItems] = useState<ItemRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, category])

  useEffect(() => {
    const controller = new AbortController()
    let cancelled = false

    const fetchItems = async () => {
      try {
        setLoading(true)
        setError(null)
        const aggregated: ItemRecord[] = []
        let page = 1
        let totalPages = 1

        while (page <= totalPages) {
          const url = `${API_BASE}/items?page=${page}&limit=100`
          const response = await fetch(url, {
            headers: { 'x-api-key': API_KEY },
            signal: controller.signal
          })

          if (!response.ok) {
            if (response.status === 429) {
              throw new Error('Rate limit exceeded. Please try again in a moment.')
            }
            throw new Error(`Failed to load items (${response.status})`)
          }

          const data = await response.json()
          const list: ItemRecord[] = Array.isArray(data?.items)
            ? data.items
            : Array.isArray(data)
            ? data
            : Array.isArray(data?.data)
            ? data.data
            : []

          aggregated.push(...list)

          const totalFromResponse = Number(data?.total_pages) || Number(data?.total_items)
          if (Number.isFinite(totalFromResponse) && list.length > 0) {
            if (Number(data?.total_pages)) {
              totalPages = Number(data.total_pages)
            } else if (Number(data?.total_items)) {
              totalPages = Math.ceil(Number(data.total_items) / list.length)
            }
          }

          if (!Number.isFinite(totalPages) || totalPages <= 0) {
            totalPages = page
          }

          page += 1
        }

        if (!cancelled) {
          const unique = new Map<string | number, ItemRecord>()
          aggregated.forEach(item => {
            const key = item.id ?? `${item.name}-${item.category}-${item.type}`
            unique.set(key, item)
          })
          setItems(Array.from(unique.values()))
        }
      } catch (err) {
        if (controller.signal.aborted) return
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Failed to load items'
          setError(message)
          console.error('Failed to fetch items:', err)
        }
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
  }, [])

  const categories = useMemo(() => {
    const unique = new Set<string>()
    items.forEach(item => {
      const candidate = toTitleCase(
        (item.category as string) ||
          (item.type as string) ||
          (item.item_type as string) ||
          (item.group as string) ||
          (item.collection as string) ||
          (item.slot as string)
      )
      if (candidate) {
        unique.add(candidate)
      }
    })
    return ['All', ...Array.from(unique).sort()]
  }, [items])

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return items.filter(item => {
      const categoryLabel = toTitleCase(
        (item.category as string) ||
          (item.type as string) ||
          (item.item_type as string) ||
          (item.group as string) ||
          (item.collection as string) ||
          (item.slot as string)
      )
      const matchesCategory = category === 'All' || categoryLabel === category
      const descriptionText = `${item.description ?? ''} ${item.long_description ?? ''} ${item.summary ?? ''}`.toLowerCase()
      const matchesQuery =
        !query ||
        item.name?.toLowerCase().includes(query) ||
        descriptionText.includes(query)
      return matchesCategory && matchesQuery
    })
  }, [items, searchQuery, category])

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE))

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages)
    }
  }, [currentPage, totalPages])

  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE
    return filtered.slice(start, start + ITEMS_PER_PAGE)
  }, [filtered, currentPage])

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
                onChange={e => setSearchQuery(e.target.value)}
                className="flex-1 sm:w-72 px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:border-white/30"
              />
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="flex-1 sm:w-48 px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:border-white/30"
              >
                {categories.map(option => (
                  <option key={option} value={option} className="text-black">
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>

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

          {!loading && !error && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {pageItems.map(item => {
                  const iconCandidates = getAssetCandidates(
                    (item.icon as string) ||
                      (item.image as string) ||
                      (item.icon_url as string) ||
                      (item.thumbnail as string)
                  )
                  const typeLabel = toTitleCase((item.type as string) || (item.item_type as string) || (item.slot as string))
                  const categoryLabel = toTitleCase((item.category as string) || (item.group as string) || (item.collection as string))
                  const rarityLabel = toTitleCase((item.rarity as string) || (item.tier as string) || (item.quality as string) || (item.grade as string))
                  const costValue = formatNumber(item.cost ?? item.price ?? item.shop_price ?? item.purchase_cost ?? item.credit_cost)
                  const tags = [categoryLabel, rarityLabel].filter(Boolean)
                  const detailEntries = [
                    { label: 'Type', value: typeLabel },
                    { label: 'Category', value: categoryLabel },
                    { label: 'Rarity', value: rarityLabel },
                    { label: 'Cost', value: costValue },
                    { label: 'Currency', value: item.currency as string },
                    { label: 'Unlock', value: (item.unlock_condition as string) || (item.requirement as string) }
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
                    <div key={item.id ?? item.name} className="border border-white/10 bg-white/[0.02] rounded-2xl p-6 flex flex-col gap-4 hover:border-white/20 transition-all">
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

                {filtered.length === 0 && (
                  <div className="col-span-full text-center text-gray-400 py-20 border border-white/10 bg-white/[0.02] rounded-2xl">
                    No items found.
                  </div>
                )}
              </div>

              {filtered.length > 0 && totalPages > 1 && (
                <div className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="text-sm text-gray-400">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
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
      `}</style>
    </div>
  )
}

