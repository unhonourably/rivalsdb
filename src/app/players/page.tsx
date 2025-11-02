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

const API_KEY = '188d3cd06e7db493dbd00811774d009528e8516c560a6b3e2751c2e411c40f9f'
const API_BASE = 'https://marvelrivalsapi.com/api/v1'

const QUICK_PLAYER_SUGGESTIONS = ['ToernB', 'pølly', 'cооper'] as const

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
          `${API_BASE}/find-player/${encodeURIComponent(debouncedQuery)}`,
          {
            headers: {
              'x-api-key': API_KEY
            }
          }
        )

        if (!response.ok) {
          if (response.status === 404) {
            setError('Player not found')
            setPlayer(null)
          } else {
            const errorText = await response.text()
            throw new Error(`API Error: ${response.status} - ${errorText}`)
          }
        } else {
          const data = await response.json()
          console.log('Player search response:', data)

          // Handle different response formats
          let playerData: Player | null = null
          
          if (Array.isArray(data) && data.length > 0) {
            playerData = data[0]
          } else if (data.uid || data.name || data.player_uid || data.info) {
            // API returns simple format with uid and name, or full player object
            playerData = data
          } else if (data.player) {
            playerData = data.player
          } else if (data.data) {
            playerData = Array.isArray(data.data) ? data.data[0] : data.data
          }
          
          if (playerData) {
            setPlayer(playerData)
            setError(null)
            // If we only got basic info (uid/name), try to fetch detailed stats
            const playerId = playerData.uid || playerData.player_uid
            if (playerId && (!playerData.matches && !playerData.info?.rank_season)) {
              // Try to fetch detailed player stats using the uid
              fetchPlayerDetails(playerId.toString())
            }
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

  // Fetch detailed player information using uid
  const fetchPlayerDetails = async (uid: string) => {
    try {
      // Try to fetch player details - adjust endpoint based on API docs
      const detailResponse = await fetch(
        `${API_BASE}/player/${uid}`,
        {
          headers: {
            'x-api-key': API_KEY
          }
        }
      )
      
      if (detailResponse.ok) {
        const detailData = await detailResponse.json()
        console.log('Player details response:', detailData)
        
        // Merge detailed data with existing player data
        setPlayer(prev => prev ? { ...prev, ...detailData } : detailData)
      } else {
        // If detailed endpoint doesn't exist, that's okay - we have basic info
        console.log('Detailed player endpoint not available, using basic info')
      }
    } catch (err) {
      // Silently fail - we still have the basic player info
      console.log('Could not fetch detailed player info:', err)
    }
  }

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
              <h1 className="text-5xl sm:text-6xl font-light mb-3">
                <span className="bubble-text red-glint" data-text="Players">Players</span>
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

              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
                <span className="uppercase tracking-[0.3em] text-xs text-gray-500">Quick Picks</span>
                {QUICK_PLAYER_SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => {
                      setSearchQuery(suggestion)
                      setDebouncedQuery(suggestion)
                    }}
                    className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    #{suggestion}
                  </button>
                ))}
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
            <div className="animate-fade-in-up">
              <Link
                href={`/players/${player.uid || player.player_uid}`}
                className="group relative block focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black rounded-3xl"
              >
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-red-500/20 via-transparent to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative border border-white/10 bg-white/[0.02] rounded-3xl p-8 md:p-10 transition-all duration-300 group-hover:border-white/25 group-hover:bg-white/[0.05] shadow-[0_35px_120px_-60px_rgba(255,255,255,0.45)]">
                  {/* Player Header */}
                  <div className="flex flex-col md:flex-row md:items-center gap-6 mb-10 pb-8 border-b border-white/10">
                    {player.info?.icon?.player_icon && (
                      <div className="relative">
                        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-red-500/30 to-white/10 blur-xl opacity-60"></div>
                        <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-white/15 flex-shrink-0">
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
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-3xl font-light text-white">
                          {player.info?.name || player.name || 'Unknown Player'}
                        </h2>
                        {(player.uid || player.player_uid) && (
                          <span className="px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs text-gray-300 tracking-wide">
                            UID: {player.uid || player.player_uid}
                          </span>
                        )}
                        {player.info?.login_os && (
                          <span className="px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs text-gray-300 tracking-wide uppercase">
                            {player.info.login_os}
                          </span>
                        )}
                      </div>

                      {(player.info?.rank_season || player.uid || player.player_uid) && (
                        <div className="flex flex-wrap gap-3 mt-6">
                          {player.info?.rank_season && (
                            <>
                              <div className="px-4 py-3 border border-white/10 bg-white/5 rounded-lg min-w-[160px]">
                                <div className="text-xs text-gray-400 mb-1 uppercase tracking-[0.25em]">Rank Score</div>
                                <div className="text-lg font-medium text-white">
                                  {player.info.rank_season.rank_score || '-'}
                                </div>
                              </div>
                              <div className="px-4 py-3 border border-white/10 bg-white/5 rounded-lg min-w-[160px]">
                                <div className="text-xs text-gray-400 mb-1 uppercase tracking-[0.25em]">Rank Level</div>
                                <div className="text-lg font-medium text-white">
                                  {player.info.rank_season.level || '-'} / {player.info.rank_season.max_level || '-'}
                                </div>
                              </div>
                              {player.info.rank_season.win_count !== undefined && (
                                <div className="px-4 py-3 border border-white/10 bg-white/5 rounded-lg min-w-[140px]">
                                  <div className="text-xs text-gray-400 mb-1 uppercase tracking-[0.25em]">Season Wins</div>
                                  <div className="text-lg font-medium text-white">
                                    {player.info.rank_season.win_count}
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Player Stats */}
                  <div className="space-y-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="text-xs uppercase tracking-[0.4em] text-gray-500">Key Highlights</h3>
                      <span className="text-xs text-gray-500">Live data sourced from Marvel Rivals API</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                      {player.matches !== undefined && (
                        <div className={statCardBase}>
                          <div className={statValueLarge}>{formatValue(player.matches)}</div>
                          <div className={statLabelClass}>Matches</div>
                        </div>
                      )}

                      {player.wins !== undefined && (
                        <div className={statCardBase}>
                          <div className={statValueLarge}>{formatValue(player.wins)}</div>
                          <div className={statLabelClass}>Wins</div>
                        </div>
                      )}

                      {player.matches !== undefined && player.wins !== undefined && (
                        <div className={statCardBase}>
                          <div className={statValueLarge}>{getWinRate(player.wins, player.matches)}</div>
                          <div className={statLabelClass}>Win Rate</div>
                        </div>
                      )}

                      {player.kills !== undefined && (
                        <div className={statCardBase}>
                          <div className={statValueLarge}>{formatValue(player.kills)}</div>
                          <div className={statLabelClass}>Kills</div>
                        </div>
                      )}

                      {player.deaths !== undefined && (
                        <div className={statCardBase}>
                          <div className={statValueLarge}>{formatValue(player.deaths)}</div>
                          <div className={statLabelClass}>Deaths</div>
                        </div>
                      )}

                      {player.kills !== undefined && player.deaths !== undefined && (
                        <div className={statCardBase}>
                          <div className={statValueLarge}>{getKD(player.kills, player.deaths)}</div>
                          <div className={statLabelClass}>K/D Ratio</div>
                        </div>
                      )}

                      {player.assists !== undefined && (
                        <div className={statCardBase}>
                          <div className={statValueLarge}>{formatValue(player.assists)}</div>
                          <div className={statLabelClass}>Assists</div>
                        </div>
                      )}

                      {player.mvps !== undefined && (
                        <div className={statCardBase}>
                          <div className={statValueLarge}>{formatValue(player.mvps)}</div>
                          <div className={statLabelClass}>MVPs</div>
                        </div>
                      )}

                      {player.svps !== undefined && (
                        <div className={statCardBase}>
                          <div className={statValueLarge}>{formatValue(player.svps)}</div>
                          <div className={statLabelClass}>SVPs</div>
                        </div>
                      )}

                      {player.play_time && (
                        <div className={statCardBase}>
                          <div className={statValueMedium}>{player.play_time}</div>
                          <div className={statLabelClass}>Play Time</div>
                        </div>
                      )}

                      {player.total_hero_damage && (
                        <div className={statCardBase}>
                          <div className={statValueMedium}>{formatValue(parseFloat(player.total_hero_damage))}</div>
                          <div className={statLabelClass}>Total Damage</div>
                        </div>
                      )}

                      {player.total_damage_taken && (
                        <div className={statCardBase}>
                          <div className={statValueMedium}>{formatValue(parseFloat(player.total_damage_taken))}</div>
                          <div className={statLabelClass}>Damage Taken</div>
                        </div>
                      )}

                      {player.total_hero_heal && (
                        <div className={statCardBase}>
                          <div className={statValueMedium}>{formatValue(parseFloat(player.total_hero_heal))}</div>
                          <div className={statLabelClass}>Total Healing</div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-10 flex items-center gap-3 text-sm text-red-300 font-medium group-hover:text-red-200">
                    <span>View full profile</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
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

