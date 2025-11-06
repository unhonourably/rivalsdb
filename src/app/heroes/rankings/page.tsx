'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

interface HeroRanking {
  id: string
  name: string
  role: string
  image_url?: string
  rivals_db_score: number
  win_rate: number
  kda: number
  matches: number
  kills: number
  deaths: number
  assists: number
  total_hero_damage: number
  total_damage_taken: number
  total_hero_heal: number
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

const getRoleColor = (role: string): string => {
  const roleLower = role.toLowerCase()
  if (roleLower.includes('duelist')) return 'from-red-500/20 to-red-900/20 border-red-500/30'
  if (roleLower.includes('vanguard')) return 'from-blue-500/20 to-blue-900/20 border-blue-500/30'
  if (roleLower.includes('strategist')) return 'from-green-500/20 to-green-900/20 border-green-500/30'
  return 'from-gray-500/20 to-gray-900/20 border-gray-500/30'
}

const getRoleBadgeColor = (role: string): string => {
  const roleLower = role.toLowerCase()
  if (roleLower.includes('duelist')) return 'bg-red-500/20 border-red-500/50 text-red-300'
  if (roleLower.includes('vanguard')) return 'bg-blue-500/20 border-blue-500/50 text-blue-300'
  if (roleLower.includes('strategist')) return 'bg-green-500/20 border-green-500/50 text-green-300'
  return 'bg-gray-500/20 border-gray-500/50 text-gray-300'
}

const getScoreColor = (score: number): string => {
  if (score >= 70) return 'text-green-400'
  if (score >= 50) return 'text-yellow-400'
  return 'text-red-400'
}

const getRankMedal = (rank: number): string => {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return `#${rank}`
}

export default function HeroRankingsPage() {
  const [heroes, setHeroes] = useState<HeroRanking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/heroes/rankings')
        if (response.ok) {
          const data = await response.json()
          setHeroes(data.heroes || [])
        } else {
          setError('Failed to load hero rankings')
        }
      } catch (err) {
        console.error('Error fetching hero rankings:', err)
        setError('Failed to load hero rankings')
      } finally {
        setLoading(false)
      }
    }

    fetchRankings()
  }, [])

  return (
    <div className="min-h-screen flex flex-col bg-black">
      <Navbar />
      <div className="background"></div>

      <main className="flex-1 pt-32 pb-24 px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 animate-fade-in-up">
            <h1 className="text-4xl md:text-6xl font-light text-white mb-6">
              Hero <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">Rankings</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-3xl mx-auto mb-4">
              Comprehensive hero rankings based on our RivalsDB Score algorithm, analyzing win rate, KDA, eliminations per match, accuracy, and average score across all competitive matches.
            </p>
            <div className="inline-block px-6 py-2 rounded-full bg-white/5 border border-white/10 text-gray-300 text-sm">
              Minimum 200 matches required for ranking
            </div>
          </div>

          {loading && (
            <div className="py-20 flex justify-center">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
                <p className="text-gray-400 mt-4">Loading hero rankings...</p>
              </div>
            </div>
          )}

          {error && !loading && (
            <div className="border border-red-500/30 bg-red-500/10 rounded-2xl p-6 text-center text-red-300">
              {error}
            </div>
          )}

          {!loading && !error && heroes.length > 0 && (
            <div className="space-y-4">
              {heroes.map((hero, index) => {
                const rank = index + 1
                const imageCandidates = getAssetCandidates(hero.image_url)
                const roleColor = getRoleColor(hero.role)
                const roleBadgeColor = getRoleBadgeColor(hero.role)
                const scoreColor = getScoreColor(hero.rivals_db_score)

                return (
                  <Link
                    key={hero.id}
                    href={`/heroes/${hero.id}`}
                    className="block group"
                  >
                    <div
                      className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${roleColor} backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl`}
                      style={{
                        animationDelay: `${index * 0.05}s`,
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent"></div>
                      
                      <div className="relative flex items-center gap-6 p-6">
                        <div className="flex-shrink-0 flex items-center justify-center w-16 h-16 rounded-full bg-black/50 border border-white/20 text-2xl font-bold text-white">
                          {getRankMedal(rank)}
                        </div>

                        {imageCandidates.length > 0 && (
                          <div className="flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden border-2 border-white/20 bg-black/30">
                            <SmartImage
                              paths={imageCandidates}
                              alt={hero.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-2xl font-bold text-white truncate">
                              {toTitleCase(hero.name)}
                            </h2>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium border ${roleBadgeColor}`}>
                              {toTitleCase(hero.role)}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-gray-400 text-xs mb-1">RivalsDB Score</p>
                              <p className={`text-xl font-bold ${scoreColor}`}>
                                {hero.rivals_db_score.toFixed(1)}
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-400 text-xs mb-1">Win Rate</p>
                              <p className="text-white font-semibold">
                                {((hero.win_rate > 1 ? hero.win_rate : hero.win_rate * 100)).toFixed(1)}%
                              </p>
                            </div>
                            <div>
                              <p className="text-gray-400 text-xs mb-1">KDA</p>
                              <p className="text-white font-semibold">{hero.kda.toFixed(2)}</p>
                            </div>
                            <div>
                              <p className="text-gray-400 text-xs mb-1">Matches</p>
                              <p className="text-white font-semibold">{hero.matches.toLocaleString()}</p>
                            </div>
                          </div>
                        </div>

                        <div className="hidden lg:flex flex-col items-end gap-2 text-sm">
                          {hero.role.toLowerCase().includes('duelist') && (
                            <div className="text-right">
                              <p className="text-gray-400 text-xs">Total Damage</p>
                              <p className="text-red-300 font-semibold">{hero.total_hero_damage.toLocaleString()}</p>
                            </div>
                          )}
                          {hero.role.toLowerCase().includes('vanguard') && (
                            <div className="text-right">
                              <p className="text-gray-400 text-xs">Damage Taken</p>
                              <p className="text-blue-300 font-semibold">{hero.total_damage_taken.toLocaleString()}</p>
                            </div>
                          )}
                          {hero.role.toLowerCase().includes('strategist') && (
                            <div className="text-right">
                              <p className="text-gray-400 text-xs">Total Healing</p>
                              <p className="text-green-300 font-semibold">{hero.total_hero_heal.toLocaleString()}</p>
                            </div>
                          )}
                        </div>

                        <div className="flex-shrink-0">
                          <svg
                            className="w-6 h-6 text-gray-400 group-hover:text-white group-hover:translate-x-1 transition-all"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}

          {!loading && !error && heroes.length === 0 && (
            <div className="text-center text-gray-400 py-20 border border-white/10 bg-white/[0.02] rounded-2xl">
              No hero rankings available at this time.
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}

