'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

const API_KEY = '188d3cd06e7db493dbd00811774d009528e8516c560a6b3e2751c2e411c40f9f'
const API_BASE = 'https://marvelrivalsapi.com/api/v1'
const API_BASE_V2 = 'https://marvelrivalsapi.com/api/v2'

interface PlayerDetail {
  uid: number
  name: string
  updates?: {
    info_update_time?: string
    last_history_update?: string
    last_inserted_match?: string
    last_update_request?: string
  }
  player?: {
    uid: number
    level: string
    name: string
    icon?: {
      player_icon_id?: string
      player_icon?: string
      banner?: string
    }
    rank?: {
      rank: string
      score?: string
      unit?: string
      icon?: string
      color: string
      peak_rank?: {
        rank: string
        score?: string
        unit?: string
        icon?: string
        color: string
      }
    }
    team?: {
      club_team_id?: string
      club_team_mini_name?: string
      club_team_type?: string
    }
    info?: {
      completed_achievements?: string
      login_os?: string
      rank_game_season?: any
    }
  }
  isPrivate?: boolean
  overall_stats?: {
    total_matches: number
    total_wins: number | {
      wins?: number
      percentile_raw?: number
      percentile?: string
      win_percentage?: {
        percentile_raw?: number
        percentile?: number
        placement?: string
      }
    }
    total_play_time?: {
      time_played?: number
      playtime?: string
    }
    per_minute?: {
      total_damage_per_minute?: number
      total_damage_taken_per_minute?: number
      total_healing_per_minute?: number
    }
    overall_kd?: number
    overall_kda?: number | {
      kda?: number
      percentile_raw?: number
      percentile?: string
    }
    total_mvps?: {
      mvps?: number
      mvp_percentage?: {
        percentile_raw?: number
        percentile?: number
        placement?: string
      }
    }
    total_svps?: {
      svps?: number
      svp_percentage?: {
        percentile_raw?: number
        percentile?: number
        placement?: string
      }
    }
    total_kills?: {
      kills?: number
      percentile_raw?: number
      percentile?: string
    }
    total_deaths?: {
      deaths?: number
    }
    total_assists?: {
      assists?: number
    }
    total_damage?: {
      damage?: string
      raw?: number
    }
    total_healing?: {
      healing?: string
      raw?: number
    }
    total_damage_taken?: {
      damage_taken?: string
      raw?: number
    }
    max_kill_streak?: {
      damage_taken?: number
    }
    roles_played?: {
      duelist?: {
        total_time_played?: {
          time_played?: number
          playtime?: string
        }
        matches_played?: number
        matches_won?: string
        win_percentage?: {
          win_rate?: string
          win_rate_raw?: number
        }
        kills?: number
        deaths?: number
        assists?: number
        kd_ratio?: {
          kd?: string
          kd_raw?: number
        }
        kda_ratio?: {
          kda?: string
          kda_raw?: number
        }
        total_damage?: {
          damage?: string
          raw?: number
        }
        total_damage_taken?: {
          damage_taken?: string
          raw?: number
        }
        total_damage_taken_per_minute?: string
        total_healing?: {
          healing?: string | null
          raw?: number | null
        }
        total_healing_per_minute?: {
          healing?: string
          raw?: number
        }
      }
      strategist?: {
        total_time_played?: {
          time_played?: number
          playtime?: string
        }
        matches_played?: number
        matches_won?: string
        win_percentage?: {
          win_rate?: string
          win_rate_raw?: number
        }
        kills?: number
        deaths?: number
        assists?: number
        kd_ratio?: {
          kd?: string
          kd_raw?: number
        }
        kda_ratio?: {
          kda?: string
          kda_raw?: number
        }
        total_damage?: {
          damage?: string
          raw?: number
        }
        total_damage_taken?: {
          damage_taken?: string
          raw?: number
        }
        total_damage_taken_per_minute?: string
        total_healing?: {
          healing?: string | null
          raw?: number | null
        }
        total_healing_per_minute?: {
          healing?: string
          raw?: number
        }
      }
      vanguard?: {
        total_time_played?: {
          time_played?: number
          playtime?: string
        }
        matches_played?: number
        matches_won?: string
        win_percentage?: {
          win_rate?: string
          win_rate_raw?: number
        }
        kills?: number
        deaths?: number
        assists?: number
        kd_ratio?: {
          kd?: string
          kd_raw?: number
        }
        kda_ratio?: {
          kda?: string
          kda_raw?: number
        }
        total_damage?: {
          damage?: string
          raw?: number
        }
        total_damage_taken?: {
          damage_taken?: string
          raw?: number
        }
        total_damage_taken_per_minute?: string
        total_healing?: {
          healing?: string | null
          raw?: number | null
        }
        total_healing_per_minute?: {
          healing?: string
          raw?: number
        }
      }
    }
    unranked: {
      total_matches: number
      total_wins: number
      total_assists: number
      total_deaths: number
      total_kills: number
      total_time_played: string
      total_time_played_raw: number
      total_mvp: number
      total_svp: number
    }
    ranked: {
      total_matches: number
      total_wins: number
      total_assists: number
      total_deaths: number
      total_kills: number
      total_time_played: string
      total_time_played_raw: number
      total_mvp: number
      total_svp: number
    }
  }
  match_history?: Array<{
    match_uid: string
    map_id: number
    map_thumbnail: string
    duration: number
    season: number
    winner_side: number
    mvp_uid: number
    svp_uid: number
    match_time_stamp: number
    play_mode_id: number
    game_mode_id: number
    score_info: { [key: string]: number }
    player_performance: {
      player_uid: number
      hero_id: number
      hero_name: string
      hero_type: string
      kills: number
      deaths: number
      assists: number
      is_win: { score: number; is_win: boolean }
      disconnected: boolean
      camp: number
      score_change: number
      level: number
      new_level: number
      new_score: number
    }
  }>
  rank_history?: Array<{
    match_time_stamp: number
    level_progression: { from: number; to: number }
    score_progression: { add_score: number; total_score: number }
  }>
  hero_matchups?: Array<{
    hero_id: number
    hero_name: string
    hero_class: string
    hero_thumbnail: string
    matches: number
    wins: number
    win_rate: string
  }>
  team_mates?: Array<{
    player_info: {
      nick_name: string
      player_icon: string
      player_uid: number
    }
    matches: number
    wins: number
    win_rate: string
  }>
  heroes_ranked?: Array<{
    hero_id: number
    hero_name: string
    hero_thumbnail: string
    matches: number
    wins: number
    mvp: number
    svp: number
    kills: number
    deaths: number
    assists: number
    play_time: number
    damage: number
    heal: number
    damage_taken: number
    main_attack: { total: number; hits: number }
  }>
  maps?: Array<{
    map_id: number
    map_thumbnail: string
    matches: number
    wins: number
    kills: number
    deaths: number
    assists: number
    play_time: number
  }>
}

