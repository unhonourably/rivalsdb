'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

interface AchievementTier {
  tier?: number
  requirement?: string
  reward?: string
  description?: string
}

interface Achievement {
  id: number | string
  name: string
  description?: string
  category?: string
  icon?: string
  tiers?: AchievementTier[]
  rarity?: string
  points?: number
  [key: string]: unknown
}

const toTitleCase = (str: string | undefined | null): string => {
  if (!str) return ''
  return str
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
          setAttempt((prev) => prev + 1)
        }
      }}
      style={{ opacity: 0, animation: 'fadeIn 0.3s forwards' }}
    />
  )
}

export default function AchievementsPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [category, setCategory] = useState('All')
  const [availableCategories, setAvailableCategories] = useState<string[]>(['All'])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalResults, setTotalResults] = useState(0)
  const pageSize = 24

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim())
    }, 300)
    return () => clearTimeout(timeout)
  }, [searchQuery])

  useEffect(() => {
    const controller = new AbortController()
    let cancelled = false

    const fetchAchievements = async () => {
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
        const response = await fetch(`/api/achievements?${params.toString()}`, {
          signal: controller.signal
        })
        if (!response.ok) {
          throw new Error(`Failed to load achievements (${response.status})`)
        }
        const data = await response.json()
        const items: Achievement[] = Array.isArray(data?.achievements) ? data.achievements : []
        if (cancelled) return
        setAchievements(items)
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
              .map((value: unknown) => (typeof value === 'string' ? value : ''))
              .filter(Boolean)
              .map((value: string) => toTitleCase(value))
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
        const message = err instanceof Error ? err.message : 'Failed to load achievements'
        setError(message)
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchAchievements()

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [debouncedQuery, category, page, pageSize])

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
              <h1 className="text-4xl md:text-5xl font-light text-white mb-3">Achievements</h1>
              <p className="text-gray-400 max-w-2xl">
                Browse every Marvel Rivals achievement, including tier goals, rewards, and rarity details.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search achievements..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setPage(1)
                }}
                className="flex-1 sm:w-72 px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:border-white/30"
              />
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value)
                  setPage(1)
                }}
                className="flex-1 sm:w-48 px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:border-white/30"
              >
                {availableCategories.map((option) => (
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
                    Showing {startRange}–{endRange} of {totalResults} achievements
                  </span>
                ) : (
                  <span>No achievements to display</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
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
                  onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
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
              <p className="text-gray-400 mt-4">Loading achievements...</p>
            </div>
          )}

          {error && !loading && (
            <div className="border border-red-500/30 bg-red-500/10 rounded-2xl p-6 text-center text-red-300">
              {error}
            </div>
          )}

          {!loading && !error && achievements.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {achievements.map((achievement, index) => {
                const iconCandidates = getAssetCandidates(achievement.icon)
                const tiers = achievement.tiers || []
                const rarity = achievement.rarity ? toTitleCase(achievement.rarity) : null

                return (
                  <div
                    key={achievement.id}
                    className="border border-white/10 bg-white/[0.02] rounded-2xl p-6 flex flex-col gap-4 hover:border-white/20 transition-all opacity-0 animate-[fadeInUp_0.35s_ease_forwards]"
                    style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
                  >
                    <div className="flex items-start gap-4">
                      {iconCandidates.length > 0 && (
                        <div className="relative w-14 h-14 rounded-xl overflow-hidden border border-white/10">
                          <SmartImage
                            paths={iconCandidates}
                            alt={achievement.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-semibold text-white truncate" title={achievement.name}>
                          {achievement.name}
                        </h2>
                        {(achievement.description || (achievement as any).mission) && (
                          <p className="text-sm text-gray-400 line-clamp-3">
                            {achievement.description || (achievement as any).mission}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.3em] text-gray-500">
                      {achievement.category && <span>{toTitleCase(achievement.category)}</span>}
                      {rarity && <span className="px-2 py-0.5 rounded-full border border-white/10 bg-white/5 text-white/80">{rarity}</span>}
                      {typeof achievement.points === 'number' && (
                        <span className="px-2 py-0.5 rounded-full border border-white/10 bg-white/5 text-white/80">{achievement.points} pts</span>
                      )}
                    </div>

                    {tiers.length > 0 && (
                      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
                        <div className="text-xs uppercase tracking-[0.35em] text-gray-500">Tiers</div>
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                          {tiers.map((tier, index) => (
                            <div key={index} className="border border-white/10 rounded-lg p-3 bg-black/30 text-sm text-gray-300">
                              <div className="flex justify-between text-xs text-white/70 mb-1">
                                <span>Tier {tier.tier ?? index + 1}</span>
                                {tier.reward && <span>{tier.reward}</span>}
                              </div>
                              {tier.requirement && <div className="text-white/90">Requirement: {tier.requirement}</div>}
                              {tier.description && <div className="mt-1 text-xs text-gray-400">{tier.description}</div>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {!loading && !error && achievements.length === 0 && (
            <div className="border border-white/10 bg-white/[0.02] rounded-2xl p-10 text-center text-gray-400">
              No achievements match the current filters. Sync data via the admin page if needed.
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

