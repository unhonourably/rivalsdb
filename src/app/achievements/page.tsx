'use client'

import { useEffect, useMemo, useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

const API_KEY = '188d3cd06e7db493dbd00811774d009528e8516c560a6b3e2751c2e411c40f9f'
const API_BASE = 'https://marvelrivalsapi.com/api/v1'

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
  const [category, setCategory] = useState('All')

  useEffect(() => {
    const controller = new AbortController()
    let cancelled = false

    const fetchAchievements = async () => {
      try {
        setLoading(true)
        setError(null)
        const aggregated: Achievement[] = []
        let page = 1
        let totalPages = 1

        while (page <= totalPages) {
          const url = `${API_BASE}/achievements?page=${page}&limit=100`
          const response = await fetch(url, {
            headers: { 'x-api-key': API_KEY },
            signal: controller.signal
          })

          if (!response.ok) {
            if (response.status === 429) {
              throw new Error('Rate limit exceeded. Please try again in a moment.')
            }
            throw new Error(`Failed to load achievements (${response.status})`)
          }

          const data = await response.json()
          const items: Achievement[] = Array.isArray(data?.achievements)
            ? data.achievements
            : Array.isArray(data)
            ? data
            : Array.isArray(data?.data)
            ? data.data
            : []

          aggregated.push(...items)

          const reportedTotal = Number(data?.total_pages) || Number(data?.total_achievements)
          if (Number.isFinite(reportedTotal) && items.length > 0) {
            if (Number(data?.total_pages)) {
              totalPages = Number(data.total_pages)
            } else if (Number(data?.total_achievements)) {
              totalPages = Math.ceil(Number(data.total_achievements) / items.length)
            }
          }

          if (!Number.isFinite(totalPages) || totalPages <= 0) {
            totalPages = page // prevent infinite loop
          }

          page += 1
        }

        if (!cancelled) {
          const unique = new Map<string | number, Achievement>()
          aggregated.forEach((achievement) => {
            unique.set(achievement.id ?? `${achievement.name}-${achievement.category}`, achievement)
          })
          setAchievements(Array.from(unique.values()))
        }
      } catch (err) {
        if (controller.signal.aborted) return
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Failed to load achievements'
          setError(message)
          console.error('Failed to fetch achievements:', err)
        }
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
  }, [])

  const categories = useMemo(() => {
    const unique = new Set<string>()
    achievements.forEach((achievement) => {
      if (achievement.category) {
        unique.add(toTitleCase(achievement.category))
      }
    })
    return ['All', ...Array.from(unique).sort()]
  }, [achievements])

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return achievements.filter((achievement) => {
      const matchesCategory = category === 'All' || toTitleCase(achievement.category) === category
      const matchesQuery = !query ||
        achievement.name?.toLowerCase().includes(query) ||
        achievement.description?.toLowerCase().includes(query)
      return matchesCategory && matchesQuery
    })
  }, [achievements, searchQuery, category])

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
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 sm:w-72 px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:border-white/30"
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="flex-1 sm:w-48 px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:border-white/30"
              >
                {categories.map((option) => (
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
              <p className="text-gray-400 mt-4">Loading achievements...</p>
            </div>
          )}

          {error && !loading && (
            <div className="border border-red-500/30 bg-red-500/10 rounded-2xl p-6 text-center text-red-300">
              {error}
            </div>
          )}

          {!loading && !error && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((achievement) => {
                const iconCandidates = getAssetCandidates(achievement.icon)
                const tiers = achievement.tiers || []
                const rarity = achievement.rarity ? toTitleCase(achievement.rarity) : null

                return (
                  <div key={achievement.id} className="border border-white/10 bg-white/[0.02] rounded-2xl p-6 flex flex-col gap-4 hover:border-white/20 transition-all">
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

              {filtered.length === 0 && (
                <div className="col-span-full text-center text-gray-400 py-20 border border-white/10 bg-white/[0.02] rounded-2xl">
                  No achievements found.
                </div>
              )}
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
      `}</style>
    </div>
  )
}

