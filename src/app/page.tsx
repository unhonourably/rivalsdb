'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import rivalsLogo from '@/components/rivalslogo.png'

const API_KEY = '188d3cd06e7db493dbd00811774d009528e8516c560a6b3e2751c2e411c40f9f'
const API_BASE = 'https://marvelrivalsapi.com/api/v1'
const API_BASE_V2 = 'https://marvelrivalsapi.com/api/v2'

interface HeroShowcase {
  id: string
  name: string
  role?: string
  winRate: number
  matches: number
  wins: number
  iconPaths: string[]
}

interface HeroCandidate {
  id: string
  name: string
  role?: string
  imageUrl?: string
}

interface PlayerShowcase {
  uid: string
  name: string
  rank?: string
  rankColor?: string
  rankIconPaths?: string[]
  score?: number
  winRate?: number
  matches?: number
  wins?: number
  iconPaths: string[]
}

const toTitleCase = (str: string | undefined | null): string => {
  if (!str) return ''
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const getAssetCandidates = (path?: string | null): string[] => {
  if (!path) return []
  const raw = typeof path === 'string' ? path : String(path)
  if (!raw.trim()) return []

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
    />
  )
}

const formatWinRate = (value?: number): string => {
  if (value === undefined || Number.isNaN(value)) return '-'
  return `${value.toFixed(1)}%`
}

