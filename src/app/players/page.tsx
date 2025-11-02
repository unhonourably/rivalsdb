'use client'

import { useState, useEffect, useMemo } from 'react'
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
          <div className="mb-12">
            <h1 className="text-5xl sm:text-6xl font-light mb-2">
              <span className="bubble-text red-glint" data-text="Players">Players</span>
            </h1>
            <p className="text-gray-400 text-lg">Search for player statistics</p>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSubmit} className="mb-8">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for a player by username..."
                className="w-full px-6 py-4 pl-14 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-white/30 focus:bg-white/10 transition-all text-lg"
              />
              <svg
                className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {loading && (
                <div className="absolute right-5 top-1/2 -translate-y-1/2">
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                </div>
              )}
            </div>
          </form>

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
                className="block border border-white/10 bg-white/[0.02] rounded-2xl p-8 hover:border-white/20 hover:bg-white/[0.04] transition-all"
              >
                {/* Player Header */}
                <div className="flex items-start gap-6 mb-8 pb-8 border-b border-white/10">
                  {player.info?.icon?.player_icon && (
                    <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-white/10 flex-shrink-0">
                      <img
                        src={(() => {
                          const iconPath = player.info.icon.player_icon
                          if (iconPath.startsWith('http')) return iconPath
                          // Paths from API are like /players/heads/player_head_xxx.png
                          // But they might need /rivals/ prefix, or might work as-is
                          // Try the most common format first
                          if (iconPath.startsWith('/players/') && !iconPath.startsWith('/rivals/')) {
                            return `https://marvelrivalsapi.com/rivals${iconPath}`
                          }
                          // If already has /rivals/, use as-is
                          if (iconPath.startsWith('/rivals/')) {
                            return `https://marvelrivalsapi.com${iconPath}`
                          }
                          // Fallback: try original path
                          return `https://marvelrivalsapi.com${iconPath}`
                        })()}
                        alt={player.info.name || player.name || 'Player'}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          const iconPath = player.info?.icon?.player_icon || ''
                          // Try fallback URL without /rivals/ prefix
                          if (!iconPath.startsWith('http') && iconPath.startsWith('/rivals/')) {
                            const fallbackUrl = `https://marvelrivalsapi.com${iconPath.replace('/rivals', '')}`
                            if (target.src !== fallbackUrl) {
                              target.src = fallbackUrl
                              return
                            }
                          }
                          // Try original path without modifications
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
                  )}
                  <div className="flex-1 min-w-0">
                    <h2 className="text-3xl font-light text-white mb-2">
                      {player.info?.name || player.name || 'Unknown Player'}
                    </h2>
                    {(player.info?.rank_season || player.uid || player.player_uid) && (
                      <div className="flex flex-wrap gap-3 mt-4">
                        {player.info?.rank_season && (
                          <>
                            <div className="px-4 py-2 border border-white/10 bg-white/5 rounded-lg">
                              <div className="text-xs text-gray-400 mb-1">Rank Score</div>
                              <div className="text-lg font-medium text-white">
                                {player.info.rank_season.rank_score || '-'}
                              </div>
                            </div>
                            <div className="px-4 py-2 border border-white/10 bg-white/5 rounded-lg">
                              <div className="text-xs text-gray-400 mb-1">Level</div>
                              <div className="text-lg font-medium text-white">
                                {player.info.rank_season.level || '-'} / {player.info.rank_season.max_level || '-'}
                              </div>
                            </div>
                            {player.info.rank_season.win_count !== undefined && (
                              <div className="px-4 py-2 border border-white/10 bg-white/5 rounded-lg">
                                <div className="text-xs text-gray-400 mb-1">Wins</div>
                                <div className="text-lg font-medium text-white">
                                  {player.info.rank_season.win_count}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                        {(player.uid || player.player_uid) && (
                          <div className="px-4 py-2 border border-white/10 bg-white/5 rounded-lg">
                            <div className="text-xs text-gray-400 mb-1">Player ID</div>
                            <div className="text-lg font-medium text-white">
                              {player.uid || player.player_uid}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Player Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {player.matches !== undefined && (
                    <div className="text-center p-6 border border-white/10 rounded-xl bg-black/20 hover:border-white/20 hover:bg-black/30 transition-all">
                      <div className="text-4xl sm:text-5xl font-light mb-3 text-white leading-none">
                        {formatValue(player.matches)}
                      </div>
                      <div className="text-xs text-gray-400 font-normal uppercase tracking-wider">
                        Matches
                      </div>
                    </div>
                  )}

                  {player.wins !== undefined && (
                    <div className="text-center p-6 border border-white/10 rounded-xl bg-black/20 hover:border-white/20 hover:bg-black/30 transition-all">
                      <div className="text-4xl sm:text-5xl font-light mb-3 text-white leading-none">
                        {formatValue(player.wins)}
                      </div>
                      <div className="text-xs text-gray-400 font-normal uppercase tracking-wider">
                        Wins
                      </div>
                    </div>
                  )}

                  {player.matches !== undefined && player.wins !== undefined && (
                    <div className="text-center p-6 border border-white/10 rounded-xl bg-black/20 hover:border-white/20 hover:bg-black/30 transition-all">
                      <div className="text-4xl sm:text-5xl font-light mb-3 text-white leading-none">
                        {getWinRate(player.wins, player.matches)}
                      </div>
                      <div className="text-xs text-gray-400 font-normal uppercase tracking-wider">
                        Win Rate
                      </div>
                    </div>
                  )}

                  {player.kills !== undefined && (
                    <div className="text-center p-6 border border-white/10 rounded-xl bg-black/20 hover:border-white/20 hover:bg-black/30 transition-all">
                      <div className="text-4xl sm:text-5xl font-light mb-3 text-white leading-none">
                        {formatValue(player.kills)}
                      </div>
                      <div className="text-xs text-gray-400 font-normal uppercase tracking-wider">
                        Kills
                      </div>
                    </div>
                  )}

                  {player.deaths !== undefined && (
                    <div className="text-center p-6 border border-white/10 rounded-xl bg-black/20 hover:border-white/20 hover:bg-black/30 transition-all">
                      <div className="text-4xl sm:text-5xl font-light mb-3 text-white leading-none">
                        {formatValue(player.deaths)}
                      </div>
                      <div className="text-xs text-gray-400 font-normal uppercase tracking-wider">
                        Deaths
                      </div>
                    </div>
                  )}

                  {player.kills !== undefined && player.deaths !== undefined && (
                    <div className="text-center p-6 border border-white/10 rounded-xl bg-black/20 hover:border-white/20 hover:bg-black/30 transition-all">
                      <div className="text-4xl sm:text-5xl font-light mb-3 text-white leading-none">
                        {getKD(player.kills, player.deaths)}
                      </div>
                      <div className="text-xs text-gray-400 font-normal uppercase tracking-wider">
                        K/D Ratio
                      </div>
                    </div>
                  )}

                  {player.assists !== undefined && (
                    <div className="text-center p-6 border border-white/10 rounded-xl bg-black/20 hover:border-white/20 hover:bg-black/30 transition-all">
                      <div className="text-4xl sm:text-5xl font-light mb-3 text-white leading-none">
                        {formatValue(player.assists)}
                      </div>
                      <div className="text-xs text-gray-400 font-normal uppercase tracking-wider">
                        Assists
                      </div>
                    </div>
                  )}

                  {player.mvps !== undefined && (
                    <div className="text-center p-6 border border-white/10 rounded-xl bg-black/20 hover:border-white/20 hover:bg-black/30 transition-all">
                      <div className="text-4xl sm:text-5xl font-light mb-3 text-white leading-none">
                        {formatValue(player.mvps)}
                      </div>
                      <div className="text-xs text-gray-400 font-normal uppercase tracking-wider">
                        MVPs
                      </div>
                    </div>
                  )}

                  {player.svps !== undefined && (
                    <div className="text-center p-6 border border-white/10 rounded-xl bg-black/20 hover:border-white/20 hover:bg-black/30 transition-all">
                      <div className="text-4xl sm:text-5xl font-light mb-3 text-white leading-none">
                        {formatValue(player.svps)}
                      </div>
                      <div className="text-xs text-gray-400 font-normal uppercase tracking-wider">
                        SVPs
                      </div>
                    </div>
                  )}

                  {player.play_time && (
                    <div className="text-center p-6 border border-white/10 rounded-xl bg-black/20 hover:border-white/20 hover:bg-black/30 transition-all">
                      <div className="text-2xl sm:text-3xl font-light mb-3 text-white leading-none">
                        {player.play_time}
                      </div>
                      <div className="text-xs text-gray-400 font-normal uppercase tracking-wider">
                        Play Time
                      </div>
                    </div>
                  )}

                  {player.total_hero_damage && (
                    <div className="text-center p-6 border border-white/10 rounded-xl bg-black/20 hover:border-white/20 hover:bg-black/30 transition-all">
                      <div className="text-2xl sm:text-3xl font-light mb-3 text-white leading-none">
                        {formatValue(parseFloat(player.total_hero_damage))}
                      </div>
                      <div className="text-xs text-gray-400 font-normal uppercase tracking-wider">
                        Total Damage
                      </div>
                    </div>
                  )}

                  {player.total_damage_taken && (
                    <div className="text-center p-6 border border-white/10 rounded-xl bg-black/20 hover:border-white/20 hover:bg-black/30 transition-all">
                      <div className="text-2xl sm:text-3xl font-light mb-3 text-white leading-none">
                        {formatValue(parseFloat(player.total_damage_taken))}
                      </div>
                      <div className="text-xs text-gray-400 font-normal uppercase tracking-wider">
                        Damage Taken
                      </div>
                    </div>
                  )}

                  {player.total_hero_heal && (
                    <div className="text-center p-6 border border-white/10 rounded-xl bg-black/20 hover:border-white/20 hover:bg-black/30 transition-all">
                      <div className="text-2xl sm:text-3xl font-light mb-3 text-white leading-none">
                        {formatValue(parseFloat(player.total_hero_heal))}
                      </div>
                      <div className="text-xs text-gray-400 font-normal uppercase tracking-wider">
                        Total Healing
                      </div>
                    </div>
                  )}
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

