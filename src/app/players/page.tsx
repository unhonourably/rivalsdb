'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

interface Player {
  uid?: string
  name?: string
  player_uid?: number | string
  info?: {
    name?: string
    icon?: {
      player_icon_id?: string
      player_icon?: string
    }
    rank_season?: {
      rank_game_id?: number
      level?: number
      rank_score?: string
      max_level?: number
      max_rank_score?: string
      update_time?: number
      win_count?: number
      protect_score?: number
      diff_score?: string
    }
    login_os?: string
  }
  matches?: number
  wins?: number
  kills?: number
  deaths?: number
  assists?: number
  play_time?: string
  total_hero_damage?: string
  total_damage_taken?: string
  total_hero_heal?: string
  mvps?: number
  svps?: number
}



export default function PlayersPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [player, setPlayer] = useState<Player | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const router = useRouter()

  // Debounce search query
  const [debouncedQuery, setDebouncedQuery] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Search for player when debounced query changes
  useEffect(() => {
    const searchPlayer = async () => {
      if (!debouncedQuery.trim()) {
        setPlayer(null)
        setHasSearched(false)
        setError(null)
        return
      }

      try {
        setLoading(true)
        setError(null)
        setHasSearched(true)

        const response = await fetch(
          `/api/players/search?q=${encodeURIComponent(debouncedQuery)}`
        )

        if (!response.ok) {
          if (response.status === 404) {
            setError('Player not found')
            setPlayer(null)
          } else {
            const errorData = await response.json()
            throw new Error(errorData.error || `API Error: ${response.status}`)
          }
        } else {
          const result = await response.json()
          console.log('Player search response:', result)

          const dbPlayer = result.player
          
          if (dbPlayer) {
            const playerData: Player = {
              uid: dbPlayer.uid,
              name: dbPlayer.name,
              player_uid: dbPlayer.uid,
              info: {
                name: dbPlayer.name,
                icon: dbPlayer.player_icon ? {
                  player_icon: dbPlayer.player_icon,
                  player_icon_id: dbPlayer.player_icon_id
                } : undefined,
                login_os: dbPlayer.login_os,
                rank_season: dbPlayer.rank_score ? {
                  level: dbPlayer.level,
                  rank_score: dbPlayer.rank_score?.toString(),
                  max_level: dbPlayer.max_level,
                  max_rank_score: dbPlayer.max_rank_score?.toString(),
                  win_count: dbPlayer.win_count,
                  protect_score: dbPlayer.protect_score,
                  diff_score: dbPlayer.diff_score?.toString()
                } : undefined
              }
            }

            if (dbPlayer.stats_json) {
              try {
                const stats = JSON.parse(dbPlayer.stats_json as string)
                if (stats.overall_stats) {
                  playerData.matches = stats.overall_stats.total_matches
                  playerData.wins = typeof stats.overall_stats.total_wins === 'number' 
                    ? stats.overall_stats.total_wins 
                    : stats.overall_stats.total_wins?.wins
                  playerData.kills = stats.overall_stats.total_kills
                  playerData.deaths = stats.overall_stats.total_deaths
                  playerData.assists = stats.overall_stats.total_assists
                  playerData.mvps = stats.overall_stats.total_mvps?.mvps || stats.overall_stats.total_mvps
                  playerData.svps = stats.overall_stats.total_svps?.svps || stats.overall_stats.total_svps
                  playerData.play_time = stats.overall_stats.total_play_time?.playtime || stats.overall_stats.total_play_time?.time_played
                  playerData.total_hero_damage = stats.overall_stats.total_damage?.toString()
                  playerData.total_damage_taken = stats.overall_stats.total_damage_taken?.toString()
                  playerData.total_hero_heal = stats.overall_stats.total_healing?.toString()
                }
              } catch (e) {
                console.error('Failed to parse stats JSON:', e)
              }
            }

            setPlayer(playerData)
            setError(null)
          } else {
            setError('Player not found')
            setPlayer(null)
          }
        }
      } catch (err) {
        console.error('Error searching player:', err)
        setError(err instanceof Error ? err.message : 'Failed to search for player')
        setPlayer(null)
      } finally {
        setLoading(false)
      }
    }

    searchPlayer()
  }, [debouncedQuery])


  const statCardBase = 'group/stat text-center p-6 border border-white/10 rounded-xl bg-black/20 shadow-[0_0_0_0_rgba(255,255,255,0)] transition-all duration-200 hover:border-white/25 hover:bg-black/30 hover:shadow-[0_12px_45px_-20px_rgba(255,255,255,0.45)]'
  const statLabelClass = 'text-xs text-gray-400 font-normal uppercase tracking-[0.35em]'
  const statValueLarge = 'text-4xl sm:text-5xl font-light mb-3 text-white leading-none'
  const statValueMedium = 'text-2xl sm:text-3xl font-light mb-3 text-white leading-none'

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Trigger search by updating debounced query immediately
    setDebouncedQuery(searchQuery)
  }

  const formatValue = (val: any): string => {
    if (val === null || val === undefined) return '-'
    if (typeof val === 'string') {
      return val
    }
    if (typeof val === 'number') {
      if (val >= 0 && val <= 1 && val !== Math.floor(val)) {
        const percentage = val * 100
        if (percentage < 0.1) {
          return `${percentage.toFixed(2)}%`
        }
        return `${percentage.toFixed(1)}%`
      }
      if (Math.abs(val) >= 1000000000) {
        return `${(val / 1000000000).toFixed(2)}B`
      }
      if (Math.abs(val) >= 1000000) {
        return `${(val / 1000000).toFixed(2)}M`
      }
      if (Math.abs(val) >= 1000) {
        return val.toLocaleString(undefined, { maximumFractionDigits: 0 })
      }
      if (val !== Math.floor(val)) {
        if (Math.abs(val) < 0.01) {
          return val.toFixed(4)
        }
        return val.toFixed(2)
      }
      return val.toString()
    }
    return String(val)
  }

  const getKD = (kills?: number, deaths?: number): string => {
    if (!deaths || deaths === 0) return kills ? kills.toFixed(2) : '0.00'
    if (!kills) return '0.00'
    return (kills / deaths).toFixed(2)
  }

  const getWinRate = (wins?: number, matches?: number): string => {
    if (!matches || matches === 0) return '-'
    if (!wins) return '0%'
    const rate = (wins / matches) * 100
    return `${rate.toFixed(1)}%`
  }

  return (
    <div className="min-h-screen flex flex-col bg-black">
      <Navbar />
      <div className="background"></div>

      <main className="flex-1 pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="mb-12 space-y-6">
            <div>
              <h1 className="text-5xl sm:text-6xl font-semibold mb-3 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent" style={{ fontFamily: 'var(--font-fredoka)' }}>
                Players
              </h1>
              <p className="text-gray-400 text-lg max-w-2xl">
                Dive into live player profiles, match performance, and ranked progress from the Marvel Rivals community.
              </p>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative group">
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-red-500/10 via-white/5 to-red-500/5 opacity-60 blur-xl transition-opacity group-hover:opacity-80"></div>
                <div className="relative rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-sm focus-within:border-white/30 focus-within:bg-white/[0.06] transition-all">
                  <div className="flex items-center px-6 py-4">
                    <svg
                      className="w-5 h-5 text-gray-400 mr-3 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search for a player by username..."
                      className="flex-1 bg-transparent text-white placeholder-gray-500 text-lg focus:outline-none"
                    />
                    {loading && (
                      <div className="ml-4">
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </form>
          </div>

          {/* Error Message */}
          {error && hasSearched && !loading && (
            <div className="border border-red-500/30 bg-red-500/10 rounded-xl p-6 mb-8">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {/* Player Results */}
          {player && !loading && (
            <div className="animate-fade-in-up mt-8">
              <Link
                href={`/players/${player.uid || player.player_uid}`}
                className="group relative block focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-2xl overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-transparent to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative border border-white/10 bg-white/[0.02] rounded-2xl p-6 transition-all duration-300 group-hover:border-white/20 group-hover:bg-white/[0.04]">
                  <div className="flex items-center gap-4">
                    {player.info?.icon?.player_icon && (
                      <div className="relative flex-shrink-0">
                        <div className="w-16 h-16 rounded-full overflow-hidden border border-white/15 bg-black/40">
                          <img
                            src={(() => {
                              const iconPath = player.info.icon.player_icon
                              if (iconPath.startsWith('http')) return iconPath
                              if (iconPath.startsWith('/players/') && !iconPath.startsWith('/rivals/')) {
                                return `https://marvelrivalsapi.com/rivals${iconPath}`
                              }
                              if (iconPath.startsWith('/rivals/')) {
                                return `https://marvelrivalsapi.com${iconPath}`
                              }
                              return `https://marvelrivalsapi.com${iconPath}`
                            })()}
                            alt={player.info.name || player.name || 'Player'}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              const iconPath = player.info?.icon?.player_icon || ''
                              if (!iconPath.startsWith('http') && iconPath.startsWith('/rivals/')) {
                                const fallbackUrl = `https://marvelrivalsapi.com${iconPath.replace('/rivals', '')}`
                                if (target.src !== fallbackUrl) {
                                  target.src = fallbackUrl
                                  return
                                }
                              }
                              if (!iconPath.startsWith('http')) {
                                const originalUrl = `https://marvelrivalsapi.com${iconPath}`
                                if (target.src !== originalUrl) {
                                  target.src = originalUrl
                                  return
                                }
                              }
                              target.style.display = 'none'
                            }}
                          />
                        </div>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-2xl font-light text-white truncate">
                          {player.info?.name || player.name || 'Unknown Player'}
                        </h2>
                        {player.info?.login_os && (
                          <span className="px-2 py-0.5 rounded border border-white/10 bg-white/5 text-xs text-gray-400 uppercase flex-shrink-0">
                            {player.info.login_os}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        {(player.uid || player.player_uid) && (
                          <span className="text-xs">UID: {player.uid || player.player_uid}</span>
                        )}
                        {player.info?.rank_season?.rank_score && (
                          <span className="text-xs">
                            Rank Score: <span className="text-white">{player.info.rank_season.rank_score}</span>
                          </span>
                        )}
                        {player.info?.rank_season?.level && (
                          <span className="text-xs">
                            Level: <span className="text-white">{player.info.rank_season.level}/{player.info.rank_season.max_level}</span>
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-400 group-hover:text-white transition-colors">
                      <span>View Profile</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          )}

          {/* Empty State */}
          {!player && !loading && !error && hasSearched && (
            <div className="border border-white/10 bg-white/[0.02] rounded-xl p-12 text-center">
              <p className="text-gray-400">No player found. Try a different username.</p>
            </div>
          )}

          {/* Initial State */}
          {!player && !loading && !error && !hasSearched && (
            <div className="border border-white/10 bg-white/[0.02] rounded-xl p-12 text-center">
              <p className="text-gray-400">Enter a username to search for player statistics.</p>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}

