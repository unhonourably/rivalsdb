'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

const PAGE_LIMIT = 25

interface LeaderboardPlayer {
  uid: string
  name: string
  score: number
  rank_score?: number
  rank_label?: string
  rank_color?: string
  rank_image?: string
  win_rate?: string
  win_count?: number
  battle_count?: number
  level?: number
  season_max_level?: number
  max_level?: number
  protect_score?: number
  diff_score?: number
  max_rank_score?: number
  season_number?: number
  player_icon?: string
  rank_position?: number
}

interface LeaderboardResponse {
  page: number
  limit: number
  total_players: number
  total_pages: number
  players: LeaderboardPlayer[]
}

const getIconCandidates = (iconPath?: string): string[] => {
  if (!iconPath) return []
  if (iconPath.startsWith('http')) return [iconPath]

  const candidates: string[] = []

  if (iconPath.startsWith('/rivals/')) {
    candidates.push(`https://marvelrivalsapi.com${iconPath}`)
  }

  if (iconPath.startsWith('/players/')) {
    candidates.push(`https://marvelrivalsapi.com/rivals${iconPath}`)
    candidates.push(`https://marvelrivalsapi.com${iconPath}`)
  }

  if (candidates.length === 0) {
    candidates.push(`https://marvelrivalsapi.com${iconPath}`)
  }

  return Array.from(new Set(candidates))
}

const formatNumber = (value: number | undefined | null, fractionDigits = 0): string => {
  if (value === null || value === undefined || Number.isNaN(value)) return '-'
  return value.toLocaleString(undefined, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })
}

