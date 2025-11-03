'use client'

import { useEffect, useMemo, useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

const API_KEY = '188d3cd06e7db493dbd00811774d009528e8516c560a6b3e2751c2e411c40f9f'
const API_BASE = 'https://marvelrivalsapi.com/api/v1'

interface BattlePassItem {
  name?: string
  image?: string
  cost?: string | number
  isLuxury?: boolean
  [key: string]: unknown
}

interface BattlePassSeason {
  season?: number
  season_name?: string
  items?: BattlePassItem[]
  [key: string]: unknown
}

const isBattlePassSeason = (value: unknown): value is BattlePassSeason => {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  if (Array.isArray(record.items)) return true
  if (typeof record.season === 'number') return true
  if (typeof record.season_name === 'string') return true
  return false
}

const extractBattlePassSeasons = (payload: unknown): BattlePassSeason[] => {
  if (Array.isArray(payload)) {
    return payload.filter(isBattlePassSeason)
  }
  if (!payload || typeof payload !== 'object') return []
  const record = payload as Record<string, unknown>
  if ('data' in record) {
    return extractBattlePassSeasons(record.data)
  }
  return isBattlePassSeason(payload) ? [payload] : []
}

const pickBattlePassSeason = (payload: unknown): BattlePassSeason | null => {
  const seasons = extractBattlePassSeasons(payload)
  return seasons.length > 0 ? seasons[0] : null
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
          setAttempt(prev => prev + 1)
        }
      }}
      style={{ opacity: 0, animation: 'fadeIn 0.3s forwards' }}
    />
  )
}

const parseCost = (value?: string | number): string => {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'number') return value.toLocaleString()
  const trimmed = value.trim()
  const numeric = Number(trimmed)
  if (Number.isFinite(numeric)) return numeric.toLocaleString()
  return trimmed
}

const toTitleCase = (value?: string): string => {
  if (!value) return ''
  return value
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export default function BattlePassPage() {
  const [seasonData, setSeasonData] = useState<BattlePassSeason | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [seasonInput, setSeasonInput] = useState('')
  const [availableSeasons, setAvailableSeasons] = useState<number[]>([])

  useEffect(() => {
    const fetchInitialSeason = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`${API_BASE}/battlepass`, {
          headers: { 'x-api-key': API_KEY }
        })

        if (!response.ok) {
          throw new Error(`Failed to load battle pass data (${response.status})`)
        }

        const payload = await response.json()
        const seasons = extractBattlePassSeasons(payload)

        if (seasons.length === 0) {
          throw new Error('No battle pass data available.')
        }

        const firstSeason = seasons[0]
        setSeasonData(firstSeason)
        setAvailableSeasons(
          seasons
            .map(entry => entry.season)
            .filter((season): season is number => typeof season === 'number')
        )
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load battle pass data'
        setError(message)
        console.error('Failed to fetch battle pass:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchInitialSeason()
  }, [])

  const seasonsList = useMemo(() => {
    const existing = new Set<number>()
    availableSeasons.forEach(season => existing.add(season))
    if (seasonData?.season && !existing.has(seasonData.season)) {
      existing.add(seasonData.season)
    }
    const list = Array.from(existing)
    list.sort((a, b) => a - b)
    return list
  }, [availableSeasons, seasonData])

  const handleFetchSeason = async (season?: number) => {
    const selected = season ?? Number(seasonInput)
    if (!Number.isFinite(selected) || selected <= 0) {
      setError('Enter a valid season number.')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const url = `${API_BASE}/battlepass?season=${selected}`
      const response = await fetch(url, {
        headers: { 'x-api-key': API_KEY }
      })

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Season ${selected} was not found.`)
        }
        throw new Error(`Failed to load season ${selected} (${response.status})`)
      }

      const payload = await response.json()
      const seasonDataPayload = pickBattlePassSeason(payload)

      if (!seasonDataPayload) {
        throw new Error('Unexpected response for battle pass season.')
      }

      setSeasonData(seasonDataPayload)
      setAvailableSeasons(prev => (prev.includes(selected) ? prev : [...prev, selected]))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load battle pass data'
      setError(message)
      console.error('Failed to fetch battle pass season:', err)
    } finally {
      setLoading(false)
    }
  }

  const items = seasonData?.items ?? []

  return (
    <div className="min-h-screen flex flex-col bg-black">
      <Navbar />
      <div className="background"></div>

      <main className="flex-1 pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex flex-wrap items-start justify-between gap-6 mb-10">
            <div>
              <h1 className="text-4xl md:text-5xl font-light text-white mb-3">Battle Pass</h1>
              <p className="text-gray-400 max-w-2xl">
                Browse Battle Pass rewards by season, including luxury unlocks and seasonal cosmetics.
              </p>
              {seasonData?.season_name && (
                <p className="text-white/80 mt-2 text-sm uppercase tracking-[0.3em]">
                  {seasonData.season_name}
                </p>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <input
                type="number"
                min={1}
                placeholder="Season number..."
                value={seasonInput}
                onChange={e => setSeasonInput(e.target.value)}
                className="flex-1 sm:w-48 px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-gray-500 focus:outline-none focus:border-white/30"
              />
              <button
                type="button"
                onClick={() => handleFetchSeason()}
                className="px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white hover:bg-white/10 transition-colors"
                disabled={loading}
              >
                Load Season
              </button>
            </div>
          </div>

          {loading && (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
              <p className="text-gray-400 mt-4">Fetching battle pass rewards...</p>
            </div>
          )}

          {error && !loading && (
            <div className="border border-red-500/30 bg-red-500/10 rounded-2xl p-6 text-center text-red-300">
              {error}
            </div>
          )}

          {!loading && !error && items.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item, index) => {
                const iconCandidates = getAssetCandidates(item.image as string)
                const costLabel = parseCost(item.cost as string | number)
                const isLuxury = Boolean(item.isLuxury)

                return (
                  <div key={`${item.name ?? 'item'}-${index}`} className={`border border-white/10 bg-white/[0.02] rounded-2xl p-6 flex flex-col gap-4 transition-all hover:border-white/20 ${isLuxury ? 'shadow-[0_0_35px_-15px_rgba(255,215,0,0.6)]' : ''}`}>
                    <div className="flex items-start gap-4">
                      {iconCandidates.length > 0 && (
                        <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-white/10">
                          <SmartImage paths={iconCandidates} alt={item.name ?? 'Battle Pass Item'} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h2 className="text-lg font-semibold text-white break-words" title={item.name ?? ''}>
                          {item.name ?? 'Unknown Reward'}
                        </h2>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.3em]">
                          <span className="px-2 py-0.5 rounded-full border border-white/10 bg-white/5 text-white/80">{costLabel}</span>
                          <span className={`px-2 py-0.5 rounded-full border ${isLuxury ? 'border-yellow-400/50 bg-yellow-400/10 text-yellow-200' : 'border-white/10 bg-white/5 text-white/80'}`}>
                            {isLuxury ? 'Luxury' : 'Standard'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {!loading && !error && items.length === 0 && (
            <div className="text-center text-gray-400 py-20 border border-white/10 bg-white/[0.02] rounded-2xl">
              No rewards found for this season.
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}