const formatNumber = (value?: number): string => {
  if (value === undefined || value === null || Number.isNaN(value)) return '-'
  return value.toLocaleString()
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const [topHeroes, setTopHeroes] = useState<HeroShowcase[]>([])
  const [topPlayers, setTopPlayers] = useState<PlayerShowcase[]>([])
  const [showcaseView, setShowcaseView] = useState<'heroes' | 'players'>('heroes')
  const [showcaseLoading, setShowcaseLoading] = useState(true)
  const [showcaseError, setShowcaseError] = useState<string | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    let cancelled = false

    const parseNumber = (value: unknown): number => {
      if (typeof value === 'number') return value
      if (typeof value === 'string') {
        const cleaned = value.replace(/[^0-9.]/g, '')
        const parsed = Number(cleaned)
        return Number.isFinite(parsed) ? parsed : 0
      }
      return 0
    }

    const fetchTopHeroes = async (): Promise<HeroShowcase[]> => {
      const response = await fetch(`${API_BASE}/heroes`, {
        headers: { 'x-api-key': API_KEY },
        signal: controller.signal
      })

      if (!response.ok) {
        throw new Error(`Failed to load heroes (${response.status})`)
      }

      const data = await response.json()
      const heroesList = Array.isArray(data?.heroes)
        ? data.heroes
        : Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : []

      const normalizedHeroes: HeroCandidate[] = heroesList
        .filter((hero: any) => hero?.id || hero?.hero_id)
        .map((hero: any) => ({
          id: String(hero.id ?? hero.hero_id),
          name: toTitleCase(hero.name ?? hero.hero_name ?? ''),
          role: hero.role ? toTitleCase(hero.role) : undefined,
          imageUrl: hero.imageUrl || hero.hero_icon || hero.icon || ''
        }))

      const best: HeroShowcase[] = []
      const chunkSize = 6

      for (let i = 0; i < normalizedHeroes.length; i += chunkSize) {
        if (controller.signal.aborted) break
        const chunk = normalizedHeroes.slice(i, i + chunkSize)
        const results = await Promise.allSettled(
          chunk.map(async (hero) => {
            const statsResp = await fetch(`${API_BASE}/heroes/hero/${hero.id}/stats`, {
              headers: { 'x-api-key': API_KEY },
              signal: controller.signal
            })
            if (!statsResp.ok) {
              throw new Error(`Failed to load stats for hero ${hero.id}`)
            }
            const stats = await statsResp.json()
            return { hero, stats }
          })
        )

        results.forEach((result) => {
          if (result.status !== 'fulfilled') return
          const { hero, stats } = result.value

          const matches = parseNumber(stats.matches ?? stats.total_matches ?? stats.match_count)
          const wins = parseNumber(stats.wins ?? stats.total_wins ?? stats.win_count)
          if (!matches || matches < 20) return

          const winRate = matches ? (wins / matches) * 100 : 0
          if (!Number.isFinite(winRate)) return

          const iconPaths = getAssetCandidates(stats.hero_icon || hero.imageUrl)
          const showcase: HeroShowcase = {
            id: hero.id,
            name: hero.name || toTitleCase(stats.hero_name),
            role: hero.role || (stats.role ? toTitleCase(stats.role) : undefined),
            winRate,
            matches,
            wins,
            iconPaths: iconPaths.length ? iconPaths : getAssetCandidates(hero.imageUrl)
          }

          best.push(showcase)
          best.sort((a, b) => {
            if (b.winRate !== a.winRate) return b.winRate - a.winRate
            return (b.matches || 0) - (a.matches || 0)
          })
          if (best.length > 3) best.length = 3
        })
      }

      return best
    }

    const fetchTopPlayers = async (): Promise<PlayerShowcase[]> => {
      const response = await fetch(`${API_BASE_V2}/players/leaderboard?page=1&limit=3`, {
        headers: { 'x-api-key': API_KEY },
        signal: controller.signal
      })

      if (!response.ok) {
        throw new Error(`Failed to load leaderboard (${response.status})`)
      }

      const data = await response.json()
      const playersList = Array.isArray(data?.players)
        ? data.players
        : Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
        ? data.data
        : []

      return playersList.slice(0, 3).map((player: any) => {
        const info = player.info || {}
        const rankInfo = player.rank || info.rank || {}
        const matches = parseNumber(player.matches ?? rankInfo.battle_count)
        const wins = parseNumber(player.wins ?? rankInfo.win_count)

        let winRate = parseNumber(rankInfo.win_rate)
        if (!winRate && matches > 0) {
          winRate = (wins / matches) * 100
        }
        if (winRate && winRate <= 1) {
          winRate = winRate * 100
        }

        const iconPaths = getAssetCandidates(player.icon?.player_icon || info.icon?.player_icon)
        let rankLabel: string | undefined
        let rankColor: string | undefined
        let rankIconPaths: string[] | undefined

        const rawRank = rankInfo.rank

        if (typeof rawRank === 'string') {
          rankLabel = rawRank
        } else if (rawRank && typeof rawRank === 'object') {
          rankLabel = rawRank.rank || rawRank.title || rawRank.name || undefined
          if (rawRank.color && typeof rawRank.color === 'string') {
            rankColor = rawRank.color
          }
          if (rawRank.image) {
            rankIconPaths = getAssetCandidates(rawRank.image)
          }
        }

        if (!rankLabel && typeof rankInfo.title === 'string') {
          rankLabel = rankInfo.title
        }

        if (!rankColor && typeof rankInfo.color === 'string') {
          rankColor = rankInfo.color
        }

        if (!rankIconPaths?.length && rankInfo.image) {
          rankIconPaths = getAssetCandidates(rankInfo.image)
        }

        return {
          uid: String(player.uid ?? player.player_uid ?? info.player_uid ?? 'unknown'),
          name: toTitleCase(player.name ?? info.name ?? 'Unknown Player'),
          rank: rankLabel,
          rankColor,
          rankIconPaths,
          score: parseNumber(player.score ?? rankInfo.rank_score),
          winRate: Number.isFinite(winRate) ? winRate : undefined,
          matches: matches || undefined,
          wins: wins || undefined,
          iconPaths
        }
      })
    }

    const loadShowcase = async () => {
      try {
        setShowcaseLoading(true)
        setShowcaseError(null)

        const errors: string[] = []

        const heroPromise = fetchTopHeroes().catch((err) => {
          console.error(err)
          errors.push(err instanceof Error ? err.message : 'Failed to load hero highlights')
          return [] as HeroShowcase[]
        })
        const playerPromise = fetchTopPlayers().catch((err) => {
          console.error(err)
          errors.push(err instanceof Error ? err.message : 'Failed to load player highlights')
          return [] as PlayerShowcase[]
        })

        const [heroResult, playerResult] = await Promise.all([heroPromise, playerPromise])

        if (!cancelled) {
          setTopHeroes(heroResult)
          setTopPlayers(playerResult)
          if (errors.length > 0) {
            setShowcaseError(errors[0])
          } else if (heroResult.length === 0 && playerResult.length === 0) {
            setShowcaseError('Live highlights are unavailable right now. Please try again later.')
          }
        }
      } catch (err) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Failed to load highlights'
          setShowcaseError(message)
        }
      } finally {
        if (!cancelled) {
          setShowcaseLoading(false)
        }
      }
    }

    loadShowcase()

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-black">
      <Navbar />
      <div className="background"></div>
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-40 pb-32 px-6 lg:px-8 overflow-hidden">
          <div className="max-w-5xl mx-auto">
            {/* Logo */}
            <div className="mb-16 flex justify-center">
              <div className="relative w-auto h-40 sm:h-48 md:h-56 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <Image
                  src={rivalsLogo}
                  alt="Marvel Rivals Logo"
                  height={240}
                  width={720}
                  className="h-full w-auto object-contain"
                  priority
                />
              </div>
            </div>

            <div className="text-center mb-12">
              <p className="text-lg sm:text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed animate-fade-in-up relative z-10" style={{ animationDelay: '0.2s' }}>
                The best way to keep tabs on your stats, performance, and everything Marvel Rivals.
              </p>
            </div>

            {/* Modern Search Bar */}
            <div className="max-w-2xl mx-auto mb-20 animate-scale-in" style={{ animationDelay: '0.4s' }}>
              <div className={`relative transition-all duration-300 ${isFocused ? 'scale-[1.02]' : ''}`}>
                <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-white/10 to-white/5 rounded-2xl blur-xl opacity-0 transition-opacity duration-300" style={{ opacity: isFocused ? 1 : 0 }}></div>
                <div className="relative bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden transition-all duration-300 hover:border-white/20" style={{ borderColor: isFocused ? 'rgba(255, 255, 255, 0.3)' : undefined }}>
                  <div className="flex items-center px-6 py-4">
                    <svg className="w-5 h-5 text-gray-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search for a player, hero, or match..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      className="flex-1 bg-transparent text-white placeholder-gray-500 text-sm focus:outline-none"
                    />
                    <button className="ml-4 px-6 py-2.5 bg-white text-black text-sm font-medium rounded-xl hover:bg-gray-100 active:scale-95 transition-all duration-200 whitespace-nowrap">
                      Search
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 px-6 lg:px-8 border-t border-white/5">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
              <h2 className="text-2xl sm:text-3xl font-light mb-4 text-white">Live Highlights</h2>
              <p className="text-gray-500 text-sm max-w-2xl mx-auto">
                Fresh pulls from the Marvel Rivals API showcasing who&apos;s dominating right now.
              </p>
            </div>

            <div className="flex justify-center mb-10 animate-fade-in-up" style={{ animationDelay: '0.7s' }}>
              <div className="flex bg-white/5 border border-white/10 rounded-full p-1">
                <button
                  type="button"
                  onClick={() => setShowcaseView('heroes')}
                  className={`px-5 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                    showcaseView === 'heroes'
                      ? 'bg-white text-black shadow-lg'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  Top Heroes
                </button>
                <button
                  type="button"
                  onClick={() => setShowcaseView('players')}
                  className={`px-5 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                    showcaseView === 'players'
                      ? 'bg-white text-black shadow-lg'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  Top Players
                </button>
              </div>
            </div>

            {showcaseError && !showcaseLoading && (
              <div className="border border-red-500/30 bg-red-500/10 rounded-2xl p-6 text-center text-red-300">
                {showcaseError}
              </div>
            )}

            {showcaseLoading ? (
              <div className="py-20 flex justify-center">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
                  <p className="text-gray-400 mt-4">Syncing with Helicarrier...</p>
                </div>
              </div>
            ) : showcaseView === 'heroes' ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {topHeroes.map((hero, index) => (
                  <div
                    key={hero.id}
                    className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-purple-500/10 via-white/5 to-black/80 p-6 transition-all duration-300 transform hover:-translate-y-1 hover:border-white/25"
                  >
                    <div className="flex items-center justify-between text-xs uppercase tracking-[0.35em] text-gray-400">
                      <span>#{index + 1}</span>
                      <span>{hero.role || 'Hero'}</span>
                    </div>
                    <div className="mt-6 flex items-center gap-4">
                      <div className="relative w-20 h-20 rounded-2xl overflow-hidden border border-white/15 bg-black/40">
                        <SmartImage paths={hero.iconPaths} alt={hero.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-semibold text-white">{hero.name}</h3>
                        <p className="text-sm text-gray-300/80">{formatNumber(hero.matches)} matches</p>
                      </div>
                    </div>
                    <div className="mt-6 grid grid-cols-3 gap-3 text-xs text-gray-300">
                      <div className="rounded-xl bg-black/40 border border-white/10 p-3 text-center">
                        <div className="text-gray-500 uppercase tracking-[0.25em] mb-1">Win Rate</div>
                        <div className="text-lg text-white">{formatWinRate(hero.winRate)}</div>
                      </div>
                      <div className="rounded-xl bg-black/40 border border-white/10 p-3 text-center">
                        <div className="text-gray-500 uppercase tracking-[0.25em] mb-1">Wins</div>
                        <div className="text-lg text-white">{formatNumber(hero.wins)}</div>
                      </div>
                      <div className="rounded-xl bg-black/40 border border-white/10 p-3 text-center">
                        <div className="text-gray-500 uppercase tracking-[0.25em] mb-1">Losses</div>
                        <div className="text-lg text-white">{formatNumber(hero.matches - hero.wins)}</div>
                      </div>
                    </div>
                    <Link
                      href={`/heroes/${hero.id}`}
                      className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-white/80 group-hover:text-white transition-colors"
                    >
                      View hero breakdown
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </Link>
                  </div>
                ))}

                {topHeroes.length === 0 && (
                  <div className="col-span-full text-center text-gray-400 border border-white/10 bg-white/[0.02] rounded-2xl p-10">
                    No hero data available right now.
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {topPlayers.map((player, index) => (
                  <div
                    key={player.uid}
                    className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-blue-500/10 via-white/5 to-black/80 p-6 transition-all duration-300 transform hover:-translate-y-1 hover:border-white/25"
                  >
                    <div className="flex items-center justify-between text-xs uppercase tracking-[0.35em] text-gray-400">
                      <span>#{index + 1}</span>
                      <span style={{ color: player.rankColor || undefined }}>{player.rank || 'Contender'}</span>
                    </div>
                    <div className="mt-6 flex items-center gap-4">
                      <div className="relative w-16 h-16 rounded-full overflow-hidden border border-white/15 bg-black/40">
                        <SmartImage paths={player.iconPaths} alt={player.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-white">{player.name}</h3>
                        {player.score !== undefined && (
                          <p className="text-sm text-gray-300/80">Score: {formatNumber(player.score)}</p>
                        )}
                      </div>
                    </div>
                    <div className="mt-6 grid grid-cols-3 gap-3 text-xs text-gray-300">
                      <div className="rounded-xl bg-black/40 border border-white/10 p-3 text-center">
                        <div className="text-gray-500 uppercase tracking-[0.25em] mb-1">Win Rate</div>
                        <div className="text-lg text-white">{player.winRate !== undefined ? formatWinRate(player.winRate) : '-'}</div>
                      </div>
                      <div className="rounded-xl bg-black/40 border border-white/10 p-3 text-center">
                        <div className="text-gray-500 uppercase tracking-[0.25em] mb-1">Wins</div>
                        <div className="text-lg text-white">{formatNumber(player.wins)}</div>
                      </div>
                      <div className="rounded-xl bg-black/40 border border-white/10 p-3 text-center">
                        <div className="text-gray-500 uppercase tracking-[0.25em] mb-1">Matches</div>
                        <div className="text-lg text-white">{formatNumber(player.matches)}</div>
                      </div>
                    </div>
                    <Link
                      href={`/players/${player.uid}`}
                      className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-white/80 group-hover:text-white transition-colors"
                    >
                      View player profile
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </Link>
                  </div>
                ))}

                {topPlayers.length === 0 && (
                  <div className="col-span-full text-center text-gray-400 border border-white/10 bg-white/[0.02] rounded-2xl p-10">
                    No leaderboard data available right now.
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
    </main>

      <Footer />
    </div>
  )
} 