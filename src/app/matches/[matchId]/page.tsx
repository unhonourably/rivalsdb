'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

const API_KEY = '188d3cd06e7db493dbd00811774d009528e8516c560a6b3e2751c2e411c40f9f'
const API_BASE = 'https://marvelrivalsapi.com/api/v1'

interface MatchPlayerHero {
  hero_id?: number
  play_time?: number
  kills?: number
  deaths?: number
  assists?: number
  session_hit_rate?: number
  hero_icon?: string
}

interface MatchPlayer {
  player_uid: string
  nick_name?: string
  player_icon?: string
  camp?: string
  cur_hero_id?: number
  cur_hero_icon?: string
  is_win?: boolean
  kills?: number
  deaths?: number
  assists?: number
  total_hero_damage?: number
  total_hero_heal?: number
  total_damage_taken?: number
  player_heroes?: MatchPlayerHero[]
}

interface MatchDetails {
  match_uid: string
  game_mode?: {
    game_mode_id?: number
    game_mode_name?: string
  }
  replay_id?: string
  map_id?: number
  map_name?: string
  map_thumbnail?: string
  map_icon?: string
  duration?: number
  start_time?: number
  mvp_uid?: string
  mvp_hero_id?: number
  svp_uid?: string
  svp_hero_id?: number
  dynamic_fields?: Record<string, unknown>
  match_players?: MatchPlayer[]
}

interface MatchResponse {
  match_details?: MatchDetails
}

const toTitleCase = (str: string | undefined | null): string => {
  if (!str) return ''
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const formatDuration = (seconds?: number): string => {
  if (!seconds || Number.isNaN(seconds)) return '-'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  const hours = Math.floor(mins / 60)
  const displayMins = mins % 60
  if (hours > 0) {
    return `${hours}h ${displayMins}m`
  }
  return `${mins}m ${secs.toString().padStart(2, '0')}s`
}

const formatNumber = (value: number | undefined, fractionDigits = 0): string => {
  if (value === null || value === undefined || Number.isNaN(value)) return '-'
  return value.toLocaleString(undefined, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits
  })
}