export default function PlayerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const playerId = params.id as string

  const [playerData, setPlayerData] = useState<PlayerDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'matches' | 'heroes' | 'maps' | 'teammates'>('overview')

  useEffect(() => {
    let mounted = true
    
    const fetchPlayerData = async () => {
      if (!playerId) return

      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`${API_BASE_V2}/player/${playerId}`, {
          headers: { 'x-api-key': API_KEY }
        })

        if (!response.ok) {
          if (response.status === 404) {
            throw new Error('Player not found')
          }
          if (response.status === 429) {
            throw new Error('Rate limit exceeded. Please try again in a moment.')
          }
          throw new Error(`Failed to load player data: ${response.status}`)
        }

        const data = await response.json()
        console.log('Player detail response:', data)
        
        if (mounted) {
          setPlayerData(data)
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to load player data')
          console.error('Error:', err)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    fetchPlayerData()
    
    return () => {
      mounted = false
    }
  }, [playerId])

  const formatValue = (val: any): string => {
    if (val === null || val === undefined) return '-'
    if (typeof val === 'string') return val
    if (typeof val === 'number') {
      if (val >= 0 && val <= 1 && val !== Math.floor(val)) {
        return `${(val * 100).toFixed(1)}%`
      }
      if (Math.abs(val) >= 1000000) {
        return `${(val / 1000000).toFixed(2)}M`
      }
      if (Math.abs(val) >= 1000) {
        return val.toLocaleString(undefined, { maximumFractionDigits: 0 })
      }
      if (val !== Math.floor(val)) {
        return val.toFixed(2)
      }
      return val.toString()
    }
    return String(val)
  }

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleString()
  }

  const toTitleCase = (str: string): string => {
    if (!str) return ''
    return str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-black">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
            <p className="text-gray-400 mt-4">Loading player data...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (error || !playerData) {
    return (
      <div className="min-h-screen flex flex-col bg-black">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-400 mb-4">{error || 'Player not found'}</p>
            <Link href="/players" className="px-6 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors">
              Back to Players
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  const player = playerData.player
  const overallStats = playerData.overall_stats
  const rankedStats = overallStats?.ranked

  return (
    <div className="min-h-screen flex flex-col bg-black">
      <Navbar />
      <div className="background"></div>

      <main className="flex-1 pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {/* Back Button */}
          <Link
            href="/players"
            className="inline-flex items-center text-gray-400 hover:text-white mb-8 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Players
          </Link>

          {/* Player Header */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Player Icon and Basic Info */}
            <div className="flex items-start gap-6">
              {player?.icon?.player_icon && (
                <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-white/10 flex-shrink-0">
                  <img
                    src={(() => {
                      const iconPath = player.icon.player_icon
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
                    alt={playerData.name || 'Player'}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      const iconPath = player.icon?.player_icon || ''
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
              <div className="flex-1">
                <h1 className="text-5xl sm:text-6xl font-light mb-4">
                  <span className="bubble-text red-glint" data-text={playerData.name}>{playerData.name}</span>
                </h1>
                {player?.rank && (
                  <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <div className="px-4 py-2 border rounded-lg" style={{ borderColor: player.rank.color, backgroundColor: `${player.rank.color}15` }}>
                      <span className="text-sm font-medium" style={{ color: player.rank.color }}>
                        {player.rank.rank} {player.rank.score && `(${player.rank.score} ${player.rank.unit || 'RS'})`}
                      </span>
                    </div>
                    {player?.level && (
                      <div className="px-4 py-2 border border-white/10 bg-white/5 rounded-lg">
                        <span className="text-sm text-white">Level {player.level}</span>
                      </div>
                    )}
                    {player.rank.peak_rank && (
                      <div className="px-4 py-2 border border-white/10 bg-white/5 rounded-lg">
                        <span className="text-xs text-gray-400">Peak: </span>
                        <span className="text-sm text-white" style={{ color: player.rank.peak_rank.color }}>
                          {player.rank.peak_rank.rank} {player.rank.peak_rank.score && `(${player.rank.peak_rank.score} ${player.rank.peak_rank.unit || 'RS'})`}
                        </span>
                      </div>
                    )}
                  </div>
                )}
                {player?.team && (
                  <div className="px-4 py-2 border border-white/10 bg-white/5 rounded-lg inline-block">
                    <span className="text-sm text-gray-300">{player.team.club_team_mini_name}</span>
                  </div>
                )}
              </div>
            </div>

             {/* Overall Stats Summary */}
            {overallStats && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="text-center p-6 border border-white/10 rounded-xl bg-black/20">
                  <div className="text-3xl font-light mb-2 text-white">{overallStats.total_matches}</div>
                  <div className="text-xs text-gray-400 uppercase tracking-wider">Matches</div>
                </div>
                <div className="text-center p-6 border border-white/10 rounded-xl bg-black/20">
                  <div className="text-3xl font-light mb-2 text-white">
                    {typeof overallStats.total_wins === 'object' 
                      ? overallStats.total_wins.wins || '-'
                      : overallStats.total_wins}
                  </div>
                  <div className="text-xs text-gray-400 uppercase tracking-wider">Wins</div>
                </div>
                <div className="text-center p-6 border border-white/10 rounded-xl bg-black/20">
                  <div className="text-3xl font-light mb-2 text-white">
                    {(() => {
                      const matches = overallStats.total_matches || 0
                      const wins = typeof overallStats.total_wins === 'object' 
                        ? overallStats.total_wins.wins || 0
                        : overallStats.total_wins || 0
                      return matches > 0 ? `${((wins / matches) * 100).toFixed(1)}%` : '-'
                    })()}
                  </div>
                  <div className="text-xs text-gray-400 uppercase tracking-wider">Win Rate</div>
                </div>
                {overallStats.total_kills && (
                  <div className="text-center p-6 border border-white/10 rounded-xl bg-black/20">
                    <div className="text-3xl font-light mb-2 text-white">
                      {typeof overallStats.total_kills === 'object' 
                        ? overallStats.total_kills.kills || '-'
                        : overallStats.total_kills}
                    </div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider">Kills</div>
                  </div>
                )}
                {overallStats.total_deaths && (
                  <div className="text-center p-6 border border-white/10 rounded-xl bg-black/20">
                    <div className="text-3xl font-light mb-2 text-white">
                      {typeof overallStats.total_deaths === 'object' 
                        ? overallStats.total_deaths.deaths || '-'
                        : overallStats.total_deaths}
                    </div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider">Deaths</div>
                  </div>
                )}
                {overallStats.overall_kd && (
                  <div className="text-center p-6 border border-white/10 rounded-xl bg-black/20">
                    <div className="text-3xl font-light mb-2 text-white">{overallStats.overall_kd.toFixed(2)}</div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider">K/D</div>
                  </div>
                )}
                {overallStats.overall_kda && (
                  <div className="text-center p-6 border border-white/10 rounded-xl bg-black/20">
                    <div className="text-3xl font-light mb-2 text-white">
                      {typeof overallStats.overall_kda === 'object' 
                        ? (overallStats.overall_kda.kda !== undefined ? overallStats.overall_kda.kda.toFixed(2) : '-')
                        : typeof overallStats.overall_kda === 'number'
                        ? overallStats.overall_kda.toFixed(2)
                        : '-'}
                    </div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider">KDA</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="border-b border-white/10 mb-8">
            <div className="flex gap-6 overflow-x-auto">
              <button
                onClick={() => setActiveTab('overview')}
                className={`pb-4 px-2 text-sm font-medium transition-colors whitespace-nowrap border-b-2 ${
                  activeTab === 'overview'
                    ? 'border-white text-white'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('matches')}
                className={`pb-4 px-2 text-sm font-medium transition-colors whitespace-nowrap border-b-2 ${
                  activeTab === 'matches'
                    ? 'border-white text-white'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                Match History ({playerData.match_history?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('heroes')}
                className={`pb-4 px-2 text-sm font-medium transition-colors whitespace-nowrap border-b-2 ${
                  activeTab === 'heroes'
                    ? 'border-white text-white'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                Heroes ({playerData.heroes_ranked?.filter(h => h.matches > 0).length || 0})
              </button>
              <button
                onClick={() => setActiveTab('maps')}
                className={`pb-4 px-2 text-sm font-medium transition-colors whitespace-nowrap border-b-2 ${
                  activeTab === 'maps'
                    ? 'border-white text-white'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                Maps ({playerData.maps?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('teammates')}
                className={`pb-4 px-2 text-sm font-medium transition-colors whitespace-nowrap border-b-2 ${
                  activeTab === 'teammates'
                    ? 'border-white text-white'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                Teammates ({playerData.team_mates?.length || 0})
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="animate-fade-in-up">
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Overall Stats Details */}
                {overallStats && (
                  <div className="border border-white/10 bg-white/[0.02] rounded-2xl p-8">
                    <h2 className="text-2xl font-light mb-6 text-white">Overall Statistics</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {overallStats.total_play_time && (
                        <div className="text-center p-6 border border-white/10 rounded-xl bg-black/20">
                          <div className="text-2xl font-light mb-2 text-white">
                            {overallStats.total_play_time.playtime || '-'}
                          </div>
                          <div className="text-xs text-gray-400 uppercase tracking-wider">Play Time</div>
                        </div>
                      )}
                      {overallStats.total_damage && (
                        <div className="text-center p-6 border border-white/10 rounded-xl bg-black/20">
                          <div className="text-2xl font-light mb-2 text-white">
                            {overallStats.total_damage.damage || '-'}
                          </div>
                          <div className="text-xs text-gray-400 uppercase tracking-wider">Total Damage</div>
                        </div>
                      )}
                      {overallStats.total_healing && (
                        <div className="text-center p-6 border border-white/10 rounded-xl bg-black/20">
                          <div className="text-2xl font-light mb-2 text-white">
                            {overallStats.total_healing.healing || '-'}
                          </div>
                          <div className="text-xs text-gray-400 uppercase tracking-wider">Total Healing</div>
                        </div>
                      )}
                      {overallStats.total_damage_taken && (
                        <div className="text-center p-6 border border-white/10 rounded-xl bg-black/20">
                          <div className="text-2xl font-light mb-2 text-white">
                            {overallStats.total_damage_taken.damage_taken || '-'}
                          </div>
                          <div className="text-xs text-gray-400 uppercase tracking-wider">Damage Taken</div>
                        </div>
                      )}
                      {overallStats.per_minute && (
                        <>
                          <div className="text-center p-6 border border-white/10 rounded-xl bg-black/20">
                            <div className="text-2xl font-light mb-2 text-white">
                              {formatValue(overallStats.per_minute.total_damage_per_minute || 0)}/min
                            </div>
                            <div className="text-xs text-gray-400 uppercase tracking-wider">Dmg/Min</div>
                          </div>
                          <div className="text-center p-6 border border-white/10 rounded-xl bg-black/20">
                            <div className="text-2xl font-light mb-2 text-white">
                              {formatValue(overallStats.per_minute.total_healing_per_minute || 0)}/min
                            </div>
                            <div className="text-xs text-gray-400 uppercase tracking-wider">Heal/Min</div>
                          </div>
                        </>
                      )}
                      {overallStats.total_mvps && (
                        <div className="text-center p-6 border border-white/10 rounded-xl bg-black/20">
                          <div className="text-3xl font-light mb-2 text-white">
                            {overallStats.total_mvps.mvps || 0}
                          </div>
                          <div className="text-xs text-gray-400 uppercase tracking-wider">MVPs</div>
                        </div>
                      )}
                      {overallStats.total_svps && (
                        <div className="text-center p-6 border border-white/10 rounded-xl bg-black/20">
                          <div className="text-3xl font-light mb-2 text-white">
                            {overallStats.total_svps.svps || 0}
                          </div>
                          <div className="text-xs text-gray-400 uppercase tracking-wider">SVPs</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Ranked Stats */}
                {rankedStats && (
                  <div className="border border-white/10 bg-white/[0.02] rounded-2xl p-8">
                    <h2 className="text-2xl font-light mb-6 text-white">Ranked Statistics</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      <div className="text-center p-6 border border-white/10 rounded-xl bg-black/20">
                        <div className="text-3xl font-light mb-2 text-white">{rankedStats.total_matches}</div>
                        <div className="text-xs text-gray-400 uppercase tracking-wider">Matches</div>
                      </div>
                      <div className="text-center p-6 border border-white/10 rounded-xl bg-black/20">
                        <div className="text-3xl font-light mb-2 text-white">{rankedStats.total_wins}</div>
                        <div className="text-xs text-gray-400 uppercase tracking-wider">Wins</div>
                      </div>
                      <div className="text-center p-6 border border-white/10 rounded-xl bg-black/20">
                        <div className="text-3xl font-light mb-2 text-white">{rankedStats.total_kills}</div>
                        <div className="text-xs text-gray-400 uppercase tracking-wider">Kills</div>
                      </div>
                      <div className="text-center p-6 border border-white/10 rounded-xl bg-black/20">
                        <div className="text-3xl font-light mb-2 text-white">{rankedStats.total_deaths}</div>
                        <div className="text-xs text-gray-400 uppercase tracking-wider">Deaths</div>
                      </div>
                      <div className="text-center p-6 border border-white/10 rounded-xl bg-black/20">
                        <div className="text-3xl font-light mb-2 text-white">{rankedStats.total_assists}</div>
                        <div className="text-xs text-gray-400 uppercase tracking-wider">Assists</div>
                      </div>
                      <div className="text-center p-6 border border-white/10 rounded-xl bg-black/20">
                        <div className="text-2xl font-light mb-2 text-white">{rankedStats.total_time_played}</div>
                        <div className="text-xs text-gray-400 uppercase tracking-wider">Play Time</div>
                      </div>
                      <div className="text-center p-6 border border-white/10 rounded-xl bg-black/20">
                        <div className="text-3xl font-light mb-2 text-white">{rankedStats.total_mvp}</div>
                        <div className="text-xs text-gray-400 uppercase tracking-wider">MVPs</div>
                      </div>
                      <div className="text-center p-6 border border-white/10 rounded-xl bg-black/20">
                        <div className="text-3xl font-light mb-2 text-white">{rankedStats.total_svp}</div>
                        <div className="text-xs text-gray-400 uppercase tracking-wider">SVPs</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Roles Played */}
                {overallStats?.roles_played && (
                  <div className="border border-white/10 bg-white/[0.02] rounded-2xl p-8">
                    <h2 className="text-2xl font-light mb-6 text-white">Role Statistics</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {overallStats.roles_played.duelist && (
                        <div className="border border-white/10 rounded-xl p-6 bg-black/20">
                          <h3 className="text-xl font-medium mb-4 text-white">Duelist</h3>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Matches:</span>
                              <span className="text-white">{overallStats.roles_played.duelist.matches_played?.toFixed(1) || '-'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Win Rate:</span>
                              <span className="text-white">{overallStats.roles_played.duelist.win_percentage?.win_rate || '-'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">K/D:</span>
                              <span className="text-white">{overallStats.roles_played.duelist.kd_ratio?.kd || '-'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Kills:</span>
                              <span className="text-white">{overallStats.roles_played.duelist.kills || '-'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Play Time:</span>
                              <span className="text-white">{overallStats.roles_played.duelist.total_time_played?.playtime || '-'}</span>
                            </div>
                          </div>
                        </div>
                      )}
                      {overallStats.roles_played.strategist && (
                        <div className="border border-white/10 rounded-xl p-6 bg-black/20">
                          <h3 className="text-xl font-medium mb-4 text-white">Strategist</h3>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Matches:</span>
                              <span className="text-white">{overallStats.roles_played.strategist.matches_played?.toFixed(1) || '-'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Win Rate:</span>
                              <span className="text-white">{overallStats.roles_played.strategist.win_percentage?.win_rate || '-'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">K/D:</span>
                              <span className="text-white">{overallStats.roles_played.strategist.kd_ratio?.kd || '-'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Kills:</span>
                              <span className="text-white">{overallStats.roles_played.strategist.kills || '-'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Play Time:</span>
                              <span className="text-white">{overallStats.roles_played.strategist.total_time_played?.playtime || '-'}</span>
                            </div>
                          </div>
                        </div>
                      )}
                      {overallStats.roles_played.vanguard && (
                        <div className="border border-white/10 rounded-xl p-6 bg-black/20">
                          <h3 className="text-xl font-medium mb-4 text-white">Vanguard</h3>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Matches:</span>
                              <span className="text-white">{overallStats.roles_played.vanguard.matches_played?.toFixed(1) || '-'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Win Rate:</span>
                              <span className="text-white">{overallStats.roles_played.vanguard.win_percentage?.win_rate || '-'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">K/D:</span>
                              <span className="text-white">{overallStats.roles_played.vanguard.kd_ratio?.kd || '-'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Kills:</span>
                              <span className="text-white">{overallStats.roles_played.vanguard.kills || '-'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Play Time:</span>
                              <span className="text-white">{overallStats.roles_played.vanguard.total_time_played?.playtime || '-'}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Rank History */}
                {playerData.rank_history && playerData.rank_history.length > 0 && (
                  <div className="border border-white/10 bg-white/[0.02] rounded-2xl p-8">
                    <h2 className="text-2xl font-light mb-6 text-white">Rank History</h2>
                    <div className="space-y-3">
                      {playerData.rank_history.slice(0, 10).map((entry, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 border border-white/10 rounded-lg bg-black/20">
                          <div>
                            <div className="text-white font-medium">
                              Level {entry.level_progression.from} → Level {entry.level_progression.to}
                            </div>
                            <div className="text-sm text-gray-400">{formatDate(entry.match_time_stamp)}</div>
                          </div>
                          <div className={`text-lg font-medium ${entry.score_progression.add_score >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {entry.score_progression.add_score >= 0 ? '+' : ''}{entry.score_progression.add_score.toFixed(1)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'matches' && (
              <div>
                <h2 className="text-2xl font-light mb-6 text-white">Match History ({playerData.match_history?.length || 0})</h2>
                {playerData.match_history && playerData.match_history.length > 0 ? (
                  <div className="space-y-4">
                    {playerData.match_history.map((match, idx) => (
                      <div key={match.match_uid || idx} className="border border-white/10 bg-white/[0.02] rounded-xl p-6">
                        <div className="flex items-start gap-6">
                          {match.map_thumbnail && (
                            <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-white/10 flex-shrink-0">
                              <img
                                src={match.map_thumbnail.startsWith('http')
                                  ? match.map_thumbnail
                                  : `https://marvelrivalsapi.com${match.map_thumbnail}`}
                                alt={`Map ${match.map_id}`}
                                className="w-full h-full object-cover"
                                loading="lazy"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.style.display = 'none'
                                }}
                              />
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-4">
                                {match.player_performance.hero_type && (
                                  <div className="relative w-12 h-12 rounded overflow-hidden border border-white/10">
                                    <img
                                      src={match.player_performance.hero_type.startsWith('http')
                                        ? match.player_performance.hero_type
                                        : `https://marvelrivalsapi.com${match.player_performance.hero_type}`}
                                      alt={toTitleCase(match.player_performance.hero_name)}
                                      className="w-full h-full object-cover"
                                      loading="lazy"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement
                                        target.style.display = 'none'
                                      }}
                                    />
                                  </div>
                                )}
                                <div>
                                  <div className="text-white font-medium">{toTitleCase(match.player_performance.hero_name)}</div>
                                  <div className="text-sm text-gray-400">{formatDate(match.match_time_stamp)}</div>
                                </div>
                              </div>
                              <div className={`px-4 py-2 rounded-lg font-medium ${
                                match.player_performance.is_win.is_win
                                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
                              }`}>
                                {match.player_performance.is_win.is_win ? 'Win' : 'Loss'}
                              </div>
                            </div>
                            <div className="flex items-center gap-6 text-sm">
                              <div>
                                <span className="text-gray-400">K/D/A: </span>
                                <span className="text-white">{match.player_performance.kills}/{match.player_performance.deaths}/{match.player_performance.assists}</span>
                              </div>
                              <div>
                                <span className="text-gray-400">Score: </span>
                                <span className={`${match.player_performance.score_change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                  {match.player_performance.score_change >= 0 ? '+' : ''}{match.player_performance.score_change.toFixed(1)}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-400">Duration: </span>
                                <span className="text-white">{Math.floor(match.duration / 60)}m {Math.floor(match.duration % 60)}s</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400">No match history available.</p>
                )}
              </div>
            )}

            {activeTab === 'heroes' && (
              <div>
                <h2 className="text-2xl font-light mb-6 text-white">Hero Statistics</h2>
                {playerData.heroes_ranked && playerData.heroes_ranked.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {playerData.heroes_ranked
                      .filter(hero => hero.matches > 0)
                      .sort((a, b) => b.matches - a.matches)
                      .map((hero) => (
                        <Link
                          key={hero.hero_id}
                          href={`/heroes/${hero.hero_id}`}
                          className="border border-white/10 bg-white/[0.02] rounded-xl p-6 hover:border-white/20 hover:bg-white/[0.04] transition-all"
                        >
                          <div className="flex items-start gap-4">
                            {hero.hero_thumbnail && (
                              <div className="relative w-16 h-16 rounded overflow-hidden border border-white/10 flex-shrink-0">
                                <img
                                  src={hero.hero_thumbnail.startsWith('http')
                                    ? hero.hero_thumbnail
                                    : `https://marvelrivalsapi.com${hero.hero_thumbnail}`}
                                  alt={toTitleCase(hero.hero_name)}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    target.style.display = 'none'
                                  }}
                                />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg font-medium text-white mb-2">{toTitleCase(hero.hero_name)}</h3>
                              <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Matches:</span>
                                  <span className="text-white">{hero.matches}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Wins:</span>
                                  <span className="text-white">{hero.wins} ({hero.matches > 0 ? ((hero.wins / hero.matches) * 100).toFixed(1) : 0}%)</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-400">K/D:</span>
                                  <span className="text-white">
                                    {hero.deaths > 0 ? (hero.kills / hero.deaths).toFixed(2) : hero.kills.toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                  </div>
                ) : (
                  <p className="text-gray-400">No hero statistics available.</p>
                )}
              </div>
            )}

            {activeTab === 'maps' && (
              <div>
                <h2 className="text-2xl font-light mb-6 text-white">Map Performance</h2>
                {playerData.maps && playerData.maps.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {playerData.maps.map((map) => (
                      <div key={map.map_id} className="border border-white/10 bg-white/[0.02] rounded-xl p-6">
                        {map.map_thumbnail && (
                          <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-white/10 mb-4">
                            <img
                              src={map.map_thumbnail.startsWith('http')
                                ? map.map_thumbnail
                                : `https://marvelrivalsapi.com${map.map_thumbnail}`}
                              alt={`Map ${map.map_id}`}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                              }}
                            />
                          </div>
                        )}
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Matches:</span>
                            <span className="text-white">{map.matches}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Wins:</span>
                            <span className="text-white">{map.wins} ({map.matches > 0 ? ((map.wins / map.matches) * 100).toFixed(1) : 0}%)</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">K/D:</span>
                            <span className="text-white">
                              {map.deaths > 0 ? (map.kills / map.deaths).toFixed(2) : map.kills.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Play Time:</span>
                            <span className="text-white">{formatTime(map.play_time)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400">No map statistics available.</p>
                )}
              </div>
            )}

            {activeTab === 'teammates' && (
              <div>
                <h2 className="text-2xl font-light mb-6 text-white">Teammates</h2>
                {playerData.team_mates && playerData.team_mates.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {playerData.team_mates
                      .sort((a, b) => b.matches - a.matches)
                      .map((teammate) => (
                        <Link
                          key={teammate.player_info.player_uid}
                          href={`/players/${teammate.player_info.player_uid}`}
                          className="border border-white/10 bg-white/[0.02] rounded-xl p-6 hover:border-white/20 hover:bg-white/[0.04] transition-all"
                        >
                          <div className="flex items-center gap-4">
                            {teammate.player_info.player_icon && (
                              <div className="relative w-16 h-16 rounded-full overflow-hidden border border-white/10 flex-shrink-0">
                                <img
                                  src={(() => {
                                    const iconPath = teammate.player_info.player_icon
                                    if (iconPath.startsWith('http')) return iconPath
                                    // Paths from API are like /players/heads/player_head_xxx.png or /rivals/players/heads/...
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
                                  alt={teammate.player_info.nick_name}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    const iconPath = teammate.player_info.player_icon
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
                              <h3 className="text-lg font-medium text-white mb-2 truncate">{teammate.player_info.nick_name}</h3>
                              <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Matches:</span>
                                  <span className="text-white">{teammate.matches}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Win Rate:</span>
                                  <span className="text-white">{teammate.win_rate}%</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                  </div>
                ) : (
                  <p className="text-gray-400">No teammate data available.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

