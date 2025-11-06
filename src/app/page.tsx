'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import rivalsLogo from '@/components/rivalslogo.png'

const API_BASE = 'https://marvelrivalsapi.com/api/v1'
const API_BASE_V2 = 'https://marvelrivalsapi.com/api/v2'

interface HeroShowcase {
  id: string
  name: string
  role?: string
  image_url?: string
  displayValue: string | number
  score: number
  stats?: {
    wins?: number
    matches?: number
    win_rate?: number
    total_hero_damage?: string
    total_damage_taken?: string
    total_hero_heal?: string
    play_time?: string
  }
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
  rank_label?: string
  rank_color?: string
  player_icon?: string
  displayValue: string | number
  score: number
  win_count?: number
  battle_count?: number
  win_rate?: string
  level?: number
  max_level?: number
  rank_score?: number
  max_rank_score?: number
  iconPaths: string[]
}

interface BestHero {
  hero: {
    id: string
    name: string
    role?: string
    image_url?: string
  }
  stats: {
    matches?: number
    wins?: number
    losses?: number
    win_rate?: number
    kda?: number
    total_hero_damage?: number
    total_damage_taken?: number
    total_hero_heal?: number
    average_score?: number
    rivals_db_score?: number
  }
  bestPlayer: {
    name?: string
    uid?: string
    icon?: string
    wins?: number
    matches?: number
    kills?: number
    deaths?: number
    assists?: number
    rank?: number
  } | null
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
  const percentage = value > 1 ? value : value * 100
  return `${percentage.toFixed(1)}%`
}

const formatNumber = (value?: number): string => {
  if (value === undefined || value === null || Number.isNaN(value)) return '-'
  return value.toLocaleString()
}