const formatPercentage = (value?: number): string => {
  if (value === null || value === undefined || Number.isNaN(value)) return '-'
  return `${value.toFixed(1)}%`
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

interface SmartImageProps {
  paths: string[]
  alt: string
  className?: string
  containerClassName?: string
}

const SmartImage: React.FC<SmartImageProps> = ({ paths, alt, className, containerClassName }) => {
  const [attempt, setAttempt] = useState(0)
  const src = paths[attempt]

  if (!src) return null

  return (
    <div className={containerClassName}>
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
        style={{ opacity: 0, animation: 'fadeIn 0.4s forwards' }}
      />
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.98); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}

const formatCampLabel = (camp: unknown): string => {
  if (typeof camp === 'string') {
    const trimmed = camp.trim()
    if (!trimmed) return 'Team 2'
    if (/^[01]$/.test(trimmed)) {
      const num = Number(trimmed) + 1
      return `Team ${num}`
    }
    return trimmed.length === 1 ? `Team ${trimmed.toUpperCase()}` : toTitleCase(trimmed.replace(/_/g, ' '))
  }
  if (camp === null || camp === undefined) return 'Team 2'
  const converted = String(camp).trim()
  if (!converted) return 'Team 2'
  if (/^[01]$/.test(converted)) {
    const num = Number(converted) + 1
    return `Team ${num}`
  }
  return converted.length === 1 ? `Team ${converted.toUpperCase()}` : toTitleCase(converted.replace(/_/g, ' '))
}

const getCampKey = (camp: unknown): string => {
  if (typeof camp === 'string' && camp.trim()) {
    const trimmed = camp.trim()
    if (/^[01]$/.test(trimmed)) {
      return String(Number(trimmed) + 1)
    }
    return trimmed.toUpperCase()
  }
  if (camp === null || camp === undefined) return 'UNKNOWN'
  const converted = String(camp).trim()
  if (/^[01]$/.test(converted)) {
    return String(Number(converted) + 1)
  }
  return converted.toUpperCase() || 'UNKNOWN'
}

const getTeamLabelByIndex = (index: number): string => `Team ${index + 1}`

const getPrimaryHeroIcon = (player: MatchPlayer): string | undefined => {
  const heroes = player.player_heroes || []
  const sorted = [...heroes].sort((a, b) => (b.play_time || 0) - (a.play_time || 0))
  return sorted[0]?.hero_icon || player.cur_hero_icon
}

const HERO_NAME_CACHE: Record<number, string> = {}

const ensureHeroName = async (
  heroId: number,
  setHeroNames: React.Dispatch<React.SetStateAction<Record<number, string>>>
) => {
  if (!heroId || HERO_NAME_CACHE[heroId]) return HERO_NAME_CACHE[heroId]
  try {
    const response = await fetch(`${API_BASE}/heroes/hero/${heroId}`, {
      headers: { 'x-api-key': API_KEY }
    })
    if (!response.ok) return undefined
    const data = await response.json()
    const rawName = data?.hero?.name || data?.name
    if (rawName) {
      const formatted = toTitleCase(rawName)
      HERO_NAME_CACHE[heroId] = formatted
      setHeroNames((prev) => ({ ...prev, [heroId]: formatted }))
      return formatted
    }
  } catch (err) {
    console.warn('Failed to fetch hero name', heroId, err)
  }
  return undefined
}

const getHeroDisplayName = (heroId?: number, heroNames?: Record<number, string>): string => {
  if (!heroId) return 'Unknown Hero'
  const cached = heroNames?.[heroId] || HERO_NAME_CACHE[heroId]
  if (cached) return toTitleCase(cached)
  return `Hero #${heroId}`
}

export default function MatchDetailPage() {
  const params = useParams()
  const router = useRouter()
  const matchId = params.matchId as string

  const [matchData, setMatchData] = useState<MatchResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedPlayers, setExpandedPlayers] = useState<Record<string, boolean>>({})
  const [heroNames, setHeroNames] = useState<Record<number, string>>({})

  useEffect(() => {
    if (!matchId) return

    const controller = new AbortController()
    let cancelled = false

    const fetchMatch = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`${API_BASE}/match/${matchId}`, {
          headers: { 'x-api-key': API_KEY },
          signal: controller.signal
        })

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Match not found')
          }
          if (response.status === 429) {
            throw new Error('Rate limit exceeded. Please try again in a moment.')
          }
          throw new Error(`Failed to load match data (${response.status})`)
        }

        const data: MatchResponse = await response.json()
        if (!cancelled) {
          setMatchData(data)
          const heroIds = new Set<number>()
          data.match_details?.match_players?.forEach((player) => {
            if (typeof player.cur_hero_id === 'number') heroIds.add(player.cur_hero_id)
            player.player_heroes?.forEach((hero) => {
              if (typeof hero.hero_id === 'number') heroIds.add(hero.hero_id)
            })
          })

          heroIds.forEach((id) => {
            ensureHeroName(id, setHeroNames)
          })
        }
      } catch (err) {
        if (controller.signal.aborted) return
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Failed to load match data'
          setError(message)
          console.error('Failed to fetch match details:', err)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchMatch()

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [matchId])

  const details = matchData?.match_details
  const players = details?.match_players ?? []

  const mapName = useMemo(() => {
    if (!details) return 'Unknown Map'
    return (
      toTitleCase(details.map_name || '') ||
      toTitleCase((details as any)?.map?.name || '') ||
      (details.map_id !== undefined ? `Map ${details.map_id}` : 'Unknown Map')
    )
  }, [details])

  const mapImageCandidates = useMemo(() => {
    if (!details) return []
    return getAssetCandidates(details.map_thumbnail || (details as any)?.map_icon)
  }, [details])

  const teams = useMemo(() => {
    const grouped = new Map<string, MatchPlayer[]>()
    players.forEach(player => {
      const campKey = getCampKey(player.camp)
      if (!grouped.has(campKey)) {
        grouped.set(campKey, [])
      }
      grouped.get(campKey)!.push(player)
    })
    return Array.from(grouped.entries())
  }, [players])

  const mvpUid = details?.mvp_uid
  const svpUid = details?.svp_uid

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-black">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
            <p className="text-gray-400 mt-4">Loading match details...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (error || !details) {
    return (
      <div className="min-h-screen flex flex-col bg-black">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-400 mb-4">{error || 'Match not found'}</p>
            <button
              onClick={() => router.back()}
              className="px-6 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  const gameModeName = toTitleCase(details.game_mode?.game_mode_name || '') || 'Unknown Mode'
  const replayId = details.replay_id
  const matchDuration = formatDuration(details.duration)
  const matchStart = details.start_time ? new Date(details.start_time * 1000).toLocaleString() : null

  return (
    <div className="min-h-screen flex flex-col bg-black">
      <Navbar />
      <div className="background"></div>

      <main className="flex-1 pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <div className="text-sm text-gray-400">Match ID: <span className="text-white/80">{details.match_uid}</span></div>
          </div>

          <div className="border border-white/10 bg-white/[0.02] rounded-3xl overflow-hidden mb-10">
            {mapImageCandidates.length > 0 && (
              <div className="relative h-64 w-full overflow-hidden">
                <SmartImage
                  paths={mapImageCandidates}
                  alt={mapName}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/20"></div>
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <div className="flex flex-wrap items-end gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.35em] text-gray-300 mb-2">{gameModeName}</p>
                      <h1 className="text-4xl md:text-5xl font-light text-white">{mapName}</h1>
                    </div>
                    <div className="text-sm text-gray-200/80">
                      <div>Duration: <span className="text-white">{matchDuration}</span></div>
                      {matchStart && <div>Started: <span className="text-white/80">{matchStart}</span></div>}
                      {replayId && <div>Replay ID: <span className="text-white/80">{replayId}</span></div>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="p-8 space-y-8">
              <section>
                <h2 className="text-2xl font-light text-white mb-4">Scoreboard</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {teams.map(([camp, roster], teamIndex) => {
                    const totalKills = roster.reduce((sum, player) => sum + (player.kills || 0), 0)
                    const totalDeaths = roster.reduce((sum, player) => sum + (player.deaths || 0), 0)
                    const totalAssists = roster.reduce((sum, player) => sum + (player.assists || 0), 0)
                    const totalDamage = roster.reduce((sum, player) => sum + (player.total_hero_damage || 0), 0)
                    const totalDamageTaken = roster.reduce((sum, player) => sum + (player.total_damage_taken || 0), 0)
                    const isWinningCamp = roster.some(player => player.is_win)
                    const campLabel = getTeamLabelByIndex(teamIndex)

                    return (
                      <div
                        key={camp}
                        className={`rounded-2xl border p-6 transition-all ${
                          isWinningCamp
                            ? 'border-green-500/40 bg-green-500/10'
                            : 'border-red-500/40 bg-red-500/10'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-white">{campLabel}</h3>
                          <div className={`text-sm font-medium ${isWinningCamp ? 'text-green-400' : 'text-red-400'}`}>
                            {isWinningCamp ? 'Victory' : 'Defeat'}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-sm text-gray-300">
                          <div className="rounded-lg bg-black/30 border border-white/5 p-3 text-center">
                            <div className="text-xs uppercase tracking-[0.25em] text-gray-500 mb-1">Kills</div>
                            <div className="text-lg text-white">{totalKills}</div>
                          </div>
                          <div className="rounded-lg bg-black/30 border border-white/5 p-3 text-center">
                            <div className="text-xs uppercase tracking-[0.25em] text-gray-500 mb-1">Deaths</div>
                            <div className="text-lg text-white">{totalDeaths}</div>
                          </div>
                          <div className="rounded-lg bg-black/30 border border-white/5 p-3 text-center">
                            <div className="text-xs uppercase tracking-[0.25em] text-gray-500 mb-1">Assists</div>
                            <div className="text-lg text-white">{totalAssists}</div>
                          </div>
                          <div className="rounded-lg bg-black/30 border border-white/5 p-3 text-center">
                            <div className="text-xs uppercase tracking-[0.25em] text-gray-500 mb-1">Damage</div>
                            <div className="text-lg text-white">{formatNumber(totalDamage)}</div>
                          </div>
                          <div className="rounded-lg bg-black/30 border border-white/5 p-3 text-center">
                            <div className="text-xs uppercase tracking-[0.25em] text-gray-500 mb-1">Taken</div>
                            <div className="text-lg text-white">{formatNumber(totalDamageTaken)}</div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-light text-white mb-4">Players</h2>
                <div className="space-y-8">
                  {teams.map(([camp, roster], teamIndex) => {
                    const campLabel = getTeamLabelByIndex(teamIndex)
                    const sortedRoster = [...roster].sort((a, b) => (b.kills || 0) - (a.kills || 0))

                    return (
                      <div key={camp} className="border border-white/10 bg-white/[0.02] rounded-3xl p-6 team-panel">
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                          <h3 className="text-lg font-semibold text-white">{campLabel}</h3>
                          <div className="text-xs uppercase tracking-[0.35em] text-gray-500">Players: {roster.length}</div>
                        </div>

                        <div className="space-y-4">
                          {sortedRoster.map((player) => {
                            const playerKey = `${camp}-${player.player_uid}`
                            const isExpanded = !!expandedPlayers[playerKey]
                            const toggle = () => {
                              setExpandedPlayers((prev) => ({
                                ...prev,
                                [playerKey]: !prev[playerKey]
                              }))
                            }

                            const primaryHeroIcon = getPrimaryHeroIcon(player)
                            let avatarCandidates = getAssetCandidates(primaryHeroIcon)
                            if (avatarCandidates.length === 0) {
                              avatarCandidates = getAssetCandidates(player.player_icon)
                            }
                            let heroCandidates = getAssetCandidates(primaryHeroIcon)
                            if (heroCandidates.length === 0) {
                              heroCandidates = getAssetCandidates(player.cur_hero_icon)
                            }
                            const playerHeroes = player.player_heroes || []
                            const isMvp = mvpUid && player.player_uid === mvpUid
                            const isSvp = svpUid && player.player_uid === svpUid

                            return (
                              <div key={player.player_uid} className="border border-white/10 bg-black/30 rounded-2xl overflow-hidden player-card">
                                <div className="flex flex-col lg:flex-row lg:items-start gap-4 p-4 bg-black/40">
                                  <div className="flex items-center gap-4 flex-1">
                                    {avatarCandidates.length > 0 && (
                                      <SmartImage
                                        paths={avatarCandidates}
                                        alt={player.nick_name || player.player_uid}
                                        className="w-full h-full object-cover"
                                        containerClassName="relative w-12 h-12 rounded-full overflow-hidden border border-white/10"
                                      />
                                    )}
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <Link
                                          href={`/players/${player.player_uid}`}
                                          className="text-lg font-medium text-white hover:text-red-400 transition-colors"
                                        >
                                          {player.nick_name || player.player_uid}
                                        </Link>
                                        {isMvp && <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">MVP</span>}
                                        {isSvp && <span className="px-2 py-0.5 text-xs rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">SVP</span>}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-300">
                                    <div>
                                      <span className="text-gray-500">K/D/A:</span>{' '}
                                      <span className="text-white">{player.kills ?? 0}/{player.deaths ?? 0}/{player.assists ?? 0}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Damage:</span>{' '}
                                      <span className="text-white">{formatNumber(player.total_hero_damage)}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Taken:</span>{' '}
                                      <span className="text-white">{formatNumber(player.total_damage_taken)}</span>
                                    </div>
                                    <div>
                                      <span className="text-gray-500">Healing:</span>{' '}
                                      <span className="text-white">{formatNumber(player.total_hero_heal)}</span>
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={toggle}
                                    aria-expanded={isExpanded}
                                    className="ml-auto inline-flex items-center justify-center w-9 h-9 rounded-full border border-white/10 bg-white/5 text-white hover:bg-white/10 transition-colors"
                                  >
                                    <svg
                                      className={`w-4 h-4 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </button>
                                </div>

                                {isExpanded && (
                                  <div className="px-5 pt-5 pb-5 space-y-5 border-t border-white/10">
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                                      <div className="rounded-lg bg-black/30 border border-white/5 p-3 text-center">
                                        <div className="text-xs text-gray-400 uppercase tracking-[0.25em] mb-1">Kills</div>
                                        <div className="text-lg text-white">{player.kills ?? '-'}</div>
                                      </div>
                                      <div className="rounded-lg bg-black/30 border border-white/5 p-3 text-center">
                                        <div className="text-xs text-gray-400 uppercase tracking-[0.25em] mb-1">Deaths</div>
                                        <div className="text-lg text-white">{player.deaths ?? '-'}</div>
                                      </div>
                                      <div className="rounded-lg bg-black/30 border border-white/5 p-3 text-center">
                                        <div className="text-xs text-gray-400 uppercase tracking-[0.25em] mb-1">Assists</div>
                                        <div className="text-lg text-white">{player.assists ?? '-'}</div>
                                      </div>
                                      <div className="rounded-lg bg-black/30 border border-white/5 p-3 text-center">
                                        <div className="text-xs text-gray-400 uppercase tracking-[0.25em] mb-1">Hit Rate</div>
                                        <div className="text-lg text-white">
                                          {playerHeroes[0]?.session_hit_rate !== undefined
                                            ? formatPercentage(playerHeroes[0]?.session_hit_rate)
                                            : '-'}
                                        </div>
                                      </div>
                                    </div>

                                    {playerHeroes.length > 0 && (
                                      <div>
                                        <h4 className="text-xs uppercase tracking-[0.35em] text-gray-500 mb-3">Heroes Played</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                          {playerHeroes.map((hero, idx) => {
                                            const heroIconCandidates = getAssetCandidates(hero.hero_icon)
                                            return (
                                              <div key={idx} className="flex items-center gap-3 p-3 rounded-lg border border-white/10 bg-white/[0.02]">
                                                {heroIconCandidates.length > 0 && (
                                                  <SmartImage
                                                    paths={heroIconCandidates}
                                                    alt={`Hero ${hero.hero_id}`}
                                                    className="w-full h-full object-cover"
                                                    containerClassName="relative w-10 h-10 rounded overflow-hidden border border-white/10"
                                                  />
                                                )}
                                                <div className="text-xs text-gray-300 space-y-1">
                                                  <div className="text-white/90 font-medium">{getHeroDisplayName(hero.hero_id, heroNames)}</div>
                                                  <div>Time: <span className="text-white">{formatDuration(hero.play_time)}</span></div>
                                                  <div>K/D/A: <span className="text-white">{hero.kills ?? 0}/{hero.deaths ?? 0}/{hero.assists ?? 0}</span></div>
                                                  {hero.session_hit_rate !== undefined && (
                                                    <div>Hit Rate: <span className="text-white">{formatPercentage(hero.session_hit_rate)}</span></div>
                                                  )}
                                                </div>
                                              </div>
                                            )
                                          })}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      <style jsx global>{`
        .team-panel {
          transition: border-color 0.3s ease, background-color 0.3s ease, transform 0.3s ease;
        }
        .team-panel:hover {
          border-color: rgba(255,255,255,0.25);
          background-color: rgba(255,255,255,0.05);
        }
        .player-card {
          transition: border-color 0.25s ease, background-color 0.25s ease, transform 0.25s ease;
        }
        .player-card:hover {
          border-color: rgba(255,255,255,0.25);
          background-color: rgba(255,255,255,0.07);
        }
      `}</style>
    </div>
  )
}