export default function LeaderboardsPage() {
  const [page, setPage] = useState(1)
  const [data, setData] = useState<LeaderboardResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const totalPages = data?.total_pages ?? 1
  const totalPlayers = data?.total_players ?? 0
  const players = data?.players ?? []

  useEffect(() => {
    const controller = new AbortController()
    let cancelled = false

    const fetchLeaderboard = async () => {
      try {
        setLoading(true)
        setError(null)

        await fetch('/api/leaderboard/auto-refresh', { cache: 'no-store' }).catch(() => {})

        const response = await fetch(
          `/api/leaderboard?page=${page}&limit=${PAGE_LIMIT}`,
          {
            signal: controller.signal,
            cache: 'no-store'
          }
        )

        if (!response.ok) {
          throw new Error(`Failed to load leaderboard (${response.status})`)
        }

        const payload: LeaderboardResponse = await response.json()
        if (!cancelled) {
          setData(payload)
        }
      } catch (err) {
        if (controller.signal.aborted) return
        if (!cancelled) {
          if (err instanceof Error) {
            setError(err.message)
          } else {
            setError('Failed to load leaderboard')
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchLeaderboard()

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [page])

  const firstRankIndex = useMemo(() => (page - 1) * PAGE_LIMIT, [page])

  const handlePrev = () => {
    setPage((prev) => Math.max(1, prev - 1))
  }

  const handleNext = () => {
    if (data?.total_pages) {
      setPage((prev) => Math.min(data.total_pages, prev + 1))
    } else {
      setPage((prev) => prev + 1)
    }
  }

  const handlePageInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(event.target.value)
    if (Number.isNaN(value)) return
    if (value < 1) {
      setPage(1)
      return
    }
    if (totalPages) {
      setPage(Math.min(totalPages, value))
    } else {
      setPage(value)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-black">
      <Navbar />
      <div className="background"></div>

      <main className="flex-1 pt-32 pb-24">
        <div className="max-w-6xl mx-auto px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10">
            <div>
              <h1 className="text-4xl md:text-5xl font-semibold mb-3 bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent" style={{ fontFamily: 'var(--font-fredoka)' }}>Global Leaderboards</h1>
              <p className="text-gray-400 max-w-2xl">
                Track the top Marvel Rivals players worldwide. Rankings update live from the official API.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-400">
                Page <span className="text-white">{page}</span>{' '}
                {totalPages ? (
                  <>
                    of <span className="text-white">{totalPages}</span>
                  </>
                ) : null}
              </div>
              <input
                type="number"
                min={1}
                max={totalPages || undefined}
                value={page}
                onChange={handlePageInput}
                className="w-20 bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30"
              />
            </div>
          </div>

          {error && (
            <div className="border border-red-500/30 bg-red-500/10 text-red-300 rounded-2xl p-6 mb-8">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-24">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
                <p className="text-gray-400 mt-4">Loading leaderboard...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {players.map((player, index) => {
                const rankNumber = player.rank_position ?? (firstRankIndex + index + 1)
                const iconCandidates = getIconCandidates(player.player_icon)
                const primaryColor = player.rank_color || '#ffffff'

                return (
                  <div
                    key={`${player.uid}-${rankNumber}`}
                    className="border border-white/10 bg-white/[0.02] rounded-2xl p-6 md:p-8 hover:border-white/20 transition-all"
                  >
                    <div className="flex flex-col md:flex-row md:items-center gap-6">
                      <div className="flex items-center gap-4 min-w-[80px]">
                        <div className="text-3xl font-semibold text-gray-500">#{rankNumber}</div>
                        {iconCandidates.length > 0 ? (
                          <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-white/10">
                            <img
                              src={iconCandidates[0]}
                              alt={player.name || 'Player'}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              data-attempt="0"
                              onError={(event) => {
                                const target = event.target as HTMLImageElement
                                const attempts = getIconCandidates(player.player_icon)
                                const nextAttempt = Number(target.dataset.attempt || '0') + 1
                                const nextSrc = attempts[nextAttempt]
                                if (nextSrc) {
                                  target.dataset.attempt = String(nextAttempt)
                                  target.src = nextSrc
                                } else {
                                  target.style.display = 'none'
                                }
                              }}
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 rounded-full border border-white/10 bg-black/40 flex items-center justify-center text-gray-500 text-sm">
                            N/A
                          </div>
                        )}
                      </div>

                      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <Link
                            href={`/players/${player.uid}`}
                            prefetch={true}
                            className="text-2xl font-medium text-white hover:text-red-400 transition-colors"
                          >
                            {player.name || 'Unknown Player'}
                          </Link>
                          <div className="text-sm text-gray-400 mt-2 flex items-center gap-2">
                            <span>UID:</span>
                            <span className="text-white/80">{player.uid}</span>
                          </div>
                          {player.rank_label && (
                            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 border border-white/10 rounded-full bg-black/40 text-sm">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: primaryColor }}></span>
                              <span className="text-white">{player.rank_label}</span>
                            </div>
                          )}
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Rank Score</span>
                            <span className="text-white">{formatNumber(player.rank_score, 2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Score</span>
                            <span className="text-white">{formatNumber(player.score, 0)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Diff</span>
                            <span className="text-white">{formatNumber(player.diff_score, 2)}</span>
                          </div>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Win Rate</span>
                            <span className="text-white">{player.win_rate || '-'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Wins / Battles</span>
                            <span className="text-white">
                              {formatNumber(player.win_count, 0)} / {formatNumber(player.battle_count, 0)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Level (Max)</span>
                            <span className="text-white">
                              {formatNumber(player.level, 0)}
                              {player.season_max_level ? ` / ${formatNumber(player.season_max_level, 0)}` : ''}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}

              {players.length === 0 && !loading && !error && (
                <div className="border border-white/10 bg-white/[0.02] rounded-2xl p-10 text-center text-gray-400">
                  No leaderboard data available.
                </div>
              )}

              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-6">
                <div className="text-sm text-gray-400">
                  Showing{' '}
                  <span className="text-white">{players.length}</span>{' '}
                  of{' '}
                  <span className="text-white">{totalPlayers.toLocaleString()}</span>{' '}
                  players
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handlePrev}
                    disabled={page === 1 || loading}
                    className="px-4 py-2 rounded-lg border border-white/10 bg-black/40 text-sm text-white hover:border-white/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <div className="text-sm text-gray-400">
                    Page <span className="text-white">{page}</span>{' '}
                    {totalPages ? (
                      <>
                        of <span className="text-white">{totalPages}</span>
                      </>
                    ) : null}
                  </div>
                  <button
                    onClick={handleNext}
                    disabled={loading || (totalPages ? page >= totalPages : false)}
                    className="px-4 py-2 rounded-lg border border-white/10 bg-black/40 text-sm text-white hover:border-white/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}

