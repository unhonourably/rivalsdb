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
    map_name?: string
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
    map_name?: string
    matches: number
    wins: number
    kills: number
    deaths: number
    assists: number
    play_time: number
  }>
}

const resolveObject = (value: unknown): Record<string, any> | undefined => {
  if (!value) return undefined
  if (Array.isArray(value)) {
    for (const item of value) {
      const resolved = resolveObject(item)
      if (resolved) return resolved
    }
    return undefined
  }
  if (typeof value === 'object') {
    return value as Record<string, any>
  }
  return undefined
}

const mergePlayerPayload = (payload: any): PlayerDetail => {
  const base = resolveObject(payload) ?? ({} as Record<string, any>)
  const nested = resolveObject(base.data) ?? resolveObject((payload as any)?.data)
  const normalized: Record<string, any> = {}
  if (nested) {
    Object.assign(normalized, nested)
  }
  Object.assign(normalized, base)
  const candidatePlayer =
    resolveObject(normalized.player) ??
    resolveObject(base.player) ??
    resolveObject(nested?.player) ??
    resolveObject((payload as any)?.player) ??
    (typeof base.uid === 'number' && (base.rank || base.level || base.icon || base.info) ? base : undefined) ??
    (typeof nested?.uid === 'number' && (nested?.rank || nested?.level || nested?.icon || nested?.info) ? (nested as Record<string, any>) : undefined)
  if (candidatePlayer) {
    normalized.player = { ...candidatePlayer }
  }
  
  const overallNode =
    resolveObject(normalized.overall_stats) ??
    resolveObject(base.overall_stats) ??
    resolveObject(nested?.overall_stats) ??
    resolveObject((payload as any)?.overall_stats) ??
    resolveObject(candidatePlayer?.overall_stats) ??
    resolveObject(candidatePlayer?.overall) ??
    resolveObject(base.overall) ??
    resolveObject(nested?.overall) ??
    resolveObject(base.data?.overall_stats) ??
    resolveObject(nested?.data?.overall_stats) ??
    resolveObject((payload as any)?.data?.overall_stats) ??
    resolveObject(base.player?.overall_stats) ??
    resolveObject(nested?.player?.overall_stats) ??
    resolveObject((payload as any)?.player?.overall_stats) ??
    resolveObject(base.stats?.overall_stats) ??
    resolveObject(nested?.stats?.overall_stats) ??
    resolveObject((payload as any)?.stats?.overall_stats) ??
    (payload as any)?.overall_stats ??
    base.overall_stats ??
    nested?.overall_stats
  
  if (overallNode) {
    normalized.overall_stats = { ...overallNode }
    
    if (normalized.overall_stats.roles_played) {
      normalized.overall_stats.roles_played = { ...normalized.overall_stats.roles_played }
    }
    
    console.log('Setting overall_stats in normalized:', {
      hasRanked: !!normalized.overall_stats.ranked,
      hasUnranked: !!normalized.overall_stats.unranked,
      hasRolesPlayed: !!normalized.overall_stats.roles_played,
      rolesPlayedType: typeof normalized.overall_stats.roles_played,
      rolesPlayedKeys: normalized.overall_stats.roles_played ? Object.keys(normalized.overall_stats.roles_played) : [],
      overallStatsKeys: Object.keys(normalized.overall_stats),
      overallNodeKeys: Object.keys(overallNode),
      overallNodeHasRolesPlayed: !!overallNode.roles_played
    })
  } else {
    console.warn('No overall_stats found in payload:', {
      payloadKeys: Object.keys(payload || {}),
      baseKeys: Object.keys(base),
      nestedKeys: nested ? Object.keys(nested) : [],
      payloadOverallStats: !!(payload as any)?.overall_stats,
      baseOverallStats: !!base.overall_stats,
      nestedOverallStats: !!nested?.overall_stats
    })
  }
  const arrayKeys = ['match_history', 'rank_history', 'hero_matchups', 'heroes_ranked', 'heroes_unranked', 'team_mates', 'maps']
  arrayKeys.forEach((key) => {
    if (Array.isArray(normalized[key])) return
    if (Array.isArray(base[key])) {
      normalized[key] = base[key]
      return
    }
    if (Array.isArray(nested?.[key])) {
      normalized[key] = nested[key]
      return
    }
    if (Array.isArray(candidatePlayer?.[key])) {
      normalized[key] = candidatePlayer[key]
      return
    }
    const payloadValue = (payload as any)?.[key]
    if (Array.isArray(payloadValue)) {
      normalized[key] = payloadValue
    }
  })
  if (normalized.uid === undefined) {
    normalized.uid = base.uid ?? nested?.uid ?? candidatePlayer?.uid ?? (payload as any)?.uid
  }
  if (!normalized.name) {
    normalized.name = base.name ?? nested?.name ?? candidatePlayer?.name ?? (payload as any)?.name
  }
  if (normalized.isPrivate === undefined) {
    normalized.isPrivate = base.isPrivate ?? nested?.isPrivate ?? candidatePlayer?.isPrivate ?? (payload as any)?.isPrivate
  }
  if (!normalized.updates) {
    normalized.updates = base.updates ?? nested?.updates ?? candidatePlayer?.updates ?? (payload as any)?.updates
  }
  return normalized as PlayerDetail
}