export default function Home() {
  const [topHeroes, setTopHeroes] = useState<HeroShowcase[]>([])
  const [topPlayers, setTopPlayers] = useState<PlayerShowcase[]>([])
  const [bestHeroes, setBestHeroes] = useState<BestHero[]>([])
  const [heroLoading, setHeroLoading] = useState(true)
  const [playerLoading, setPlayerLoading] = useState(true)
  const [bestHeroesLoading, setBestHeroesLoading] = useState(true)
  const [showcaseError, setShowcaseError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<'wins' | 'winrate' | 'damage' | 'damage_taken' | 'healing' | 'playtime'>('wins')
  const [selectedPlayerCategory, setSelectedPlayerCategory] = useState<'score' | 'winrate' | 'win_count' | 'max_level' | 'battle_count' | 'max_rank_score'>('score')
  const [recentUpdates, setRecentUpdates] = useState<any>(null)
  const [battlePassItems, setBattlePassItems] = useState<any[]>([])
  const [battlePassSeasonName, setBattlePassSeasonName] = useState<string>('')
  const [currentUpdateIndex, setCurrentUpdateIndex] = useState(0)
  const [currentBattlePassIndex, setCurrentBattlePassIndex] = useState(0)
  
  const categoryLabels: Record<string, string> = {
    wins: 'Overall Wins',
    winrate: 'Overall Win Rate',
    damage: 'Total Damage',
    damage_taken: 'Total Damage Taken',
    healing: 'Total Healing',
    playtime: 'Playtime'
  }

  const playerCategoryLabels: Record<string, string> = {
    score: 'Overall Score',
    winrate: 'Win Rate',
    win_count: 'Win Count',
    max_level: 'Max Level',
    battle_count: 'Battle Count',
    max_rank_score: 'Max Rank Score'
  }

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

    const fetchTopHeroes = async (category: string): Promise<HeroShowcase[]> => {
      const response = await fetch(`/api/heroes/top?category=${category}&limit=3`, {
        signal: controller.signal
      })

      if (!response.ok) {
        throw new Error(`Failed to load top heroes (${response.status})`)
      }

      const data = await response.json()
      const heroesList = Array.isArray(data?.heroes) ? data.heroes : []

      return heroesList.map((item: any) => {
        const iconPaths = getAssetCandidates(item.image_url)
        return {
          id: item.id,
          name: toTitleCase(item.name || ''),
          role: item.role ? toTitleCase(item.role) : undefined,
          image_url: item.image_url,
          displayValue: item.displayValue,
          score: item.score,
          stats: item.stats,
          iconPaths: iconPaths.length ? iconPaths : []
        }
      })
    }


    const fetchTopPlayers = async (category: string): Promise<PlayerShowcase[]> => {
      const response = await fetch(`/api/players/top?category=${category}&limit=3`, {
        signal: controller.signal
      })

      if (!response.ok) {
        throw new Error(`Failed to load top players (${response.status})`)
      }

      const data = await response.json()
      const playersList = Array.isArray(data?.players) ? data.players : []

      return playersList.map((item: any) => {
        const iconPaths = getAssetCandidates(item.player_icon)
        return {
          uid: item.uid,
          name: toTitleCase(item.name || ''),
          rank_label: item.rank_label,
          rank_color: item.rank_color,
          player_icon: item.player_icon,
          displayValue: item.displayValue,
          score: item.score,
          win_count: item.win_count,
          battle_count: item.battle_count,
          win_rate: item.win_rate,
          level: item.level,
          max_level: item.max_level,
          rank_score: item.rank_score,
          max_rank_score: item.max_rank_score,
          iconPaths: iconPaths.length ? iconPaths : []
        }
      })
    }

    const loadHeroes = async () => {
      try {
        setHeroLoading(true)
        const heroResult = await fetchTopHeroes(selectedCategory).catch((err) => {
          console.error(err)
          return [] as HeroShowcase[]
        })
        if (!cancelled) {
          setTopHeroes(heroResult)
        }
      } catch (err) {
        console.error('Failed to load heroes:', err)
      } finally {
        if (!cancelled) {
          setHeroLoading(false)
        }
      }
    }

    const loadPlayers = async () => {
      try {
        setPlayerLoading(true)
        const playerResult = await fetchTopPlayers(selectedPlayerCategory).catch((err) => {
          console.error(err)
          return [] as PlayerShowcase[]
        })
        if (!cancelled) {
          setTopPlayers(playerResult)
        }
      } catch (err) {
        console.error('Failed to load players:', err)
      } finally {
        if (!cancelled) {
          setPlayerLoading(false)
        }
      }
    }

    loadHeroes()
    loadPlayers()

    return () => {
      cancelled = true
      controller.abort()
    }
  }, [selectedCategory, selectedPlayerCategory])

  useEffect(() => {
    const fetchBestHeroes = async () => {
      try {
        setBestHeroesLoading(true)
        const response = await fetch('/api/heroes/top-with-players?limit=6')
        if (response.ok) {
          const data = await response.json()
          setBestHeroes(data.heroes || [])
        }
      } catch (error) {
        console.error('Failed to fetch best heroes:', error)
      } finally {
        setBestHeroesLoading(false)
      }
    }

    fetchBestHeroes()
  }, [])

  useEffect(() => {
    const fetchRecentUpdates = async () => {
      try {
        const response = await fetch('/api/recent-updates')
        if (response.ok) {
          const data = await response.json()
          setRecentUpdates(data)
        }
      } catch (error) {
        console.error('Failed to fetch recent updates:', error)
      }
    }
    fetchRecentUpdates()
  }, [])

  useEffect(() => {
    const fetchBattlePass = async () => {
      try {
        const response = await fetch('/api/battlepass/current')
        if (response.ok) {
          const data = await response.json()
          setBattlePassItems(data.items || [])
          setBattlePassSeasonName(data.season_name || `Season ${data.season}`)
        }
      } catch (error) {
        console.error('Failed to fetch battle pass:', error)
      }
    }
    fetchBattlePass()
  }, [])

  useEffect(() => {
    if (!recentUpdates) return
    const updates = [recentUpdates.patchNote, recentUpdates.devDiary, recentUpdates.balance].filter(Boolean)
    if (updates.length === 0) return
    
    const interval = setInterval(() => {
      setCurrentUpdateIndex((prev) => (prev + 1) % updates.length)
    }, 5000)
    
    return () => clearInterval(interval)
  }, [recentUpdates])

  useEffect(() => {
    if (battlePassItems.length === 0) return
    
    const interval = setInterval(() => {
      setCurrentBattlePassIndex((prev) => (prev + 1) % battlePassItems.length)
    }, 3000)
    
    return () => clearInterval(interval)
  }, [battlePassItems])
  
  const formatDisplayValue = (value: string | number, category: string): string => {
    if (value === '-' || value === null || value === undefined) return '-'
    
    if (category === 'playtime') {
      return String(value)
    }
    
    const num = typeof value === 'number' ? value : parseFloat(String(value))
    if (!Number.isFinite(num)) return String(value)
    
    if (category === 'winrate') {
      return `${num.toFixed(1)}%`
    }
    
    if (category === 'damage' || category === 'damage_taken' || category === 'healing') {
      if (num >= 1000000000) return `${(num / 1000000000).toFixed(2)}B`
      if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`
      if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
      return num.toFixed(0)
    }
    
    return num.toLocaleString()
  }

  const formatPlayerDisplayValue = (value: string | number, category: string): string => {
    if (value === '-' || value === null || value === undefined) return '-'
    
    const num = typeof value === 'number' ? value : parseFloat(String(value))
    if (!Number.isFinite(num)) return String(value)
    
    if (category === 'winrate') {
      return `${num.toFixed(1)}%`
    }
    
    if (category === 'score' || category === 'max_rank_score') {
      return num.toLocaleString(undefined, { maximumFractionDigits: 2 })
    }
    
    return num.toLocaleString()
  }

  return (
    <div className="min-h-screen flex flex-col bg-black">
      <Navbar />
      <div className="background"></div>
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative min-h-screen flex flex-col items-center justify-center px-6 lg:px-8 overflow-hidden">
          <div className="max-w-5xl mx-auto flex flex-col items-center justify-center flex-1">
            {/* Logo */}
            <div className="mb-12 flex justify-center">
              <div className="relative w-auto h-48 sm:h-56 md:h-64 lg:h-72 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <Image
                  src={rivalsLogo}
                  alt="Marvel Rivals Logo"
                  height={320}
                  width={960}
                  className="h-full w-auto object-contain"
                  priority
                />
              </div>
            </div>

            <div className="text-center mb-16">
              <p className="text-xl sm:text-2xl md:text-3xl max-w-4xl mx-auto leading-relaxed animate-fade-in-up relative z-10 font-medium" style={{ fontFamily: 'var(--font-fredoka)', animationDelay: '0.2s' }}>
                <span className="text-white">Track </span>
                <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">hero stats</span>
                <span className="text-white">, check </span>
                <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">leaderboards</span>
                <span className="text-white">, analyze </span>
                <span className="bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">player profiles</span>
                <span className="text-white">, and stay ahead with </span>
                <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">fast updates</span>
                <span className="text-white">.</span>
              </p>
              <p className="text-base sm:text-lg text-gray-500 max-w-2xl mx-auto mt-4 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                Your ultimate companion for Marvel Rivals
              </p>
            </div>

            {/* Navigation Buttons */}
            <div className="flex flex-wrap justify-center gap-3 mb-16 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
              <Link
                href="/heroes"
                className="group relative flex flex-col items-center gap-2 px-6 py-3 rounded-xl border bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:border-white/20 hover:text-white transition-all duration-300"
              >
                <div className="transition-transform duration-300 group-hover:scale-105">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <span className="text-xs font-medium whitespace-nowrap">Heroes</span>
              </Link>
              <Link
                href="/leaderboards"
                className="group relative flex flex-col items-center gap-2 px-4 py-3 rounded-xl border bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:border-white/20 hover:text-white transition-all duration-300"
              >
                <div className="transition-transform duration-300 group-hover:scale-105">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <span className="text-xs font-medium whitespace-nowrap">Leaderboards</span>
              </Link>
              <Link
                href="/players"
                className="group relative flex flex-col items-center gap-2 px-6 py-3 rounded-xl border bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:border-white/20 hover:text-white transition-all duration-300"
              >
                <div className="transition-transform duration-300 group-hover:scale-105">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <span className="text-xs font-medium whitespace-nowrap">Players</span>
              </Link>
            </div>

            {/* Animated Down Arrow */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
              <div className="animate-bounce-slow">
                <svg className="w-6 h-12 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3" />
                </svg>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 px-6 lg:px-8 border-t border-white/5">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
              <h2 className="text-2xl sm:text-3xl font-light mb-4 text-white">Hero Showcase</h2>
              <p className="text-gray-500 text-sm max-w-2xl mx-auto">
                Top heroes ranked by performance metrics from the database.
              </p>
            </div>

            <div className="flex justify-center flex-wrap gap-3 mb-10 animate-fade-in-up" style={{ animationDelay: '0.7s' }}>
              {Object.entries(categoryLabels).map(([key, label], idx) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedCategory(key as any)}
                  className={`group relative flex flex-col items-center gap-2 px-4 py-3 rounded-xl border transition-all duration-300 ${
                    selectedCategory === key
                      ? 'bg-white text-black border-white shadow-lg scale-105'
                      : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:border-white/20 hover:text-white'
                  }`}
                  style={{ animationDelay: `${0.8 + idx * 0.1}s` }}
                >
                  <div className={`transition-transform duration-300 ${selectedCategory === key ? 'scale-110' : 'group-hover:scale-105'}`}>
                    {key === 'wins' && (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                    )}
                    {key === 'winrate' && (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    )}
                    {key === 'damage' && (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    )}
                    {key === 'damage_taken' && (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    )}
                    {key === 'healing' && (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    )}
                    {key === 'playtime' && (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>
                  <span className="text-xs font-medium whitespace-nowrap">{label}</span>
                </button>
              ))}
            </div>

            {heroLoading ? (
              <div className="py-20 flex justify-center">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
                  <p className="text-gray-400 mt-4">Loading hero showcase...</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {topHeroes.map((hero, index) => (
                  <div
                    key={`${hero.id}-${selectedCategory}-${index}`}
                    className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-purple-500/10 via-white/5 to-black/80 p-6 transition-all duration-300 transform hover:-translate-y-1 hover:border-white/25"
                    style={{ 
                      animationDelay: `${0.9 + index * 0.15}s`,
                      opacity: 0,
                      transform: 'translateY(30px)',
                      animation: 'fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards'
                    }}
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
                        <p className="text-sm text-gray-300/80">{categoryLabels[selectedCategory]}</p>
                      </div>
                    </div>
                    <div className="mt-6 border border-white/10 rounded-xl bg-black/40 p-4 text-center">
                      <div className="text-gray-500 uppercase tracking-[0.25em] mb-2 text-xs">{categoryLabels[selectedCategory]}</div>
                      <div className="text-3xl font-light text-white">{formatDisplayValue(hero.displayValue, selectedCategory)}</div>
                    </div>
                    {hero.stats && (
                      <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-gray-300">
                        {hero.stats.matches !== undefined && (
                          <div className="rounded-lg bg-black/40 border border-white/10 p-2 text-center">
                            <div className="text-gray-500 uppercase tracking-[0.2em] mb-1 text-[10px]">Matches</div>
                            <div className="text-sm text-white">{formatNumber(hero.stats.matches)}</div>
                          </div>
                        )}
                        {hero.stats.wins !== undefined && (
                          <div className="rounded-lg bg-black/40 border border-white/10 p-2 text-center">
                            <div className="text-gray-500 uppercase tracking-[0.2em] mb-1 text-[10px]">Wins</div>
                            <div className="text-sm text-white">{formatNumber(hero.stats.wins)}</div>
                          </div>
                        )}
                      </div>
                    )}
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
            )}
          </div>
        </section>

        <section className="py-24 px-6 lg:px-8 border-t border-white/5">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12 animate-fade-in-up" style={{ animationDelay: '1.0s' }}>
              <h2 className="text-2xl sm:text-3xl font-light mb-4 text-white">Player Showcase</h2>
              <p className="text-gray-500 text-sm max-w-2xl mx-auto">
                Top players ranked by performance metrics from the global leaderboard.
              </p>
            </div>

            <div className="flex justify-center flex-wrap gap-3 mb-10 animate-fade-in-up" style={{ animationDelay: '1.1s' }}>
              {Object.entries(playerCategoryLabels).map(([key, label], idx) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedPlayerCategory(key as any)}
                  className={`group relative flex flex-col items-center gap-2 px-4 py-3 rounded-xl border transition-all duration-300 ${
                    selectedPlayerCategory === key
                      ? 'bg-white text-black border-white shadow-lg scale-105'
                      : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10 hover:border-white/20 hover:text-white'
                  }`}
                  style={{ animationDelay: `${1.2 + idx * 0.1}s` }}
                >
                  <div className={`transition-transform duration-300 ${selectedPlayerCategory === key ? 'scale-110' : 'group-hover:scale-105'}`}>
                    {key === 'score' && (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    )}
                    {key === 'winrate' && (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    )}
                    {key === 'win_count' && (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                    )}
                    {key === 'max_level' && (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    )}
                    {key === 'battle_count' && (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    {key === 'max_rank_score' && (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                    )}
                  </div>
                  <span className="text-xs font-medium whitespace-nowrap">{label}</span>
                </button>
              ))}
            </div>

            {playerLoading ? (
              <div className="py-20 flex justify-center">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
                  <p className="text-gray-400 mt-4">Loading player showcase...</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {topPlayers.map((player, index) => (
                  <div
                    key={`${player.uid}-${selectedPlayerCategory}-${index}`}
                    className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-blue-500/10 via-white/5 to-black/80 p-6 transition-all duration-300 transform hover:-translate-y-1 hover:border-white/25"
                    style={{ 
                      animationDelay: `${1.3 + index * 0.15}s`,
                      opacity: 0,
                      transform: 'translateY(30px)',
                      animation: 'fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards'
                    }}
                  >
                    <div className="flex items-center justify-between text-xs uppercase tracking-[0.35em] text-gray-400">
                      <span>#{index + 1}</span>
                      <span style={{ color: player.rank_color || undefined }}>{player.rank_label || 'Contender'}</span>
                    </div>
                    <div className="mt-6 flex items-center gap-4">
                      <div className="relative w-16 h-16 rounded-full overflow-hidden border border-white/15 bg-black/40">
                        <SmartImage paths={player.iconPaths} alt={player.name} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-white">{player.name}</h3>
                        <p className="text-sm text-gray-300/80">{playerCategoryLabels[selectedPlayerCategory]}</p>
                      </div>
                    </div>
                    <div className="mt-6 border border-white/10 rounded-xl bg-black/40 p-4 text-center">
                      <div className="text-gray-500 uppercase tracking-[0.25em] mb-2 text-xs">{playerCategoryLabels[selectedPlayerCategory]}</div>
                      <div className="text-3xl font-light text-white">{formatPlayerDisplayValue(player.displayValue, selectedPlayerCategory)}</div>
                    </div>
                    {(player.win_count !== undefined || player.battle_count !== undefined) && (
                      <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-gray-300">
                        {player.battle_count !== undefined && (
                          <div className="rounded-lg bg-black/40 border border-white/10 p-2 text-center">
                            <div className="text-gray-500 uppercase tracking-[0.2em] mb-1 text-[10px]">Battles</div>
                            <div className="text-sm text-white">{formatNumber(player.battle_count)}</div>
                          </div>
                        )}
                        {player.win_count !== undefined && (
                          <div className="rounded-lg bg-black/40 border border-white/10 p-2 text-center">
                            <div className="text-gray-500 uppercase tracking-[0.2em] mb-1 text-[10px]">Wins</div>
                            <div className="text-sm text-white">{formatNumber(player.win_count)}</div>
                          </div>
                        )}
                      </div>
                    )}
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
                    No player data available right now.
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        <section className="py-24 px-6 lg:px-8 border-t border-white/5">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12 animate-fade-in-up" style={{ animationDelay: '1.6s' }}>
              <h2 className="text-2xl sm:text-3xl font-light mb-4 text-white">Best Heroes & Their Champions</h2>
              <p className="text-gray-500 text-sm max-w-2xl mx-auto">
                Ranked by RivalsDB Score (0-100): comprehensive analysis of win rate, KDA, accuracy (hit rate), eliminations per match, and average score. Each hero shown with their top-performing player.
              </p>
            </div>

            {bestHeroesLoading ? (
              <div className="py-20 flex justify-center">
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
                  <p className="text-gray-400 mt-4">Loading best heroes...</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bestHeroes.map((item, index) => (
                  <div
                    key={`${item.hero.id}-${index}`}
                    className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-emerald-500/10 via-white/5 to-black/80 transition-all duration-300 transform hover:-translate-y-1 hover:border-white/25"
                    style={{ 
                      animationDelay: `${1.7 + index * 0.1}s`,
                      opacity: 0,
                      transform: 'translateY(30px)',
                      animation: 'fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards'
                    }}
                  >
                    <div className="p-6">
                      <div className="flex items-center justify-between text-xs uppercase tracking-[0.35em] text-gray-400 mb-6">
                        <span>#{index + 1}</span>
                        <span>{item.hero.role || 'Hero'}</span>
                      </div>
                      
                      <div className="flex items-center gap-4 mb-6">
                        <div className="relative w-20 h-20 rounded-2xl overflow-hidden border border-white/15 bg-black/40">
                          <SmartImage 
                            paths={getAssetCandidates(item.hero.image_url)} 
                            alt={toTitleCase(item.hero.name)} 
                            className="w-full h-full object-cover" 
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-2xl font-semibold text-white mb-1">{toTitleCase(item.hero.name)}</h3>
                          <div className="flex items-center gap-2 text-xs">
                            <div className={`px-3 py-1 rounded-full font-semibold ${
                              typeof item.stats.rivals_db_score === 'number'
                                ? item.stats.rivals_db_score >= 70
                                  ? 'bg-gradient-to-r from-emerald-500/20 to-green-500/20 border border-emerald-500/30 text-emerald-300'
                                  : item.stats.rivals_db_score >= 50
                                  ? 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 text-yellow-300'
                                  : 'bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 text-red-300'
                                : 'bg-gray-500/20 border border-gray-500/30 text-gray-300'
                            }`}>
                              RivalsDB Score: {typeof item.stats.rivals_db_score === 'number' ? item.stats.rivals_db_score.toFixed(0) : '-'}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-4">
                        <div className="rounded-lg bg-black/40 border border-white/10 p-3 text-center">
                          <div className="text-gray-500 uppercase tracking-[0.2em] mb-1 text-[10px]">Win Rate</div>
                          <div className="text-sm font-medium text-white">{formatWinRate(item.stats.win_rate)}</div>
                        </div>
                        <div className="rounded-lg bg-black/40 border border-white/10 p-3 text-center">
                          <div className="text-gray-500 uppercase tracking-[0.2em] mb-1 text-[10px]">KDA</div>
                          <div className="text-sm font-medium text-white">{typeof item.stats.kda === 'number' ? item.stats.kda.toFixed(2) : '-'}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-6">
                        {item.hero.role?.toLowerCase() === 'duelist' ? (
                          <div className="rounded-lg bg-black/40 border border-white/10 p-3 text-center col-span-2">
                            <div className="text-gray-500 uppercase tracking-[0.2em] mb-1 text-[10px]">Total Damage</div>
                            <div className="text-sm font-medium text-white">{formatNumber(item.stats.total_hero_damage)}</div>
                          </div>
                        ) : item.hero.role?.toLowerCase() === 'vanguard' ? (
                          <div className="rounded-lg bg-black/40 border border-white/10 p-3 text-center col-span-2">
                            <div className="text-gray-500 uppercase tracking-[0.2em] mb-1 text-[10px]">Total Damage Taken</div>
                            <div className="text-sm font-medium text-white">{formatNumber(item.stats.total_damage_taken)}</div>
                          </div>
                        ) : item.hero.role?.toLowerCase() === 'strategist' ? (
                          <div className="rounded-lg bg-black/40 border border-white/10 p-3 text-center col-span-2">
                            <div className="text-gray-500 uppercase tracking-[0.2em] mb-1 text-[10px]">Total Healing</div>
                            <div className="text-sm font-medium text-white">{formatNumber(item.stats.total_hero_heal)}</div>
                          </div>
                        ) : (
                          <>
                            <div className="rounded-lg bg-black/40 border border-white/10 p-3 text-center">
                              <div className="text-gray-500 uppercase tracking-[0.2em] mb-1 text-[10px]">Matches</div>
                              <div className="text-sm font-medium text-white">{formatNumber(item.stats.matches)}</div>
                            </div>
                            <div className="rounded-lg bg-black/40 border border-white/10 p-3 text-center">
                              <div className="text-gray-500 uppercase tracking-[0.2em] mb-1 text-[10px]">Wins</div>
                              <div className="text-sm font-medium text-white">{formatNumber(item.stats.wins)}</div>
                            </div>
                          </>
                        )}
                      </div>

                      <div className="border-t border-white/10 pt-4">
                        {item.bestPlayer ? (
                          <div>
                            <div className="text-xs uppercase tracking-[0.25em] text-gray-500 mb-3">Best Player</div>
                            <Link 
                              href={`/players/${item.bestPlayer.uid}`}
                              className="flex items-center gap-3 p-3 rounded-xl bg-black/40 border border-white/10 hover:border-white/20 hover:bg-black/60 transition-all group/player"
                            >
                              <div className="relative w-12 h-12 rounded-full overflow-hidden border border-white/15 bg-black/40">
                                <SmartImage 
                                  paths={getAssetCandidates(item.bestPlayer.icon)} 
                                  alt={toTitleCase(item.bestPlayer.name) || 'Player'} 
                                  className="w-full h-full object-cover" 
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-white font-medium truncate group-hover/player:text-emerald-400 transition-colors">
                                  {toTitleCase(item.bestPlayer.name) || 'Unknown'}
                                </div>
                                <div className="text-xs text-gray-400">
                                  Rank #{item.bestPlayer.rank} • {formatNumber(item.bestPlayer.wins)} wins
                                </div>
                              </div>
                              <svg className="w-4 h-4 text-gray-400 group-hover/player:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </Link>
                          </div>
                        ) : (
                          <div className="text-center text-gray-500 text-sm py-2">
                            No leaderboard data available
                          </div>
                        )}
                      </div>

                      <Link
                        href={`/heroes/${item.hero.id}`}
                        className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-white/80 group-hover:text-white transition-colors"
                      >
                        View hero details
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </Link>
                    </div>
                  </div>
                ))}

                {bestHeroes.length === 0 && (
                  <div className="col-span-full text-center text-gray-400 border border-white/10 bg-white/[0.02] rounded-2xl p-10">
                    No hero data available right now.
                  </div>
                )}
              </div>
            )}

            <div className="mt-12 text-center">
              <Link
                href="/heroes/rankings"
                className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 text-white font-medium hover:from-emerald-500/30 hover:to-cyan-500/30 hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-emerald-500/20"
              >
                <span>View Complete Hero Rankings</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            </div>
          </div>
        </section>

        <section className="py-24 px-6 lg:px-8 border-t border-white/5">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-light mb-4 text-white">Latest Updates</h2>
              <p className="text-gray-500 text-sm max-w-2xl mx-auto">
                Stay up to date with the latest patch notes, developer diaries, and balance changes
              </p>
            </div>

            {recentUpdates ? (
              <div className="relative h-96 rounded-3xl border border-white/10 overflow-hidden">
                {[recentUpdates.patchNote, recentUpdates.devDiary, recentUpdates.balance].filter(Boolean).map((update, index) => {
                  const updateType = update === recentUpdates.patchNote ? 'Patch Note' : update === recentUpdates.devDiary ? 'Dev Diary' : 'Balance Change'
                  const updateColor = update === recentUpdates.patchNote ? 'from-blue-500/20' : update === recentUpdates.devDiary ? 'from-purple-500/20' : 'from-amber-500/20'
                  
                  return (
                    <div
                      key={index}
                      className={`absolute inset-0 transition-opacity duration-1000 ${
                        currentUpdateIndex === index ? 'opacity-100' : 'opacity-0'
                      }`}
                    >
                      <div className={`h-full bg-gradient-to-br ${updateColor} to-black/80 p-8 flex flex-col justify-between`}>
                        <div>
                          <div className="inline-block px-4 py-1 rounded-full bg-white/10 border border-white/20 text-white text-sm font-medium mb-4">
                            {updateType}
                          </div>
                          <h3 className="text-3xl font-bold text-white mb-4">{update.title}</h3>
                          {update.date_label && (
                            <p className="text-gray-300 text-sm mb-4">{update.date_label}</p>
                          )}
                          {update.preview && (
                            <p className="text-gray-300 line-clamp-3">{update.preview}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {[recentUpdates.patchNote, recentUpdates.devDiary, recentUpdates.balance].filter(Boolean).map((_, dotIndex) => (
                            <button
                              key={dotIndex}
                              onClick={() => setCurrentUpdateIndex(dotIndex)}
                              className={`h-2 rounded-full transition-all ${
                                currentUpdateIndex === dotIndex ? 'w-8 bg-white' : 'w-2 bg-white/40'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-20">
                Loading updates...
              </div>
            )}
          </div>
        </section>

        <section className="py-24 px-6 lg:px-8 border-t border-white/5">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-light mb-4 text-white">Current Battle Pass</h2>
              {battlePassSeasonName && (
                <p className="text-white/80 mb-2 text-sm uppercase tracking-[0.3em]">
                  {battlePassSeasonName}
                </p>
              )}
              <p className="text-gray-500 text-sm max-w-2xl mx-auto">
                Explore the rewards available in the current season
              </p>
            </div>

            {battlePassItems.length > 0 ? (
              <div className="relative">
                <div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02]">
                  <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${currentBattlePassIndex * 100}%)` }}>
                    {battlePassItems.map((item, index) => {
                      const imageCandidates = getAssetCandidates(item.image)
                      
                      return (
                        <div
                          key={index}
                          className="min-w-full px-8 py-12 flex flex-col items-center justify-center"
                        >
                          <div className="w-full max-w-md">
                            <div className="aspect-square rounded-2xl bg-gradient-to-br from-white/5 to-black/80 border border-white/10 p-8 flex items-center justify-center mb-6">
                              {imageCandidates.length > 0 ? (
                                <SmartImage
                                  paths={imageCandidates}
                                  alt={item.name || 'Battle Pass Item'}
                                  className="max-w-full max-h-full object-contain"
                                />
                              ) : (
                                <div className="text-6xl">🎁</div>
                              )}
                            </div>
                            <div className="text-center">
                              <h3 className="text-2xl font-bold text-white mb-2">{item.name || 'Unknown Item'}</h3>
                              {item.cost && (
                                <div className="inline-block px-4 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-sm font-medium">
                                  Cost: {item.cost}
                                </div>
                              )}
                              {item.isLuxury && (
                                <div className="inline-block ml-2 px-4 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300 text-sm font-medium">
                                  Luxury
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
                <div className="flex justify-center gap-2 mt-6">
                  {battlePassItems.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentBattlePassIndex(index)}
                      className={`h-2 rounded-full transition-all ${
                        currentBattlePassIndex === index ? 'w-8 bg-white' : 'w-2 bg-white/40'
                      }`}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-400 py-20">
                Loading battle pass...
              </div>
            )}
          </div>
        </section>
    </main>

      <Footer />
    </div>
  )
} 