export default function PlayerDetailPage() {
  const params = useParams()
  const router = useRouter()
  const playerId = params.id as string

  const [playerData, setPlayerData] = useState<PlayerDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingPhase, setLoadingPhase] = useState<string>('Checking database...')
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'matches' | 'heroes' | 'maps' | 'teammates'>('overview')
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [updateMessage, setUpdateMessage] = useState<string | null>(null)
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [showStatsInfoModal, setShowStatsInfoModal] = useState(false)
  const [mapNames, setMapNames] = useState<Record<number, string>>({})
  const [pushToDbStatus, setPushToDbStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [pushToDbMessage, setPushToDbMessage] = useState<string | null>(null)
  const [updatedStats, setUpdatedStats] = useState<any>(null)

  useEffect(() => {
    if (showStatsInfoModal || showUpdateModal) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [showStatsInfoModal, showUpdateModal])

  useEffect(() => {
    let mounted = true
    
    const fetchPlayerData = async () => {
      if (!playerId) return

      try {
        setLoading(true)
        setError(null)
        setUpdateStatus('idle')
        setUpdateMessage(null)
        setPushToDbStatus('idle')
        setPushToDbMessage(null)
        setUpdatedStats(null)
        setLoadingPhase('Checking database for cached profile...')

        const dbResponse = await fetch(`/api/players/${playerId}`)
        
        if (dbResponse.ok) {
          const dbResult = await dbResponse.json()
          const dbPlayer = dbResult.player
          const stats = dbResult.fullProfile || dbResult.stats

          const isConsolePlayer = playerId.length <= 9
          
          console.log('DB Result:', {
            playerId,
            isConsolePlayer,
            hasDbPlayer: !!dbPlayer,
            hasStats: !!stats,
            statsType: typeof stats,
            statsKeys: stats ? Object.keys(stats) : [],
            overallStatsDirect: stats?.overall_stats,
            overallStatsDirectType: typeof stats?.overall_stats,
            overallStatsDirectKeys: stats?.overall_stats ? Object.keys(stats.overall_stats) : [],
            overallStatsPlayer: stats?.player?.overall_stats,
            overallStatsData: stats?.data?.overall_stats,
            hasRolesPlayed: !!stats?.overall_stats?.roles_played,
            rolesPlayedKeys: stats?.overall_stats?.roles_played ? Object.keys(stats.overall_stats.roles_played) : [],
            rawStatsString: stats ? JSON.stringify(stats).substring(0, 500) : null
          })

          if (dbPlayer && stats) {
            const hasOverallStats = 
              stats.overall_stats ||
              stats.player?.overall_stats ||
              stats.data?.overall_stats ||
              resolveObject(stats)?.overall_stats ||
              resolveObject(stats?.player)?.overall_stats ||
              resolveObject(stats?.data)?.overall_stats

            console.log('Has overall stats check:', {
              hasOverallStats: !!hasOverallStats,
              direct: !!stats.overall_stats,
              player: !!stats.player?.overall_stats,
              data: !!stats.data?.overall_stats,
              resolved: !!resolveObject(stats)?.overall_stats
            })

            if (hasOverallStats) {
              const needsBasicInfo = !dbPlayer.player_icon_id || !dbPlayer.login_os || !dbPlayer.level || !dbPlayer.rank_label || !dbPlayer.rank_color
              
              if (needsBasicInfo) {
                setLoadingPhase('Profile found but missing basic info. Fetching from API to complete...')
              } else {
                setLoadingPhase('Loading profile from database...')
                const normalized = mergePlayerPayload(stats)
                console.log('After mergePlayerPayload:', {
                  hasOverallStats: !!normalized.overall_stats,
                  overallStatsKeys: normalized.overall_stats ? Object.keys(normalized.overall_stats) : [],
                  hasRanked: !!normalized.overall_stats?.ranked,
                  hasUnranked: !!normalized.overall_stats?.unranked,
                  hasRolesPlayed: !!normalized.overall_stats?.roles_played
                })
                if (mounted) {
                  setPlayerData(normalized)
                  setLoading(false)
                }
                return
              }
            } else {
              setLoadingPhase('Profile found but missing stats. Fetching from API...')
            }
          }
          
          if (dbPlayer && !stats) {
            setLoadingPhase('Basic info found. Fetching full profile from API...')
          }
        }

        setLoadingPhase('Profile not found in database. Fetching from API...')

        const isNumericId = /^\d+$/.test(playerId)
        const shouldPreferV1 = isNumericId && playerId.length <= 9
        const endpointOrder = shouldPreferV1
          ? [`${API_BASE}/player/${playerId}`, `${API_BASE_V2}/player/${playerId}`]
          : [`${API_BASE_V2}/player/${playerId}`, `${API_BASE}/player/${playerId}`]

        let lastError: Error | null = null
        let lastStatus: number | undefined
        let data: any = null

        for (const endpoint of endpointOrder) {
          try {
            setLoadingPhase(`Trying ${endpoint.includes('/v1/') ? 'v1' : 'v2'} API endpoint...`)
            let response = await fetch(endpoint, {
              headers: { 'x-api-key': API_KEY }
            })

            if (!response.ok) {
              if (response.status === 404) {
                console.warn(`404 from ${endpoint}, trying next endpoint...`)
                lastStatus = response.status
                continue
              }
              if (response.status === 429) {
                throw new Error('Rate limit exceeded. Please try again in a moment.')
              }
              if (response.status === 403) {
                throw new Error('This player has set their profile to private.')
              }
              if (response.status === 405) {
                console.warn(`405 from ${endpoint}, trying next endpoint...`)
                lastStatus = response.status
                continue
              }
              lastStatus = response.status
              throw new Error(`Failed to load player data: ${response.status}`)
            }

            data = await response.json()
            console.log(`Successfully fetched from ${endpoint}`)
            console.log('Player detail response:', data)
            console.log('Overall stats location:', {
              direct: data.overall_stats,
              player: data.player?.overall_stats,
              data: data.data?.overall_stats,
              stats: data.stats?.overall_stats
            })
            
            setLoadingPhase('Processing player data...')
            const normalized = mergePlayerPayload(data)
            
            console.log('Normalized overall_stats:', normalized.overall_stats)
            console.log('Normalized player:', normalized.player)

            if (mounted) {
              setPlayerData(normalized)
              setUpdatedStats(data)
            }

            setLoadingPhase('Saving complete profile to database (this may take a moment)...')
            try {
              const saveResponse = await fetch(`/api/players/${playerId}`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ fullProfile: data })
              })
              const saveResult = await saveResponse.json()
              console.log('Save response:', saveResult)
              setLoadingPhase('Profile saved! Finalizing...')
            } catch (saveError) {
              console.error('Failed to auto-save player profile to DB:', saveError)
            }

            if (mounted) {
              setLoading(false)
            }
            return
          } catch (attemptError) {
            lastError = attemptError instanceof Error
              ? attemptError
              : new Error('Failed to load player data')
            console.warn(`Player fetch failed for ${endpoint}:`, lastError.message)
            if (attemptError instanceof Error && 
                (attemptError.message.includes('private') || 
                 attemptError.message.includes('Rate limit'))) {
              break
            }
            continue
          }
        }

        if (!data) {
          if (lastStatus === 404) {
            lastError = new Error(`Player not found in ${endpointOrder.length === 2 ? 'v1 or v2' : 'the'} API`)
          }
        }

        if (mounted) {
          if (lastStatus === 403) {
            setError('This player has set their profile to private.')
          } else {
            setError(lastError?.message || 'Failed to load player data')
          }
        }
      } catch (outerError) {
        const finalError = outerError instanceof Error ? outerError : new Error('Failed to load player data')
        if (mounted) {
          setError(finalError.message)
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

  useEffect(() => {
    if (!playerData) return

    const collectedNames: Record<number, string> = {}
    const idsToFetch = new Set<number>()

    const normalizeName = (value: unknown) => {
      if (!value) return undefined
      return toTitleCase(String(value).replace(/_/g, ' '))
    }

    playerData.maps?.forEach((map) => {
      if (typeof map.map_id !== 'number') return
      if (mapNames[map.map_id]) return
      const direct = normalizeName((map as any)?.map_name || (map as any)?.name)
      if (direct) {
        collectedNames[map.map_id] = direct
      } else {
        idsToFetch.add(map.map_id)
      }
    })

    playerData.match_history?.forEach((match) => {
      if (typeof match.map_id !== 'number') return
      if (mapNames[match.map_id] || collectedNames[match.map_id]) return
      const direct = normalizeName((match as any)?.map_name || (match as any)?.mapName)
      if (direct) {
        collectedNames[match.map_id] = direct
      } else {
        idsToFetch.add(match.map_id)
      }
    })

    if (Object.keys(collectedNames).length > 0) {
      setMapNames((prev) => ({ ...prev, ...collectedNames }))
    }

    const ids = Array.from(idsToFetch).filter((id) => mapNames[id] === undefined)
    if (ids.length === 0) return

    let cancelled = false

    const fetchNames = async () => {
      const fetched: Record<number, string> = {}

      await Promise.all(
        ids.map(async (id) => {
          try {
            let resp = await fetch(`${API_BASE}/maps/${id}`, {
              headers: { 'x-api-key': API_KEY }
            })

            if (!resp.ok) {
              resp = await fetch(`${API_BASE}/maps/map/${id}`, {
                headers: { 'x-api-key': API_KEY }
              })
            }

            if (!resp.ok) {
              resp = await fetch(`${API_BASE_V2}/maps/${id}`, {
                headers: { 'x-api-key': API_KEY }
              })
            }

            if (!resp.ok) return

            const data = await resp.json()
            const name = data?.map_name || data?.name || data?.title || data?.map?.name
            const normalized = normalizeName(name)
            if (normalized) {
              fetched[id] = normalized
            }
          } catch (err) {
            console.warn('Failed to fetch map name', id, err)
          }
        })
      )

      if (!cancelled && Object.keys(fetched).length > 0) {
        setMapNames((prev) => ({ ...prev, ...fetched }))
      }
    }

    fetchNames()

    return () => {
      cancelled = true
    }
  }, [playerData, mapNames])

  const handleRequestUpdate = async () => {
    if (!playerId) return
    setShowUpdateModal(false)
    setUpdateStatus('loading')
    setUpdateMessage(null)
    setUpdatedStats(null)

    const endpoint = `${API_BASE}/player/${playerId}/update`

    const attemptUpdate = async (method: 'POST' | 'GET') => {
      return fetch(endpoint, {
        method,
        headers: { 'x-api-key': API_KEY }
      })
    }

    try {
      let response = await attemptUpdate('POST')
      if (response.status === 405 || response.status === 404) {
        response = await attemptUpdate('GET')
      }

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please try again in a moment.')
        }
        const message = await response.text()
        throw new Error(message || `Failed to request update (${response.status})`)
      }

      let resultMessage: string | null = null
      try {
        const data = await response.json()
        resultMessage = data?.message || data?.status || null
      } catch (err) {
        resultMessage = null
      }

      setUpdateStatus('success')
      setUpdateMessage(resultMessage || 'Update request queued successfully. Please wait a few minutes and refresh the page to see updated stats.')
      
      setTimeout(async () => {
        try {
          const isNumericId = /^\d+$/.test(playerId)
          const shouldPreferV1 = isNumericId && playerId.length <= 9
          const endpointOrder = shouldPreferV1
            ? [`${API_BASE}/player/${playerId}`, `${API_BASE_V2}/player/${playerId}`]
            : [`${API_BASE_V2}/player/${playerId}`, `${API_BASE}/player/${playerId}`]

          for (const endpoint of endpointOrder) {
            try {
              let fetchResponse = await fetch(endpoint, {
                headers: { 'x-api-key': API_KEY }
              })

              if (fetchResponse.status === 405 || fetchResponse.status === 404 || fetchResponse.status === 403) {
                fetchResponse = await fetch(`${API_BASE}/player/${playerId}`, {
                  headers: { 'x-api-key': API_KEY }
                })
              }

              if (fetchResponse.ok) {
                const data = await fetchResponse.json()
                setUpdatedStats(data)
                setPlayerData(mergePlayerPayload(data))
                break
              }
            } catch (e) {
              continue
            }
          }
        } catch (e) {
          console.error('Failed to fetch updated stats:', e)
        }
      }, 5000)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to request update'
      setUpdateStatus('error')
      setUpdateMessage(message)
      console.error('Failed to request player update:', err)
    }
  }

  const handlePushToDb = async () => {
    if (!playerId || !playerData) return

    setPushToDbStatus('loading')
    setPushToDbMessage(null)

    try {
      const profileToSave = updatedStats || playerData

      const response = await fetch(`/api/players/${playerId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fullProfile: profileToSave })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save profile to database')
      }

      setPushToDbStatus('success')
      setPushToDbMessage('Full profile successfully saved to database!')
      
      setTimeout(() => {
        window.location.reload()
      }, 1500)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save profile'
      setPushToDbStatus('error')
      setPushToDbMessage(message)
      console.error('Failed to push profile to DB:', err)
    }
  }

  const formatValue = (val: any): string => {
    if (val === null || val === undefined) return '-'
    if (typeof val === 'string') return val
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

  const hasStatValue = (val: any): boolean => {
    if (val === null || val === undefined) return false
    if (typeof val === 'object') {
      return Object.values(val).some((entry) => entry !== null && entry !== undefined)
    }
    return true
  }

  const extractStatValue = (stat: any, preferredKeys: string[] = []): any => {
    if (stat === null || stat === undefined) return null
    if (typeof stat !== 'object') return stat
    for (const key of preferredKeys) {
      if (stat[key] !== null && stat[key] !== undefined) return stat[key]
    }
    const values = Object.values(stat).filter((value) => value !== null && value !== undefined)
    return values.length > 0 ? values[0] : null
  }

  const formatRatio = (value: any): string => {
    if (value === null || value === undefined) return '-'
    const numeric = typeof value === 'number' ? value : Number(value)
    if (!Number.isFinite(numeric)) return '-'
    return numeric.toFixed(2)
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

  const getAssetCandidates = (path?: string): string[] => {
    if (!path) return []
    if (path.startsWith('http')) return [path]

    const normalized = path.startsWith('/') ? path : `/${path}`
    const candidates = new Set<string>()

    candidates.add(`https://marvelrivalsapi.com${normalized}`)

    if (normalized.startsWith('/rivals/')) {
      const withoutPrefix = normalized.replace('/rivals', '')
      candidates.add(`https://marvelrivalsapi.com${withoutPrefix}`)
    } else {
      candidates.add(`https://marvelrivalsapi.com/rivals${normalized}`)
    }

    candidates.add(`https://cdn.marvelrivalsapi.com${normalized}`)

    return Array.from(candidates)
  }

  const getMapDisplayName = (map: { map_id?: number; map_name?: string; mapThumbnail?: string; map_thumbnail?: string }): string => {
     if (!map) return 'Unknown Map'
    if (typeof map.map_id === 'number') {
      const stored = mapNames[map.map_id]
      if (stored) return stored
    }
 
     if (map.map_name) {
       return toTitleCase(map.map_name.replace(/_/g, ' '))
     }
 
     const altName = (map as any)?.name || (map as any)?.mapName
     if (altName) {
       return toTitleCase(String(altName).replace(/_/g, ' '))
     }

     if (map.map_thumbnail) {
       const file = map.map_thumbnail.split('/').pop() || ''
       const base = file.replace(/\.[^.]+$/, '')
       if (base) {
         return toTitleCase(base.replace(/_/g, ' '))
       }
     }

     if (map.map_id !== undefined) {
       return `Map ${map.map_id}`
     }

     return 'Unknown Map'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-black">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md px-6">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mb-6"></div>
            <p className="text-white text-lg font-medium mb-2">Loading Player Profile</p>
            <p className="text-gray-400 text-sm mb-4">{loadingPhase}</p>
            {loadingPhase.includes('Saving') && (
              <div className="mt-4 text-xs text-gray-500 leading-relaxed">
                <p>We're saving all player data including:</p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-gray-400">
                  <li>Overall statistics</li>
                  <li>Ranked and unranked stats</li>
                  <li>Role statistics (Duelist, Strategist, Vanguard)</li>
                  <li>Match history</li>
                  <li>Hero performance data</li>
                  <li>Map statistics</li>
                  <li>Teammate information</li>
                </ul>
                <p className="mt-3 text-gray-500">This ensures faster loading on future visits.</p>
              </div>
            )}
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
  const overallStats = playerData.overall_stats || 
    resolveObject((playerData.player as any)?.overall_stats) ||
    resolveObject((playerData as any)?.data?.overall_stats) ||
    resolveObject((playerData as any)?.stats?.overall_stats)
  
  const rankedStats = overallStats?.ranked || 
    resolveObject(overallStats?.ranked) ||
    resolveObject((playerData as any)?.overall_stats?.ranked) ||
    resolveObject((playerData.player as any)?.overall_stats?.ranked)
  
  const unrankedStats = overallStats?.unranked || 
    resolveObject(overallStats?.unranked) ||
    resolveObject((playerData as any)?.overall_stats?.unranked) ||
    resolveObject((playerData.player as any)?.overall_stats?.unranked)
  
  const getRankedValue = (field: string) => rankedStats?.[field] ?? null
  const getUnrankedValue = (field: string) => unrankedStats?.[field] ?? null
  const getCombinedNumeric = (field: string) => {
    const ranked = getRankedValue(field)
    const unranked = getUnrankedValue(field)
    if (ranked !== null && unranked !== null) {
      return ranked + unranked
    }
    return ranked ?? unranked ?? null
  }
  
  const getCombinedTime = () => {
    const rankedRaw = rankedStats?.total_time_played_raw
    const unrankedRaw = unrankedStats?.total_time_played_raw
    if (rankedRaw !== undefined && unrankedRaw !== undefined) {
      const totalSeconds = rankedRaw + unrankedRaw
      const hours = Math.floor(totalSeconds / 3600)
      const minutes = Math.floor((totalSeconds % 3600) / 60)
      const seconds = Math.floor(totalSeconds % 60)
      return `${hours}h ${minutes}m ${seconds}s`
    }
    const rankedTime = rankedStats?.total_time_played
    const unrankedTime = unrankedStats?.total_time_played
    return rankedTime ?? unrankedTime ?? null
  }
  
  const combinedStats: any = {
    ...overallStats,
    total_kills: overallStats?.total_kills ?? getCombinedNumeric('total_kills'),
    total_deaths: overallStats?.total_deaths ?? getCombinedNumeric('total_deaths'),
    total_assists: overallStats?.total_assists ?? getCombinedNumeric('total_assists'),
    total_mvps: overallStats?.total_mvps ?? 
      (rankedStats?.total_mvp !== undefined || unrankedStats?.total_mvp !== undefined
        ? { mvps: (rankedStats?.total_mvp || 0) + (unrankedStats?.total_mvp || 0) }
        : overallStats?.total_mvps),
    total_svps: overallStats?.total_svps ?? 
      (rankedStats?.total_svp !== undefined || unrankedStats?.total_svp !== undefined
        ? { svps: (rankedStats?.total_svp || 0) + (unrankedStats?.total_svp || 0) }
        : overallStats?.total_svps),
    total_play_time: overallStats?.total_play_time ?? 
      (getCombinedTime() ? { playtime: getCombinedTime() } : overallStats?.total_play_time),
    ranked: rankedStats,
    unranked: unrankedStats,
    roles_played: overallStats?.roles_played
  }
  
  const effectiveOverallStats = combinedStats

  return (
    <div className="min-h-screen flex flex-col bg-black">
      <Navbar />
      <div className="background"></div>

      <main className="flex-1 pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {/* Back Button */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <Link
              href="/players"
              className="inline-flex items-center text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Players
            </Link>
            <div className="flex flex-col items-start md:items-end gap-2">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowUpdateModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-white/15 bg-white/10 text-sm font-medium text-white hover:bg-white/20 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={updateStatus === 'loading'}
                >
                  {updateStatus === 'loading' ? (
                    <>
                      <div className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                      Requesting...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Request Live Update
                    </>
                  )}
                </button>
                <div className="relative group">
                  <button
                    type="button"
                    onClick={handlePushToDb}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-green-500/50 bg-green-500/10 text-sm font-medium text-white hover:bg-green-500/20 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={pushToDbStatus === 'loading' || !playerData}
                  >
                    {pushToDbStatus === 'loading' ? (
                      <>
                        <div className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                        Saving...
                      </>
                    ) : pushToDbStatus === 'success' ? (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Saved
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Push to DB
                      </>
                    )}
                  </button>
                  <div className="absolute right-0 top-full mt-2 w-64 p-3 bg-black/95 border border-white/20 rounded-lg text-xs text-gray-300 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
                    <p className="mb-2 font-medium text-white">Push Updated Stats to DB</p>
                    <p className="leading-relaxed">
                      This button saves the current player stats to the database. Use the &quot;Request Update&quot; button first to fetch fresh stats from the API, then click this to save them to the database. It is reccomended that you wait at least 15 minutes to push this button after you request your live update.
                    </p>
                  </div>
                </div>
              </div>
              {updateMessage && (
                <span
                  className={`text-xs ${
                    updateStatus === 'success'
                      ? 'text-green-400'
                      : updateStatus === 'error'
                      ? 'text-red-400'
                      : 'text-gray-400'
                  }`}
                >
                  {updateMessage}
                </span>
              )}
              {pushToDbStatus === 'error' && pushToDbMessage && (
                <p className="text-xs text-red-400">{pushToDbMessage}</p>
              )}
              {pushToDbStatus === 'success' && pushToDbMessage && (
                <p className="text-xs text-green-400">{pushToDbMessage}</p>
              )}
            </div>
          </div>

          {showStatsInfoModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
              <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowStatsInfoModal(false)}></div>
              <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-black/90 p-8 shadow-2xl max-h-[85vh] overflow-y-auto">
                <h2 className="text-2xl font-light text-white mb-4">Why Some Stats Are Missing</h2>
                <div className="text-sm text-gray-300 leading-relaxed mb-6 space-y-4">
                  <p>
                    Console players (PlayStation, Xbox) receive a different API response structure compared to PC players. The Marvel Rivals API provides data in a different format for console platforms, which affects what statistics are available.
                  </p>
                  <p>
                    <strong className="text-white">What you&apos;ll see for console players:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-2">
                    <li>Overall statistics (matches, wins, kills, deaths, assists, play time, MVPs, SVPs)</li>
                    <li>Separate ranked and unranked statistics breakdowns</li>
                    <li>Hero performance data</li>
                    <li>Match history</li>
                  </ul>
                  <p>
                    <strong className="text-white">What may be missing:</strong>
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-2">
                    <li>Total damage, healing, and damage taken (not provided in console API responses)</li>
                    <li>Per-minute statistics (calculated from data not available for console)</li>
                    <li>Some role-specific breakdowns</li>
                  </ul>
                  <p className="text-xs text-gray-400 italic">
                    This is a limitation of the Marvel Rivals API itself, not our database or display system. We combine and display all available data from both ranked and unranked matches to provide the most complete statistics possible.
                  </p>
                </div>
                <button
                  onClick={() => setShowStatsInfoModal(false)}
                  className="w-full px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-sm font-medium text-gray-300 hover:bg-white/10 transition-colors"
                >
                  Got it
                </button>
              </div>
            </div>
          )}

          {showUpdateModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
              <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => updateStatus !== 'loading' && setShowUpdateModal(false)}></div>
              <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-black/90 p-8 shadow-2xl">
                <h2 className="text-2xl font-light text-white mb-4">Request Live Update</h2>
                <p className="text-sm text-gray-300 leading-relaxed mb-6">
                  You&apos;re about to request fresh stats from the Marvel Rivals service. When you confirm, the player is placed in an update queue that can take up to 30 minutes depending on demand (it usually finishes within 0–5 minutes). Keep in mind you can only request an update once every 30 minutes.
                </p>
                <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowUpdateModal(false)}
                    className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-sm font-medium text-gray-300 hover:bg-white/10 transition-colors"
                    disabled={updateStatus === 'loading'}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleRequestUpdate}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-500/80 hover:bg-blue-500 border border-blue-400 text-sm font-medium text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={updateStatus === 'loading'}
                  >
                    {updateStatus === 'loading' ? (
                      <>
                        <div className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                        Requesting...
                      </>
                    ) : (
                      'Confirm Update'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

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
            {effectiveOverallStats && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="text-center p-6 border border-white/10 rounded-xl bg-black/20">
                  <div className="text-3xl font-light mb-2 text-white">
                    {formatValue(effectiveOverallStats.total_matches ?? '-')}
                  </div>
                  <div className="text-xs text-gray-400 uppercase tracking-wider">Matches</div>
                </div>
                <div className="text-center p-6 border border-white/10 rounded-xl bg-black/20">
                  <div className="text-3xl font-light mb-2 text-white">
                    {(() => {
                      const value = extractStatValue(effectiveOverallStats.total_wins, ['wins', 'total'])
                      return value === null ? '-' : formatValue(value)
                    })()}
                  </div>
                  <div className="text-xs text-gray-400 uppercase tracking-wider">Wins</div>
                </div>
                <div className="text-center p-6 border border-white/10 rounded-xl bg-black/20">
                  <div className="text-3xl font-light mb-2 text-white">
                    {(() => {
                      const matchesValue = extractStatValue(effectiveOverallStats.total_matches)
                      const winsValue = extractStatValue(effectiveOverallStats.total_wins, ['wins', 'total'])
                      const matches = Number(matchesValue)
                      const wins = Number(winsValue)
                      if (!Number.isFinite(matches) || matches <= 0) return '-'
                      if (!Number.isFinite(wins)) return '-'
                      return `${((wins / matches) * 100).toFixed(1)}%`
                    })()}
                  </div>
                  <div className="text-xs text-gray-400 uppercase tracking-wider">Win Rate</div>
                </div>
                {hasStatValue(effectiveOverallStats.total_kills) && (
                  <div className="text-center p-6 border border-white/10 rounded-xl bg-black/20">
                    <div className="text-3xl font-light mb-2 text-white">
                      {(() => {
                        const value = extractStatValue(effectiveOverallStats.total_kills, ['kills', 'value', 'total'])
                        return value === null ? '-' : formatValue(value)
                      })()}
                    </div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider">Kills</div>
                  </div>
                )}
                {hasStatValue(effectiveOverallStats.total_deaths) && (
                  <div className="text-center p-6 border border-white/10 rounded-xl bg-black/20">
                    <div className="text-3xl font-light mb-2 text-white">
                      {(() => {
                        const value = extractStatValue(effectiveOverallStats.total_deaths, ['deaths', 'value', 'total'])
                        return value === null ? '-' : formatValue(value)
                      })()}
                    </div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider">Deaths</div>
                  </div>
                )}
                {hasStatValue(effectiveOverallStats.overall_kd) && (
                  <div className="text-center p-6 border border-white/10 rounded-xl bg-black/20">
                    <div className="text-3xl font-light mb-2 text-white">
                      {formatRatio(extractStatValue(effectiveOverallStats.overall_kd, ['kd', 'value', 'ratio']))}
                    </div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider">K/D</div>
                  </div>
                )}
                {hasStatValue(effectiveOverallStats.overall_kda) && (
                  <div className="text-center p-6 border border-white/10 rounded-xl bg-black/20">
                    <div className="text-3xl font-light mb-2 text-white">
                      {formatRatio(extractStatValue(effectiveOverallStats.overall_kda, ['kda', 'value', 'kda_raw']))}
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
                {effectiveOverallStats && (
                  <div className="border border-white/10 bg-white/[0.02] rounded-2xl p-8">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-light text-white">Overall Statistics</h2>
                      <button
                        onClick={() => setShowStatsInfoModal(true)}
                        className="text-xs px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white transition-colors"
                      >
                        Missing Stats?
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {effectiveOverallStats.total_play_time && (
                        <div className="text-center p-6 border border-white/10 rounded-xl bg-black/20">
                          <div className="text-2xl font-light mb-2 text-white">
                            {effectiveOverallStats.total_play_time.playtime ?? '-'}
                          </div>
                          <div className="text-xs text-gray-400 uppercase tracking-wider">Play Time</div>
                        </div>
                      )}
                      {hasStatValue(effectiveOverallStats.total_kills) && (
                        <div className="text-center p-6 border border-white/10 rounded-xl bg-black/20">
                          <div className="text-3xl font-light mb-2 text-white">
                            {(() => {
                              const value = extractStatValue(effectiveOverallStats.total_kills, ['kills', 'value', 'total'])
                              return value === null ? '-' : formatValue(value)
                            })()}
                          </div>
                          <div className="text-xs text-gray-400 uppercase tracking-wider">Total Kills</div>
                        </div>
                      )}
                      {hasStatValue(effectiveOverallStats.total_deaths) && (
                        <div className="text-center p-6 border border-white/10 rounded-xl bg-black/20">
                          <div className="text-3xl font-light mb-2 text-white">
                            {(() => {
                              const value = extractStatValue(effectiveOverallStats.total_deaths, ['deaths', 'value', 'total'])
                              return value === null ? '-' : formatValue(value)
                            })()}
                          </div>
                          <div className="text-xs text-gray-400 uppercase tracking-wider">Total Deaths</div>
                        </div>
                      )}
                      {hasStatValue(effectiveOverallStats.total_assists) && (
                        <div className="text-center p-6 border border-white/10 rounded-xl bg-black/20">
                          <div className="text-3xl font-light mb-2 text-white">
                            {(() => {
                              const value = extractStatValue(effectiveOverallStats.total_assists, ['assists', 'value', 'total'])
                              return value === null ? '-' : formatValue(value)
                            })()}
                          </div>
                          <div className="text-xs text-gray-400 uppercase tracking-wider">Total Assists</div>
                        </div>
                      )}
                      {effectiveOverallStats.total_damage && (
                        <div className="text-center p-6 border border-white/10 rounded-xl bg-black/20">
                          <div className="text-2xl font-light mb-2 text-white">
                            {effectiveOverallStats.total_damage.damage ?? '-'}
                          </div>
                          <div className="text-xs text-gray-400 uppercase tracking-wider">Total Damage</div>
                        </div>
                      )}
                      {effectiveOverallStats.total_healing && (
                        <div className="text-center p-6 border border-white/10 rounded-xl bg-black/20">
                          <div className="text-2xl font-light mb-2 text-white">
                            {effectiveOverallStats.total_healing.healing ?? '-'}
                          </div>
                          <div className="text-xs text-gray-400 uppercase tracking-wider">Total Healing</div>
                        </div>
                      )}
                      {effectiveOverallStats.total_damage_taken && (
                        <div className="text-center p-6 border border-white/10 rounded-xl bg-black/20">
                          <div className="text-2xl font-light mb-2 text-white">
                            {effectiveOverallStats.total_damage_taken.damage_taken ?? '-'}
                          </div>
                          <div className="text-xs text-gray-400 uppercase tracking-wider">Damage Taken</div>
                        </div>
                      )}
                      {effectiveOverallStats.per_minute && (
                        <>
                          <div className="text-center p-6 border border-white/10 rounded-xl bg-black/20">
                            <div className="text-2xl font-light mb-2 text-white">
                              {formatValue(effectiveOverallStats.per_minute.total_damage_per_minute ?? 0)}/min
                            </div>
                            <div className="text-xs text-gray-400 uppercase tracking-wider">Dmg/Min</div>
                          </div>
                          <div className="text-center p-6 border border-white/10 rounded-xl bg-black/20">
                            <div className="text-2xl font-light mb-2 text-white">
                              {formatValue(effectiveOverallStats.per_minute.total_healing_per_minute ?? 0)}/min
                            </div>
                            <div className="text-xs text-gray-400 uppercase tracking-wider">Heal/Min</div>
                          </div>
                        </>
                      )}
                      {effectiveOverallStats.total_mvps && (
                        <div className="text-center p-6 border border-white/10 rounded-xl bg-black/20">
                          <div className="text-3xl font-light mb-2 text-white">
                            {effectiveOverallStats.total_mvps.mvps ?? 0}
                          </div>
                          <div className="text-xs text-gray-400 uppercase tracking-wider">MVPs</div>
                        </div>
                      )}
                      {effectiveOverallStats.total_svps && (
                        <div className="text-center p-6 border border-white/10 rounded-xl bg-black/20">
                          <div className="text-3xl font-light mb-2 text-white">
                            {effectiveOverallStats.total_svps.svps ?? 0}
                          </div>
                          <div className="text-xs text-gray-400 uppercase tracking-wider">SVPs</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Ranked Stats */}
                {effectiveOverallStats?.ranked && (
                  <div className="border border-white/10 bg-white/[0.02] rounded-2xl p-8">
                    <h2 className="text-2xl font-light mb-6 text-white">Ranked Statistics</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      <div className="text-center p-6 border border-white/10 rounded-xl bg-black/20">
                        <div className="text-3xl font-light mb-2 text-white">{effectiveOverallStats.ranked.total_matches ?? '-'}</div>
                        <div className="text-xs text-gray-400 uppercase tracking-wider">Matches</div>
                      </div>
                      <div className="text-center p-6 border border-white/10 rounded-xl bg-black/20">
                        <div className="text-3xl font-light mb-2 text-white">{effectiveOverallStats.ranked.total_wins ?? '-'}</div>
                        <div className="text-xs text-gray-400 uppercase tracking-wider">Wins</div>
                      </div>
                      <div className="text-center p-6 border border-white/10 rounded-xl bg-black/20">
                        <div className="text-3xl font-light mb-2 text-white">{effectiveOverallStats.ranked.total_kills ?? '-'}</div>
                        <div className="text-xs text-gray-400 uppercase tracking-wider">Kills</div>
                      </div>
                      <div className="text-center p-6 border border-white/10 rounded-xl bg-black/20">
                        <div className="text-3xl font-light mb-2 text-white">{effectiveOverallStats.ranked.total_deaths ?? '-'}</div>
                        <div className="text-xs text-gray-400 uppercase tracking-wider">Deaths</div>
                      </div>
                      <div className="text-center p-6 border border-white/10 rounded-xl bg-black/20">
                        <div className="text-3xl font-light mb-2 text-white">{effectiveOverallStats.ranked.total_assists ?? '-'}</div>
                        <div className="text-xs text-gray-400 uppercase tracking-wider">Assists</div>
                      </div>
                      <div className="text-center p-6 border border-white/10 rounded-xl bg-black/20">
                        <div className="text-2xl font-light mb-2 text-white">{effectiveOverallStats.ranked.total_time_played ?? '-'}</div>
                        <div className="text-xs text-gray-400 uppercase tracking-wider">Play Time</div>
                      </div>
                      <div className="text-center p-6 border border-white/10 rounded-xl bg-black/20">
                        <div className="text-3xl font-light mb-2 text-white">{effectiveOverallStats.ranked.total_mvp ?? 0}</div>
                        <div className="text-xs text-gray-400 uppercase tracking-wider">MVPs</div>
                      </div>
                      <div className="text-center p-6 border border-white/10 rounded-xl bg-black/20">
                        <div className="text-3xl font-light mb-2 text-white">{effectiveOverallStats.ranked.total_svp ?? 0}</div>
                        <div className="text-xs text-gray-400 uppercase tracking-wider">SVPs</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Unranked Stats */}
                {effectiveOverallStats?.unranked && (
                  <div className="border border-white/10 bg-white/[0.02] rounded-2xl p-8">
                    <h2 className="text-2xl font-light mb-6 text-white">Unranked Statistics</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      <div className="text-center p-6 border border-white/10 rounded-xl bg-black/20">
                        <div className="text-3xl font-light mb-2 text-white">{effectiveOverallStats.unranked.total_matches ?? '-'}</div>
                        <div className="text-xs text-gray-400 uppercase tracking-wider">Matches</div>
                      </div>
                      <div className="text-center p-6 border border-white/10 rounded-xl bg-black/20">
                        <div className="text-3xl font-light mb-2 text-white">{effectiveOverallStats.unranked.total_wins ?? '-'}</div>
                        <div className="text-xs text-gray-400 uppercase tracking-wider">Wins</div>
                      </div>
                      <div className="text-center p-6 border border-white/10 rounded-xl bg-black/20">
                        <div className="text-3xl font-light mb-2 text-white">{effectiveOverallStats.unranked.total_kills ?? '-'}</div>
                        <div className="text-xs text-gray-400 uppercase tracking-wider">Kills</div>
                      </div>
                      <div className="text-center p-6 border border-white/10 rounded-xl bg-black/20">
                        <div className="text-3xl font-light mb-2 text-white">{effectiveOverallStats.unranked.total_deaths ?? '-'}</div>
                        <div className="text-xs text-gray-400 uppercase tracking-wider">Deaths</div>
                      </div>
                      <div className="text-center p-6 border border-white/10 rounded-xl bg-black/20">
                        <div className="text-3xl font-light mb-2 text-white">{effectiveOverallStats.unranked.total_assists ?? '-'}</div>
                        <div className="text-xs text-gray-400 uppercase tracking-wider">Assists</div>
                      </div>
                      <div className="text-center p-6 border border-white/10 rounded-xl bg-black/20">
                        <div className="text-2xl font-light mb-2 text-white">{effectiveOverallStats.unranked.total_time_played ?? '-'}</div>
                        <div className="text-xs text-gray-400 uppercase tracking-wider">Play Time</div>
                      </div>
                      <div className="text-center p-6 border border-white/10 rounded-xl bg-black/20">
                        <div className="text-3xl font-light mb-2 text-white">{effectiveOverallStats.unranked.total_mvp ?? 0}</div>
                        <div className="text-xs text-gray-400 uppercase tracking-wider">MVPs</div>
                      </div>
                      <div className="text-center p-6 border border-white/10 rounded-xl bg-black/20">
                        <div className="text-3xl font-light mb-2 text-white">{effectiveOverallStats.unranked.total_svp ?? 0}</div>
                        <div className="text-xs text-gray-400 uppercase tracking-wider">SVPs</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Roles Played */}
                {effectiveOverallStats?.roles_played && (
                  <div className="border border-white/10 bg-white/[0.02] rounded-2xl p-8">
                    <h2 className="text-2xl font-light mb-6 text-white">Role Statistics</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {effectiveOverallStats.roles_played.duelist && (
                        <div className="border border-white/10 rounded-xl p-6 bg-black/20">
                          <h3 className="text-xl font-medium mb-4 text-white">Duelist</h3>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Matches:</span>
                              <span className="text-white">{effectiveOverallStats.roles_played.duelist.matches_played?.toFixed(1) ?? '-'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Win Rate:</span>
                              <span className="text-white">{effectiveOverallStats.roles_played.duelist.win_percentage?.win_rate ?? '-'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">K/D:</span>
                              <span className="text-white">{effectiveOverallStats.roles_played.duelist.kd_ratio?.kd ?? '-'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Kills:</span>
                              <span className="text-white">{effectiveOverallStats.roles_played.duelist.kills ?? '-'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Play Time:</span>
                              <span className="text-white">{effectiveOverallStats.roles_played.duelist.total_time_played?.playtime ?? '-'}</span>
                            </div>
                          </div>
                        </div>
                      )}
                      {effectiveOverallStats.roles_played.strategist && (
                        <div className="border border-white/10 rounded-xl p-6 bg-black/20">
                          <h3 className="text-xl font-medium mb-4 text-white">Strategist</h3>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Matches:</span>
                              <span className="text-white">{effectiveOverallStats.roles_played.strategist.matches_played?.toFixed(1) ?? '-'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Win Rate:</span>
                              <span className="text-white">{effectiveOverallStats.roles_played.strategist.win_percentage?.win_rate ?? '-'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">K/D:</span>
                              <span className="text-white">{effectiveOverallStats.roles_played.strategist.kd_ratio?.kd ?? '-'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Kills:</span>
                              <span className="text-white">{effectiveOverallStats.roles_played.strategist.kills ?? '-'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Play Time:</span>
                              <span className="text-white">{effectiveOverallStats.roles_played.strategist.total_time_played?.playtime ?? '-'}</span>
                            </div>
                          </div>
                        </div>
                      )}
                      {effectiveOverallStats.roles_played.vanguard && (
                        <div className="border border-white/10 rounded-xl p-6 bg-black/20">
                          <h3 className="text-xl font-medium mb-4 text-white">Vanguard</h3>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-400">Matches:</span>
                              <span className="text-white">{effectiveOverallStats.roles_played.vanguard.matches_played?.toFixed(1) ?? '-'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Win Rate:</span>
                              <span className="text-white">{effectiveOverallStats.roles_played.vanguard.win_percentage?.win_rate ?? '-'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">K/D:</span>
                              <span className="text-white">{effectiveOverallStats.roles_played.vanguard.kd_ratio?.kd ?? '-'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Kills:</span>
                              <span className="text-white">{effectiveOverallStats.roles_played.vanguard.kills ?? '-'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-400">Play Time:</span>
                              <span className="text-white">{effectiveOverallStats.roles_played.vanguard.total_time_played?.playtime ?? '-'}</span>
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
                      {playerData.rank_history.slice(0, 10).map((entry, idx) => {
                        const addScore = entry?.score_progression?.add_score
                        const hasAddScore = typeof addScore === 'number' && Number.isFinite(addScore)
                        const addScoreDisplay = hasAddScore
                          ? `${addScore >= 0 ? '+' : ''}${addScore.toFixed(1)}`
                          : '-'
                        const addScoreClass = hasAddScore
                          ? addScore >= 0
                            ? 'text-green-400'
                            : 'text-red-400'
                          : 'text-gray-400'

                        return (
                          <div key={idx} className="flex items-center justify-between p-4 border border-white/10 rounded-lg bg-black/20">
                            <div>
                              <div className="text-white font-medium">
                                Level {entry.level_progression.from} → Level {entry.level_progression.to}
                              </div>
                              <div className="text-sm text-gray-400">{formatDate(entry.match_time_stamp)}</div>
                            </div>
                            <div className={`text-lg font-medium ${addScoreClass}`}>
                              {addScoreDisplay}
                            </div>
                          </div>
                        )
                      })}
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
                    {playerData.match_history.map((match, idx) => {
                      const scoreChange = match?.player_performance?.score_change
                      const hasScoreChange = typeof scoreChange === 'number' && Number.isFinite(scoreChange)
                      const scoreChangeDisplay = hasScoreChange
                        ? `${scoreChange >= 0 ? '+' : ''}${scoreChange.toFixed(1)}`
                        : '-'
                      const scoreChangeClass = hasScoreChange
                        ? scoreChange >= 0
                          ? 'text-green-400'
                          : 'text-red-400'
                        : 'text-gray-400'
                      const candidates = getAssetCandidates(match.map_thumbnail)
                      const href = match.match_uid ? `/matches/${match.match_uid}` : null

                      const card = (
                        <div className="border border-white/10 bg-white/[0.02] rounded-xl p-6 transition-all group hover:border-white/20 hover:bg-white/[0.04]">
                          <div className="flex items-start gap-6">
                            {candidates.length > 0 && (
                              <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-white/10 flex-shrink-0">
                                <img
                                  src={candidates[0]}
                                  alt={getMapDisplayName(match)}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                  data-attempt="0"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    const attempt = Number(target.dataset.attempt || '0') + 1
                                    const nextSrc = candidates[attempt]
                                    if (nextSrc) {
                                      target.dataset.attempt = String(attempt)
                                      target.src = nextSrc
                                    } else {
                                      target.style.display = 'none'
                                    }
                                  }}
                                />
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-4">
                                  {match.player_performance.hero_type && (() => {
                                    const heroCandidates = getAssetCandidates(match.player_performance.hero_type)
                                    if (heroCandidates.length === 0) return null
                                    return (
                                      <div className="relative w-12 h-12 rounded overflow-hidden border border-white/10">
                                        <img
                                          src={heroCandidates[0]}
                                          alt={toTitleCase(match.player_performance.hero_name)}
                                          className="w-full h-full object-cover"
                                          loading="lazy"
                                          data-attempt="0"
                                          onError={(e) => {
                                            const target = e.target as HTMLImageElement
                                            const attempt = Number(target.dataset.attempt || '0') + 1
                                            const nextSrc = heroCandidates[attempt]
                                            if (nextSrc) {
                                              target.dataset.attempt = String(attempt)
                                              target.src = nextSrc
                                            } else {
                                              target.style.display = 'none'
                                            }
                                          }}
                                        />
                                      </div>
                                    )
                                  })()}
                                  <div>
                                    <div className="text-white font-medium">{toTitleCase(match.player_performance.hero_name)}</div>
                                    <div className="text-sm text-gray-400">{formatDate(match.match_time_stamp)}</div>
                                    <div className="text-xs text-gray-500 mt-1">{getMapDisplayName(match)}</div>
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
                                  <span className={scoreChangeClass}>{scoreChangeDisplay}</span>
                                </div>
                                <div>
                                  <span className="text-gray-400">Duration: </span>
                                  <span className="text-white">{Math.floor(match.duration / 60)}m {Math.floor(match.duration % 60)}s</span>
                                </div>
                              </div>
                              {href && (
                                <div className="mt-4 flex items-center text-xs text-gray-400 group-hover:text-white transition-colors">
                                  View full match ↗
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )

                      if (href) {
                        return (
                          <Link key={match.match_uid || idx} href={href} className="block" prefetch={true}>
                            {card}
                          </Link>
                        )
                      }

                      return (
                        <div key={match.match_uid || idx}>
                          {card}
                        </div>
                      )
                    })}
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
                                {(() => {
                                  const candidates = getAssetCandidates(hero.hero_thumbnail)
                                  if (candidates.length === 0) return null
                                  return (
                                    <img
                                      src={candidates[0]}
                                      alt={toTitleCase(hero.hero_name)}
                                      className="w-full h-full object-cover"
                                      loading="lazy"
                                      data-attempt="0"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement
                                        const attempt = Number(target.dataset.attempt || '0') + 1
                                        const nextSrc = candidates[attempt]
                                        if (nextSrc) {
                                          target.dataset.attempt = String(attempt)
                                          target.src = nextSrc
                                        } else {
                                          target.style.display = 'none'
                                        }
                                      }}
                                    />
                                  )
                                })()}
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
                        <div className="text-lg font-medium text-white mb-3">{getMapDisplayName(map)}</div>
                        {map.map_thumbnail && (
                          <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-white/10 mb-4">
                            {(() => {
                              const candidates = getAssetCandidates(map.map_thumbnail)
                              if (candidates.length === 0) return null
                              return (
                                <img
                                  src={candidates[0]}
                                  alt={getMapDisplayName(map)}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                  data-attempt="0"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    const attempt = Number(target.dataset.attempt || '0') + 1
                                    const nextSrc = candidates[attempt]
                                    if (nextSrc) {
                                      target.dataset.attempt = String(attempt)
                                      target.src = nextSrc
                                    } else {
                                      target.style.display = 'none'
                                    }
                                  }}
                                />
                              )
                            })()}
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

