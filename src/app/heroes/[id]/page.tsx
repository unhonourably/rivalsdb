'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

interface Ability {
  id?: number
  name?: string
  ability_name?: string // For backwards compatibility
  type?: string
  icon?: string
  isCollab?: boolean
  cooldown?: number | string
  description?: string
  additional_fields?: {
    Key?: string
    Cooldown?: string
    [key: string]: string | undefined
  }
  transformation_id?: string
}

interface Costume {
  id?: string
  name?: string
  icon?: string
  imageUrl?: string
  quality?: string
  rarity?: string
  description?: string
  appearance?: string
}

interface HeroStats {
  [key: string]: any
}

interface LeaderboardEntry {
  rank?: number
  player_uid?: number
  info?: {
    name?: string
    icon?: any
    rank_season?: {
      rank_score?: string
      level?: number
      win_count?: number
      [key: string]: any
    }
    [key: string]: any
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
  [key: string]: any
}

interface Hero {
  id: string
  name: string
  alias?: string
  real_name?: string
  role: string
  type?: string
  abilities: Ability[]
  imageUrl: string
  bio?: string
  lore?: string
  difficulty?: string
  attack_type?: string
  team?: string[]
  transformations?: any[]
}


export default function HeroDetailPage() {
  const params = useParams()
  const router = useRouter()
  const heroId = params.id as string

  const [hero, setHero] = useState<Hero | null>(null)
  const [stats, setStats] = useState<HeroStats | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [costumes, setCostumes] = useState<Costume[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingStats, setLoadingStats] = useState(true)
  const [loadingCostumes, setLoadingCostumes] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'stats' | 'leaderboard' | 'costumes'>('overview')
  const [platform, setPlatform] = useState<'pc' | 'ps' | 'xbox'>('pc')
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false)
  const [expandedAbilities, setExpandedAbilities] = useState<Set<number>>(new Set())
  const [expandedTeamUps, setExpandedTeamUps] = useState<Set<number>>(new Set())
  const [expandedTransformations, setExpandedTransformations] = useState<Set<number>>(new Set())
  const [leaderboardPage, setLeaderboardPage] = useState(1)
  const LEADERBOARD_PAGE_SIZE = 25

  // Helper function to capitalize first letter of each word (title case)
  const toTitleCase = (str: string): string => {
    if (!str) return ''
    return str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  useEffect(() => {
    const fetchHeroData = async () => {
      if (!heroId) return
      
      try {
        setLoading(true)
        setLoadingStats(true)
        setLoadingCostumes(true)
        
        const heroResponse = await fetch(`/api/heroes/${heroId}`, {
          cache: 'no-store'
        })
        
        if (!heroResponse.ok) {
          throw new Error(`Failed to fetch hero: ${heroResponse.status}`)
        }

        const heroData = await heroResponse.json()
        const heroObj = {
          ...heroData,
          imageUrl: heroData.image_url ?? heroData.imageUrl,
          abilities: (heroData.abilities ?? []).map((ability: any) => ({
            ...ability,
            name: ability.ability_name ?? ability.name,
            isCollab: ability.is_collab ?? ability.isCollab,
            additional_fields: ability.additional_fields ?? {}
          }))
        }
        setHero(heroObj)
        setLoading(false)

        const statsPromise = fetch(`/api/heroes/${heroId}/stats`, {
          cache: 'no-store'
        }).then(async (statsResponse) => {
          if (statsResponse.ok) {
            const statsData = await statsResponse.json()
            setStats(statsData)
          }
          setLoadingStats(false)
        }).catch(() => {
          setLoadingStats(false)
        })

        const costumesPromise = fetch(`/api/heroes/${heroId}/costumes`, {
          cache: 'no-store'
        }).then(async (costumesResponse) => {
          if (costumesResponse.ok) {
            const costumesData = await costumesResponse.json()
            const costumesList = Array.isArray(costumesData) ? costumesData : []
            setCostumes(costumesList.map((costume: any) => ({
              ...costume,
              imageUrl: costume.image_url ?? costume.imageUrl ?? costume.icon
            })))
          }
          setLoadingCostumes(false)
        }).catch(() => {
          setLoadingCostumes(false)
        })

        await Promise.allSettled([statsPromise, costumesPromise])

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load hero data')
        setLoading(false)
        setLoadingStats(false)
        setLoadingCostumes(false)
      }
    }

    fetchHeroData()
  }, [heroId])

  useEffect(() => {
    const fetchLeaderboard = async () => {
      if (!heroId) return
      
      if (activeTab !== 'leaderboard') {
        return
      }

      setLoadingLeaderboard(true)
      setLeaderboard([])
      setLeaderboardPage(1)
      
      try {
        const leaderboardResponse = await fetch(
          `/api/heroes/${heroId}/leaderboard?platform=${platform}`,
          {
            cache: 'no-store'
          }
        )
        
        if (leaderboardResponse.ok) {
          const leaderboardData = await leaderboardResponse.json()
          const entries = Array.isArray(leaderboardData?.players) ? leaderboardData.players : []
          
          setLeaderboard(entries.map((entry: any) => ({
            rank: entry.rank ?? 0,
            player_uid: entry.player_uid,
            info: {
              name: entry.player_name,
              icon: { player_icon: entry.player_icon },
              rank_season: {
                rank_score: entry.rank_score,
                level: entry.rank_level
              }
            },
            wins: entry.wins,
            matches: entry.matches,
            kills: entry.kills,
            deaths: entry.deaths,
            assists: entry.assists,
            play_time: entry.play_time,
            total_hero_damage: entry.total_hero_damage,
            total_damage_taken: entry.total_damage_taken,
            total_hero_heal: entry.total_hero_heal,
            mvps: entry.mvps,
            svps: entry.svps
          })))
        } else {
          setLeaderboard([])
        }
      } catch (err) {
        setLeaderboard([])
      } finally {
        setLoadingLeaderboard(false)
      }
    }

    fetchLeaderboard()
  }, [heroId, platform, activeTab])

  const getRoleColor = (role: string) => {
    switch (role?.toUpperCase()) {
      case 'DPS':
      case 'DUELIST':
        return 'text-red-400 border-red-400/30 bg-red-400/10'
      case 'TANK':
      case 'VANGUARD':
        return 'text-blue-400 border-blue-400/30 bg-blue-400/10'
      case 'SUPPORT':
      case 'STRATEGIST':
        return 'text-green-400 border-green-400/30 bg-green-400/10'
      default:
        return 'text-gray-400 border-gray-400/30 bg-gray-400/10'
    }
  }

  const calculateRivalsDbScore = (stats: HeroStats | null): number => {
    if (!stats) return 0
    
    let totalScore = 0
    
    const winRate = Number(stats.win_rate) || 0
    totalScore += (winRate / 100) * 40
    
    const kda = Number(stats.kda) || 0
    const normalizedKda = Math.min(kda / 6, 1)
    totalScore += normalizedKda * 25
    
    const sessionHitRate = Number(stats.session_hit_rate) || 0
    totalScore += (sessionHitRate / 100) * 15
    
    const kills = Number(stats.kills) || 0
    const assists = Number(stats.assists) || 0
    const matches = Number(stats.matches) || 1
    const eliminationsPerMatch = (kills + assists) / matches
    const normalizedElims = Math.min(eliminationsPerMatch / 20, 1)
    totalScore += normalizedElims * 15
    
    const avgScore = Number(stats.average_score) || 0
    const normalizedAvgScore = Math.min(avgScore / 10000, 1)
    totalScore += normalizedAvgScore * 5
    
    return totalScore
  }

  const rivalsDbScore = calculateRivalsDbScore(stats)

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-black">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
            <p className="text-gray-400 mt-4">Loading hero data...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  if (error || !hero) {
    return (
      <div className="min-h-screen flex flex-col bg-black">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-400 mb-4">{error || 'Hero not found'}</p>
            <Link href="/heroes" className="px-6 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors">
              Back to Heroes
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  const imageUrl = hero.imageUrl 
    ? (hero.imageUrl.startsWith('http') 
        ? hero.imageUrl 
        : `https://marvelrivalsapi.com${hero.imageUrl}`)
    : null

  return (
    <div className="min-h-screen flex flex-col bg-black">
      <Navbar />
      <div className="background"></div>

      <main className="flex-1 pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          {/* Back Button */}
          <Link 
            href="/heroes" 
            className="inline-flex items-center text-gray-400 hover:text-white mb-8 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Heroes
          </Link>

          {/* Hero Header */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Hero Image */}
            <div className="relative aspect-square max-w-lg mx-auto lg:mx-0">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={toTitleCase(hero.name)}
                  fill
                  className="object-contain"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              ) : (
                <div className="w-full h-full border border-white/10 bg-white/[0.02] rounded-xl flex items-center justify-center">
                  <div className="text-6xl">🦸</div>
                </div>
              )}
            </div>

            {/* Hero Info */}
            <div className="flex flex-col justify-center">
              <h1 className="text-5xl sm:text-6xl font-light mb-4">
                <span className="bubble-text red-glint" data-text={toTitleCase(hero.name)}>{toTitleCase(hero.name)}</span>
              </h1>
              
              {hero.real_name && (
                <p className="text-xl text-gray-400 mb-4">Real Name: {toTitleCase(hero.real_name)}</p>
              )}
              
              {hero.alias && hero.alias !== hero.name && (
                <p className="text-lg text-gray-400 mb-4">Alias: {toTitleCase(hero.alias)}</p>
              )}

              <div className="flex flex-wrap gap-3 mb-6">
                <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border ${getRoleColor(hero.role)}`}>
                  {hero.role}
                </div>
                {hero.type && (
                  <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border border-white/10 bg-white/5">
                    {hero.type}
                  </div>
                )}
                {hero.difficulty && (
                  <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border border-white/10 bg-white/5">
                    Difficulty: {hero.difficulty}
                  </div>
                )}
              </div>

              {!loadingStats && stats && (
                <div className="mb-6 p-4 rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs uppercase tracking-[0.25em] text-gray-400 mb-1">RivalsDB Score</div>
                      <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                        {rivalsDbScore.toFixed(0)}<span className="text-xl text-gray-500">/100</span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-400 text-right">
                      <div>Based on comprehensive</div>
                      <div>performance analysis</div>
                    </div>
                  </div>
                </div>
              )}

              {hero.bio && (
                <div className="mb-6">
                  <h2 className="text-xl font-medium mb-2 text-white">Bio</h2>
                  <p className="text-gray-400 leading-relaxed">{hero.bio}</p>
                </div>
              )}

              {hero.lore && (
                <div>
                  <h2 className="text-xl font-medium mb-2 text-white">Lore</h2>
                  <p className="text-gray-400 leading-relaxed whitespace-pre-line">{hero.lore}</p>
                </div>
              )}
            </div>
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
                onClick={() => setActiveTab('stats')}
                className={`pb-4 px-2 text-sm font-medium transition-colors whitespace-nowrap border-b-2 ${
                  activeTab === 'stats'
                    ? 'border-white text-white'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                Stats
              </button>
              <button
                onClick={() => setActiveTab('leaderboard')}
                className={`pb-4 px-2 text-sm font-medium transition-colors whitespace-nowrap border-b-2 ${
                  activeTab === 'leaderboard'
                    ? 'border-white text-white'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                Leaderboard
              </button>
              <button
                onClick={() => setActiveTab('costumes')}
                className={`pb-4 px-2 text-sm font-medium transition-colors whitespace-nowrap border-b-2 ${
                  activeTab === 'costumes'
                    ? 'border-white text-white'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                Costumes ({costumes.length})
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="animate-fade-in-up">
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {(() => {
                  // Function to format text with Buff/Debuff/Orange tags and clean weird formatting
                  const formatDescription = (text: string) => {
                    if (!text) return ''
                    
                    // Remove weird codes like {000003}{105100}
                    text = text.replace(/\{[0-9]+\}/g, '')
                    
                    // Fix common text issues
                    text = text
                      .replace(/ming\s/g, 'becoming ')
                      .replace(/\bd\s/g, 'and ')
                      .replace(/\s+\./g, '.')
                      .replace(/\.+/g, '.')
                      .replace(/\s+/g, ' ')
                      .replace(/,\s*([A-Z][a-z]+)\s*([A-Z][a-z]+)/g, ', $1 $2') // Fix comma-separated names
                      .trim()
                    
                    // Parse tags and create React elements
                    const parts: JSX.Element[] = []
                    // Match <Buff>, <Debuff>, or <Orange> tags with various closing formats
                    const tagRegex = /<(Buff|Debuff|Orange)>(.*?)<\/(?:Buff|Debuff|Orange)?>/g
                    let lastIndex = 0
                    let match
                    
                    while ((match = tagRegex.exec(text)) !== null) {
                      // Add text before the tag
                      if (match.index > lastIndex) {
                        const beforeText = text.substring(lastIndex, match.index)
                        parts.push(<span key={`text-${lastIndex}`}>{beforeText}</span>)
                      }
                      
                      // Add the styled tag content
                      const tagType = match[1]
                      const tagContent = match[2]
                      let colorClass = ''
                      if (tagType === 'Buff') {
                        colorClass = 'text-green-400 bg-green-400/10 border-green-400/30'
                      } else if (tagType === 'Debuff') {
                        colorClass = 'text-red-400 bg-red-400/10 border-red-400/30'
                      } else if (tagType === 'Orange') {
                        colorClass = 'text-orange-400 bg-orange-400/10 border-orange-400/30'
                      }
                      
                      parts.push(
                        <span
                          key={`tag-${match.index}`}
                          className={`inline-flex items-center px-2 py-0.5 mx-1 rounded border text-xs font-medium ${colorClass}`}
                        >
                          {tagContent}
                        </span>
                      )
                      
                      lastIndex = tagRegex.lastIndex
                    }
                    
                    // Add remaining text
                    if (lastIndex < text.length) {
                      parts.push(<span key={`text-${lastIndex}`}>{text.substring(lastIndex)}</span>)
                    }
                    
                    return parts.length > 0 ? parts : <span>{text}</span>
                  }

                  // Separate team ups from regular abilities
                  const teamUpKeywords = ['team', 'teamup', 'team up', 'combo', 'synergy', 'wolverine', 'black panther', 'panther']
                  const heroNames = ['wolverine', 'hulk', 'black panther', 'panther', 'spider-man', 'iron man', 'doctor strange', 'magik', 'storm', 'peni', 'namor', 'mantis', 'rocket', 'groot', 'venom', 'punisher', 'spider-woman', 'cloak', 'dagger', 'adam warlock', 'loki', 'squirrel girl', 'groot', 'rocket raccoon']
                  const regularAbilities: any[] = []
                  const teamUps: any[] = []
                  const seenAbilityNames = new Set<string>() // Track seen ability names to prevent duplicates

                  // Helper function to normalize and create a signature for duplicate detection
                  const normalizeForComparison = (str: string): string => {
                    return str
                      .toLowerCase()
                      .replace(/\{[0-9]+\}/g, '') // Remove codes
                      .replace(/\s+/g, ' ') // Normalize whitespace
                      .trim()
                  }

                  // Helper function to get ability name (supports both name and ability_name)
                  const getAbilityName = (ability: any): string => {
                    return ability.name || ability.ability_name || ''
                  }

                  // Helper function to check if two abilities are duplicates
                  const areDuplicates = (a1: any, a2: any): boolean => {
                    // First check: if both have IDs and they match, definitely duplicates
                    if (a1.id && a2.id && a1.id === a2.id) {
                      return true
                    }
                    
                    const name1 = normalizeForComparison(getAbilityName(a1))
                    const name2 = normalizeForComparison(getAbilityName(a2))
                    
                    // If names match exactly (after normalization), they're duplicates
                    // This is the primary check - same name = same ability
                    if (name1 === name2 && name1.length > 0) {
                      return true
                    }
                    
                    // If names are very similar (one is substring of other), likely duplicates
                    // This handles cases like "Heavy Blow" vs "Heavy Blow " (with trailing space)
                    if (name1.length > 2 && name2.length > 2) {
                      const shorter = name1.length <= name2.length ? name1 : name2
                      const longer = name1.length > name2.length ? name1 : name2
                      // If shorter is 90%+ of longer and matches, likely duplicate
                      if (shorter.length >= longer.length * 0.9 && longer.includes(shorter)) {
                        return true
                      }
                    }
                    
                    // Also check if names are very similar (handles minor variations)
                    if (name1.length > 3 && name2.length > 3) {
                      // Check if one name contains the other (for slight variations)
                      if (name1.includes(name2) || name2.includes(name1)) {
                        // Names are similar, check descriptions too
                        const desc1 = normalizeForComparison(a1.description || '')
                        const desc2 = normalizeForComparison(a2.description || '')
                        
                        // If descriptions are similar or both mention same hero, likely duplicate
                        if (desc1.length > 10 && desc2.length > 10) {
                          // Check if descriptions have significant overlap
                          const shorterDesc = desc1.length < desc2.length ? desc1 : desc2
                          const longerDesc = desc1.length >= desc2.length ? desc1 : desc2
                          
                          // If longer description contains significant portion of shorter, likely duplicate
                          if (longerDesc.includes(shorterDesc.substring(0, Math.min(60, shorterDesc.length)))) {
                            return true
                          }
                        } else {
                          // If names are very similar and descriptions are short/missing, still likely duplicate
                          return true
                        }
                      }
                    }
                    
                    // Check descriptions if names don't match
                    const desc1 = normalizeForComparison(a1.description || '')
                    const desc2 = normalizeForComparison(a2.description || '')
                    
                    // If both descriptions are similar and mention same heroes, consider duplicate
                    if (desc1.length > 30 && desc2.length > 30) {
                      const shorterDesc = desc1.length < desc2.length ? desc1 : desc2
                      const longerDesc = desc1.length >= desc2.length ? desc1 : desc2
                      
                      // More aggressive matching - if 70% of shorter is in longer, consider duplicate
                      const matchLength = Math.floor(shorterDesc.length * 0.7)
                      if (longerDesc.includes(shorterDesc.substring(0, matchLength))) {
                        // Also check if they mention same hero names
                        const heroesIn1 = heroNames.filter(h => desc1.includes(h))
                        const heroesIn2 = heroNames.filter(h => desc2.includes(h))
                        if (heroesIn1.length > 0 && heroesIn1.some(h => heroesIn2.includes(h))) {
                          return true
                        }
                      }
                    }
                    
                    return false
                  }

                  hero.abilities?.forEach((ability) => {
                    // Primary check: isCollab field from API
                    const isTeamUp = ability.isCollab === true
                    
                    // Secondary checks (fallback for older data or if isCollab is missing):
                    if (!isTeamUp) {
                      const name = getAbilityName(ability).toLowerCase()
                      const desc = (ability.description || '').toLowerCase()
                      
                      // Check if it's a team up by:
                      // 1. Keywords in name or description
                      // 2. Team up codes in description
                      // 3. Multiple hero names mentioned (indicates team up)
                      const hasTeamUpKeyword = teamUpKeywords.some(keyword => 
                        name.includes(keyword) || desc.includes(keyword)
                      )
                      const hasTeamUpCodes = /\{[0-9]+\}/.test(ability.description || '')
                      const mentionedHeroes = heroNames.filter(heroName => 
                        desc.includes(heroName) || name.includes(heroName)
                      )
                      const secondaryTeamUpCheck = hasTeamUpKeyword || hasTeamUpCodes || mentionedHeroes.length >= 2 || 
                        desc.includes(' with ') || desc.includes(' and ') && mentionedHeroes.length >= 1
                      
                      if (secondaryTeamUpCheck) {
                        // This is a team up based on content analysis
                        const abilityName = normalizeForComparison(getAbilityName(ability))
                        const isDuplicateByName = abilityName.length > 0 && seenAbilityNames.has(abilityName)
                        const isDuplicateByContent = teamUps.some(existingTeamUp => 
                          areDuplicates(ability, existingTeamUp)
                        )
                        
                        if (!isDuplicateByName && !isDuplicateByContent) {
                          seenAbilityNames.add(abilityName)
                          teamUps.push(ability)
                        }
                      } else {
                        // Check for duplicates in regular abilities
                        const abilityName = normalizeForComparison(getAbilityName(ability))
                        const isDuplicateByName = abilityName.length > 0 && seenAbilityNames.has(abilityName)
                        const isDuplicateByContent = regularAbilities.some(existingAbility => 
                          areDuplicates(ability, existingAbility)
                        )
                        
                        if (!isDuplicateByName && !isDuplicateByContent) {
                          seenAbilityNames.add(abilityName)
                          regularAbilities.push(ability)
                        }
                      }
                    } else {
                      // isCollab is true, definitely a team up
                      const abilityName = normalizeForComparison(getAbilityName(ability))
                      const isDuplicateByName = abilityName.length > 0 && seenAbilityNames.has(abilityName)
                      const isDuplicateByContent = teamUps.some(existingTeamUp => 
                        areDuplicates(ability, existingTeamUp)
                      )
                      
                      if (!isDuplicateByName && !isDuplicateByContent) {
                        seenAbilityNames.add(abilityName)
                        teamUps.push(ability)
                      }
                    }
                  })

                  return (
                    <>
                      {/* Regular Abilities */}
                      {regularAbilities.length > 0 && (
                        <div>
                          <h2 className="text-2xl font-light mb-4 text-white">Abilities</h2>
                          <div className="space-y-2">
                            {regularAbilities.map((ability, idx) => {
                              const isExpanded = expandedAbilities.has(idx)
                              
                              return (
                                <div 
                                  key={idx} 
                                  className="border border-white/5 bg-white/[0.01] rounded-lg overflow-hidden hover:border-white/10 transition-colors"
                                >
                                  <button
                                    onClick={() => {
                                      const newExpanded = new Set(expandedAbilities)
                                      if (isExpanded) {
                                        newExpanded.delete(idx)
                                      } else {
                                        newExpanded.add(idx)
                                      }
                                      setExpandedAbilities(newExpanded)
                                    }}
                                    className="w-full px-4 py-3 flex items-center justify-between text-left"
                                  >
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                      <h3 className="text-base font-medium text-white truncate">
                                        {getAbilityName(ability) || `Ability ${idx + 1}`}
                                      </h3>
                                      {(ability.cooldown || ability.additional_fields?.Cooldown) && (
                                        <span className="text-xs text-gray-500 whitespace-nowrap">
                                          {ability.additional_fields?.Cooldown || `${ability.cooldown}s`}
                                        </span>
                                      )}
                                    </div>
                                    <svg
                                      className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </button>
                                  {isExpanded && (
                                    <div className="px-4 pb-4 pt-0 border-t border-white/5">
                                      {ability.description && (
                                        <div className="text-gray-300 text-sm leading-relaxed pt-3 mb-4">
                                          {formatDescription(ability.description)}
                                        </div>
                                      )}
                                      {ability.additional_fields && Object.keys(ability.additional_fields).length > 0 && (
                                        <div className="pt-3 space-y-2">
                                          <div className="text-xs text-gray-400 uppercase tracking-wider mb-3">Details</div>
                                          {Object.entries(ability.additional_fields).map(([key, value]) => (
                                            <div key={key} className="flex justify-between items-start py-1 border-b border-white/5">
                                              <span className="text-gray-400 text-sm font-medium">{key}:</span>
                                              <span className="text-gray-300 text-sm text-right ml-4">{value ? String(value) : '-'}</span>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Team Ups */}
                      {teamUps.length > 0 && (
                        <div>
                          <h2 className="text-2xl font-light mb-4 text-white">Team Ups</h2>
                          <div className="space-y-2">
                            {teamUps.map((ability, idx) => {
                              const isExpanded = expandedTeamUps.has(idx)
                              
                              return (
                                <div 
                                  key={idx} 
                                  className="border border-amber-500/20 bg-amber-500/[0.02] rounded-lg overflow-hidden hover:border-amber-500/30 transition-colors"
                                >
                                  <button
                                    onClick={() => {
                                      const newExpanded = new Set(expandedTeamUps)
                                      if (isExpanded) {
                                        newExpanded.delete(idx)
                                      } else {
                                        newExpanded.add(idx)
                                      }
                                      setExpandedTeamUps(newExpanded)
                                    }}
                                    className="w-full px-4 py-3 flex items-center justify-between text-left"
                                  >
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                      <h3 className="text-base font-medium text-white truncate">
                                        {getAbilityName(ability) || `Team Up ${idx + 1}`}
                                      </h3>
                                      {(ability.cooldown || ability.additional_fields?.Cooldown) && (
                                        <span className="text-xs text-gray-500 whitespace-nowrap">
                                          {ability.additional_fields?.Cooldown || `${ability.cooldown}s`}
                                        </span>
                                      )}
                                      <span className="text-xs text-amber-400 px-2 py-0.5 rounded border border-amber-400/30 bg-amber-400/10">
                                        Team Up
                                      </span>
                                    </div>
                                    <svg
                                      className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </button>
                                  {isExpanded && (
                                    <div className="px-4 pb-4 pt-0 border-t border-white/5">
                                      {ability.description && (
                                        <div className="text-gray-300 text-sm leading-relaxed pt-3 mb-4">
                                          {formatDescription(ability.description)}
                                        </div>
                                      )}
                                      {ability.additional_fields && Object.keys(ability.additional_fields).length > 0 && (
                                        <div className="pt-3 space-y-2">
                                          <div className="text-xs text-gray-400 uppercase tracking-wider mb-3">Details</div>
                                          {Object.entries(ability.additional_fields).map(([key, value]) => (
                                            <div key={key} className="flex justify-between items-start py-1 border-b border-white/5">
                                              <span className="text-gray-400 text-sm font-medium">{key}:</span>
                                              <span className="text-gray-300 text-sm text-right ml-4">{value ? String(value) : '-'}</span>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  )
                })()}

                {/* Transformations */}
                {hero.transformations && hero.transformations.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-light mb-4 text-white">Transformations</h2>
                    <div className="space-y-2">
                      {hero.transformations.map((transformation: any, idx: number) => {
                        const isExpanded = expandedTransformations.has(idx)
                        
                        // Function to format text with Buff/Debuff/Orange tags
                        const formatDescription = (text: string) => {
                          if (!text) return ''
                          
                          // Remove weird codes
                          text = text.replace(/\{[0-9]+\}/g, '')
                          
                          // Fix common text issues
                          text = text
                            .replace(/ming\s/g, 'becoming ')
                            .replace(/\bd\s/g, 'and ')
                            .replace(/\s+\./g, '.')
                            .replace(/\.+/g, '.')
                            .replace(/\s+/g, ' ')
                            .trim()
                          
                          // Parse tags and create React elements
                          const parts: JSX.Element[] = []
                          // Match <Buff>, <Debuff>, or <Orange> tags
                          const tagRegex = /<(Buff|Debuff|Orange)>(.*?)<\/(?:Buff|Debuff|Orange)?>/g
                          let lastIndex = 0
                          let match
                          
                          while ((match = tagRegex.exec(text)) !== null) {
                            // Add text before the tag
                            if (match.index > lastIndex) {
                              const beforeText = text.substring(lastIndex, match.index)
                              parts.push(<span key={`text-${lastIndex}`}>{beforeText}</span>)
                            }
                            
                            // Add the styled tag content
                            const tagType = match[1]
                            const tagContent = match[2]
                            let colorClass = ''
                            if (tagType === 'Buff') {
                              colorClass = 'text-green-400 bg-green-400/10 border-green-400/30'
                            } else if (tagType === 'Debuff') {
                              colorClass = 'text-red-400 bg-red-400/10 border-red-400/30'
                            } else if (tagType === 'Orange') {
                              colorClass = 'text-orange-400 bg-orange-400/10 border-orange-400/30'
                            }
                            
                            parts.push(
                              <span
                                key={`tag-${match.index}`}
                                className={`inline-flex items-center px-2 py-0.5 mx-1 rounded border text-xs font-medium ${colorClass}`}
                              >
                                {tagContent}
                              </span>
                            )
                            
                            lastIndex = tagRegex.lastIndex
                          }
                          
                          // Add remaining text
                          if (lastIndex < text.length) {
                            parts.push(<span key={`text-${lastIndex}`}>{text.substring(lastIndex)}</span>)
                          }
                          
                          return parts.length > 0 ? parts : <span>{text}</span>
                        }
                        
                        return (
                          <div 
                            key={idx} 
                            className="border border-white/5 bg-white/[0.01] rounded-lg overflow-hidden hover:border-white/10 transition-colors"
                          >
                            <button
                              onClick={() => {
                                const newExpanded = new Set(expandedTransformations)
                                if (isExpanded) {
                                  newExpanded.delete(idx)
                                } else {
                                  newExpanded.add(idx)
                                }
                                setExpandedTransformations(newExpanded)
                              }}
                              className="w-full px-4 py-3 flex items-center justify-between text-left"
                            >
                              <h3 className="text-base font-medium text-white">
                                {transformation.name || `Transformation ${idx + 1}`}
                              </h3>
                              <svg
                                className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </button>
                            {isExpanded && (
                              <div className="px-4 pb-4 pt-0 border-t border-white/5">
                                {transformation.description && (
                                  <div className="text-gray-300 text-sm leading-relaxed pt-3 mb-4">
                                    {formatDescription(transformation.description)}
                                  </div>
                                )}
                                {(transformation.health || transformation.movement_speed || transformation.icon) && (
                                  <div className="pt-3 space-y-2">
                                    <div className="text-xs text-gray-400 uppercase tracking-wider mb-3">Stats</div>
                                    {transformation.health && (
                                      <div className="flex justify-between items-start py-1 border-b border-white/5">
                                        <span className="text-gray-400 text-sm font-medium">Health:</span>
                                        <span className="text-gray-300 text-sm text-right ml-4">{transformation.health}</span>
                                      </div>
                                    )}
                                    {transformation.movement_speed && (
                                      <div className="flex justify-between items-start py-1 border-b border-white/5">
                                        <span className="text-gray-400 text-sm font-medium">Movement Speed:</span>
                                        <span className="text-gray-300 text-sm text-right ml-4">{transformation.movement_speed}</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Team */}
                {hero.team && hero.team.length > 0 && (
                  <div>
                    <h2 className="text-2xl font-light mb-4 text-white">Team</h2>
                    <div className="flex flex-wrap gap-2">
                      {hero.team.map((team, idx) => (
                        <span key={idx} className="px-4 py-2 border border-white/10 bg-white/5 rounded-lg text-sm hover:bg-white/10 transition-colors">
                          {team}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'stats' && (
              <div>
                <h2 className="text-2xl font-light mb-8 text-white">Statistics</h2>
                {loadingStats ? (
                  <div className="border border-white/10 bg-white/[0.02] rounded-xl p-12 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                    <p className="text-gray-400 mt-4">Loading statistics...</p>
                  </div>
                ) : stats ? (
                  <div className="space-y-8">
                    {/* Organize stats into logical groups */}
                    {(() => {
                      // Group stats by category
                      const matchStats: Array<[string, any]> = []
                      const performanceStats: Array<[string, any]> = []
                      const combatStats: Array<[string, any]> = []
                      const otherStats: Array<[string, any]> = []

                      Object.entries(stats).forEach(([key, value]) => {
                        // Skip hero metadata
                        if (key === 'hero_id' || key === 'hero_name' || key === 'hero_icon') {
                          return
                        }

                        // Categorize stats
                        if (['matches', 'wins', 'losses', 'win_rate'].includes(key.toLowerCase())) {
                          matchStats.push([key, value])
                        } else if (['k', 'd', 'a', 'kills', 'deaths', 'assists', 'kd', 'kda', 'k/d', 'k/a'].includes(key.toLowerCase())) {
                          combatStats.push([key, value])
                        } else if (['total_hero_damage', 'total_damage_taken', 'total_hero_heal', 'damage_dealt', 'damage_taken', 'healing_done'].includes(key.toLowerCase())) {
                          combatStats.push([key, value])
                        } else if (['play_time', 'mvps', 'svps', 'session_hit_rate', 'solo_kill', 'average_score'].includes(key.toLowerCase())) {
                          performanceStats.push([key, value])
                        } else {
                          otherStats.push([key, value])
                        }
                      })

                      const formatKey = (k: string) => {
                        const keyMap: { [key: string]: string } = {
                          'k': 'Kills Per Match',
                          'd': 'Deaths Per Match',
                          'a': 'Assists Per Match',
                          'kd': 'K/D Ratio',
                          'kda': 'KDA',
                          'win_rate': 'Win Rate',
                          'play_time': 'Play Time',
                          'total_hero_damage': 'Total Damage',
                          'total_damage_taken': 'Damage Taken',
                          'total_hero_heal': 'Total Healing',
                          'session_hit_rate': 'Hit Rate',
                          'solo_kill': 'Solo Kills Per Match',
                          'average_score': 'Average Score'
                        }
                        
                        if (keyMap[k]) return keyMap[k]
                        
                        return k
                          .replace(/_/g, ' ')
                          .replace(/\b\w/g, l => l.toUpperCase())
                      }

                      const formatValue = (val: any, key?: string): string => {
                        if (val === null || val === undefined) return '-'
                        
                        let numValue: number | null = null
                        if (typeof val === 'number') {
                          numValue = val
                        } else if (typeof val === 'string') {
                          if (/^\d+\.?\d*$/.test(val.trim())) {
                            numValue = parseFloat(val)
                          } else if (val.includes('h') || val.includes('m') || val.includes('s')) {
                            return val
                          } else {
                            return val
                          }
                        }
                        
                        if (numValue === null) return String(val)
                        
                        const absVal = Math.abs(numValue)
                        const isDamageField = key && ['total_hero_damage', 'total_damage_taken', 'total_hero_heal'].includes(key.toLowerCase())
                        
                        if (isDamageField) {
                          if (absVal >= 1000000000) {
                            return `${(numValue / 1000000000).toFixed(2)}B`
                          }
                          if (absVal >= 1000000) {
                            return `${(numValue / 1000000).toFixed(2)}M`
                          }
                          if (absVal >= 1000) {
                            return `${(numValue / 1000).toFixed(1)}K`
                          }
                          return numValue.toFixed(0)
                        }
                        
                        if (numValue > 0 && numValue < 1 && numValue !== Math.floor(numValue)) {
                          const percentage = numValue * 100
                          if (percentage < 0.1) {
                            return `${percentage.toFixed(2)}%`
                          }
                          return `${percentage.toFixed(1)}%`
                        }
                        
                        if (absVal >= 1000000000) {
                          return `${(numValue / 1000000000).toFixed(2)}B`
                        }
                        if (absVal >= 1000000) {
                          return `${(numValue / 1000000).toFixed(2)}M`
                        }
                        if (absVal >= 1000) {
                          return numValue.toLocaleString(undefined, { maximumFractionDigits: 0 })
                        }
                        
                        if (numValue !== Math.floor(numValue)) {
                          if (absVal < 0.01) {
                            return numValue.toFixed(4)
                          }
                          return numValue.toFixed(2)
                        }
                        return numValue.toString()
                      }

                      return (
                        <>
                          {/* Match Stats */}
                          {matchStats.length > 0 && (
                            <div className="border border-white/10 bg-white/[0.02] rounded-2xl p-8">
                              <h3 className="text-xl font-medium mb-8 text-white pb-4 border-b border-white/10">Match Overview</h3>
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {matchStats.map(([key, value]) => (
                                  <div key={key} className="text-center p-6 border border-white/10 rounded-xl bg-black/20 hover:border-white/20 hover:bg-black/30 transition-all">
                                    <div className="text-4xl sm:text-5xl font-light mb-3 text-white leading-none">
                                      {formatValue(value, key)}
                                    </div>
                                    <div className="text-xs text-gray-400 font-normal uppercase tracking-wider">
                                      {formatKey(key)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Combat Stats */}
                          {combatStats.length > 0 && (
                            <div className="border border-white/10 bg-white/[0.02] rounded-2xl p-8">
                              <h3 className="text-xl font-medium mb-8 text-white pb-4 border-b border-white/10">Combat Performance</h3>
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {combatStats.map(([key, value]) => (
                                  <div key={key} className="text-center p-6 border border-white/10 rounded-xl bg-black/20 hover:border-white/20 hover:bg-black/30 transition-all">
                                    <div className="text-4xl sm:text-5xl font-light mb-3 text-white leading-none">
                                      {formatValue(value, key)}
                                    </div>
                                    <div className="text-xs text-gray-400 font-normal uppercase tracking-wider">
                                      {formatKey(key)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Performance Stats */}
                          {performanceStats.length > 0 && (
                            <div className="border border-white/10 bg-white/[0.02] rounded-2xl p-8">
                              <h3 className="text-xl font-medium mb-8 text-white pb-4 border-b border-white/10">Performance Metrics</h3>
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {performanceStats.map(([key, value]) => (
                                  <div key={key} className="text-center p-6 border border-white/10 rounded-xl bg-black/20 hover:border-white/20 hover:bg-black/30 transition-all">
                                    <div className="text-4xl sm:text-5xl font-light mb-3 text-white leading-none">
                                      {formatValue(value, key)}
                                    </div>
                                    <div className="text-xs text-gray-400 font-normal uppercase tracking-wider">
                                      {formatKey(key)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Other Stats */}
                          {otherStats.length > 0 && (
                            <div className="border border-white/10 bg-white/[0.02] rounded-2xl p-8">
                              <h3 className="text-xl font-medium mb-8 text-white pb-4 border-b border-white/10">Additional Statistics</h3>
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                {otherStats.map(([key, value]) => (
                                  <div key={key} className="text-center p-6 border border-white/10 rounded-xl bg-black/20 hover:border-white/20 hover:bg-black/30 transition-all">
                                    <div className="text-4xl sm:text-5xl font-light mb-3 text-white leading-none">
                                      {formatValue(value, key)}
                                    </div>
                                    <div className="text-xs text-gray-400 font-normal uppercase tracking-wider">
                                      {formatKey(key)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )
                    })()}
                  </div>
                ) : (
                  <p className="text-gray-400">No statistics available for this hero.</p>
                )}
              </div>
            )}

            {activeTab === 'leaderboard' && (
              <div>
                <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                  <h2 className="text-2xl font-light text-white">Leaderboard</h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        console.log('Setting platform to PC')
                        setPlatform('pc')
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        platform === 'pc'
                          ? 'bg-white text-black'
                          : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      PC
                    </button>
                    <button
                      onClick={() => {
                        console.log('Setting platform to PS')
                        setPlatform('ps')
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        platform === 'ps'
                          ? 'bg-white text-black'
                          : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      PlayStation
                    </button>
                    <button
                      onClick={() => {
                        console.log('Setting platform to Xbox')
                        setPlatform('xbox')
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        platform === 'xbox'
                          ? 'bg-white text-black'
                          : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      Xbox
                    </button>
                  </div>
                </div>
                {loadingLeaderboard ? (
                  <div className="border border-white/10 bg-white/[0.02] rounded-xl p-12 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                    <p className="text-gray-400 mt-4">Loading leaderboard...</p>
                  </div>
                ) : leaderboard.length > 0 ? (
                  <div>
                    <div className="border border-white/10 bg-white/[0.02] rounded-xl overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="border-b border-white/10">
                            <tr>
                              <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Rank</th>
                              <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Player</th>
                              <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">Rank Score</th>
                              <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">Wins</th>
                              <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">K/D</th>
                              <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">MVPs</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(() => {
                              const startIndex = (leaderboardPage - 1) * LEADERBOARD_PAGE_SIZE
                              const endIndex = startIndex + LEADERBOARD_PAGE_SIZE
                              const paginatedLeaderboard = leaderboard.slice(startIndex, endIndex)
                              
                              return paginatedLeaderboard.map((entry, idx) => {
                                const actualIndex = startIndex + idx
                                const playerName = entry.info?.name || 'Unknown'
                                const rankScore = entry.info?.rank_season?.rank_score || '-'
                                const wins = entry.wins || 0
                                const kills = entry.kills || 0
                                const deaths = entry.deaths || 0
                                const kd = deaths > 0 ? (kills / deaths).toFixed(2) : kills > 0 ? kills.toFixed(2) : '0.00'
                                const mvps = entry.mvps || 0
                                const playerUid = entry.player_uid ?? entry.info?.player_uid ?? (entry as any)?.player?.uid
                                const playerHref = playerUid ? `/players/${playerUid}` : null
                                const rawIcon = (entry.info?.icon?.player_icon as string | undefined) || undefined
                                let resolvedIconSrc: string | null = null
                                if (rawIcon) {
                                  if (rawIcon.startsWith('http')) {
                                    resolvedIconSrc = rawIcon
                                  } else if (rawIcon.startsWith('/rivals/')) {
                                    resolvedIconSrc = `https://marvelrivalsapi.com${rawIcon}`
                                  } else if (rawIcon.startsWith('/players/')) {
                                    resolvedIconSrc = `https://marvelrivalsapi.com/rivals${rawIcon}`
                                  } else {
                                    resolvedIconSrc = `https://marvelrivalsapi.com${rawIcon}`
                                  }
                                }
                                
                                return (
                                  <tr key={entry.player_uid || actualIndex} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                                    <td className="px-6 py-4 text-sm text-gray-400">#{entry.rank || actualIndex + 1}</td>
                                    <td className="px-6 py-4 text-sm text-white">
                                      <div className="flex items-center gap-3">
                                        {resolvedIconSrc ? (
                                          <div className="relative w-10 h-10 rounded-full overflow-hidden border border-white/10">
                                            <img
                                              src={resolvedIconSrc}
                                              alt={playerName}
                                              className="w-full h-full object-cover"
                                              loading="lazy"
                                              onError={(event) => {
                                                const target = event.target as HTMLImageElement
                                                if (rawIcon && rawIcon.startsWith('/rivals/')) {
                                                  const fallback = `https://marvelrivalsapi.com${rawIcon.replace('/rivals', '')}`
                                                  if (target.src !== fallback) {
                                                    target.src = fallback
                                                    return
                                                  }
                                                }
                                                if (rawIcon && rawIcon.startsWith('/players/')) {
                                                  const directFallback = `https://marvelrivalsapi.com${rawIcon}`
                                                  if (target.src !== directFallback) {
                                                    target.src = directFallback
                                                    return
                                                  }
                                                }
                                                if (rawIcon && !rawIcon.startsWith('http')) {
                                                  const fallback = `https://marvelrivalsapi.com${rawIcon}`
                                                  if (target.src !== fallback) {
                                                    target.src = fallback
                                                    return
                                                  }
                                                }
                                                target.style.display = 'none'
                                              }}
                                            />
                                          </div>
                                        ) : null}
                                        {playerHref ? (
                                          <Link
                                            href={playerHref}
                                            prefetch={true}
                                            className="text-white hover:text-red-400 transition-colors"
                                          >
                                            {playerName}
                                          </Link>
                                        ) : (
                                          <span>{playerName}</span>
                                        )}
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-400 text-right">{rankScore}</td>
                                    <td className="px-6 py-4 text-sm text-gray-400 text-right">{wins}</td>
                                    <td className="px-6 py-4 text-sm text-gray-400 text-right">{kd}</td>
                                    <td className="px-6 py-4 text-sm text-gray-400 text-right">{mvps}</td>
                                  </tr>
                                )
                              })
                            })()}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    
                    {/* Pagination Controls */}
                    {(() => {
                      const totalPages = Math.ceil(leaderboard.length / LEADERBOARD_PAGE_SIZE)
                      const startIndex = (leaderboardPage - 1) * LEADERBOARD_PAGE_SIZE
                      const endIndex = Math.min(startIndex + LEADERBOARD_PAGE_SIZE, leaderboard.length)
                      
                      if (totalPages <= 1) return null
                      
                      return (
                        <div className="mt-6 flex items-center justify-between">
                          <div className="text-sm text-gray-400">
                            Showing {startIndex + 1}-{endIndex} of {leaderboard.length} players
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setLeaderboardPage(prev => Math.max(1, prev - 1))}
                              disabled={leaderboardPage === 1}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                leaderboardPage === 1
                                  ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                                  : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                              }`}
                            >
                              Previous
                            </button>
                            <div className="flex items-center gap-1">
                              {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
                                let pageNum: number
                                if (totalPages <= 10) {
                                  pageNum = i + 1
                                } else if (leaderboardPage <= 5) {
                                  pageNum = i + 1
                                } else if (leaderboardPage >= totalPages - 4) {
                                  pageNum = totalPages - 9 + i
                                } else {
                                  pageNum = leaderboardPage - 5 + i
                                }
                                
                                return (
                                  <button
                                    key={pageNum}
                                    onClick={() => setLeaderboardPage(pageNum)}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                      leaderboardPage === pageNum
                                        ? 'bg-white text-black'
                                        : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'
                                    }`}
                                  >
                                    {pageNum}
                                  </button>
                                )
                              })}
                            </div>
                            <button
                              onClick={() => setLeaderboardPage(prev => Math.min(totalPages, prev + 1))}
                              disabled={leaderboardPage === totalPages}
                              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                leaderboardPage === totalPages
                                  ? 'bg-white/5 text-gray-500 cursor-not-allowed'
                                  : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                              }`}
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      )
                    })()}
                  </div>
                ) : (
                  <div className="border border-white/10 bg-white/[0.02] rounded-xl p-12 text-center">
                    <p className="text-gray-400">No leaderboard data available for this hero on {platform.toUpperCase()}.</p>
                    <p className="text-gray-500 text-xs mt-2">Current platform: {platform}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'costumes' && (
              <div>
                <h2 className="text-2xl font-light mb-6 text-white">Costumes</h2>
                {loadingCostumes ? (
                  <div className="border border-white/10 bg-white/[0.02] rounded-xl p-12 text-center">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
                    <p className="text-gray-400 mt-4">Loading costumes...</p>
                  </div>
                ) : costumes.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                    {costumes.map((costume, idx) => {
                      // Use the image URL directly from the v2 API response
                      // The API should return the correct image URLs, don't construct them
                      const costumeImageUrl = costume.icon || costume.imageUrl || null
                      
                      console.log(`Using costume image URL from API response: ${costumeImageUrl}`, costume)
                      
                      // Create fallback URLs only for different extensions (not API versions)
                      // Since we're getting URLs from v2 API, trust those URLs and only try extensions
                      const getFallbackUrls = (url: string | null): string[] => {
                        if (!url) return []
                        const urls: string[] = []
                        
                        // Only try different file extensions, not different API paths
                        // Try .webp if current is not .webp
                        if (!url.includes('.webp')) {
                          urls.push(url.replace(/\.(png|jpg|jpeg)$/i, '.webp'))
                        }
                        // Try .png if current is not .png
                        if (!url.includes('.png')) {
                          urls.push(url.replace(/\.(webp|jpg|jpeg)$/i, '.png'))
                        }
                        // Try .jpg if current is not .jpg
                        if (!url.includes('.jpg') && !url.includes('.jpeg')) {
                          urls.push(url.replace(/\.(png|webp)$/i, '.jpg'))
                        }
                        
                        return urls
                      }
                      
                      const fallbackUrls = getFallbackUrls(costumeImageUrl)

                      // Map quality/rarity to color classes
                      const getQualityColor = (quality?: string) => {
                        const q = (quality || '').toUpperCase()
                        if (q === 'ORANGE' || q === 'LEGENDARY') return 'border-orange-500/50 bg-orange-500/10 text-orange-400'
                        if (q === 'PURPLE' || q === 'EPIC') return 'border-purple-500/50 bg-purple-500/10 text-purple-400'
                        if (q === 'BLUE' || q === 'RARE') return 'border-blue-500/50 bg-blue-500/10 text-blue-400'
                        if (q === 'GREEN' || q === 'UNCOMMON') return 'border-green-500/50 bg-green-500/10 text-green-400'
                        return 'border-gray-500/50 bg-gray-500/10 text-gray-400'
                      }

                      // Log the image URL being attempted
                      if (costumeImageUrl) {
                        console.log(`Attempting to load costume image: ${costumeImageUrl}`, costume)
                      }

                      return (
                        <div key={costume.id || idx} className="border border-white/10 bg-white/[0.02] rounded-xl overflow-hidden">
                          <div className="relative aspect-square bg-gradient-to-br from-black/40 to-black/60">
                            {costumeImageUrl ? (
                              <>
                                <img
                                  src={costumeImageUrl}
                                  alt={costume.name || `Costume ${idx + 1}`}
                                  className="w-full h-full object-contain"
                                  loading="lazy"
                                  data-fallback-index="0"
                                  data-fallback-urls={JSON.stringify(fallbackUrls)}
                                  data-original-url={costumeImageUrl || ''}
                                  onLoad={() => {
                                    console.log(`Successfully loaded costume image: ${costumeImageUrl}`)
                                  }}
                                  onError={(e) => {
                                    const img = e.currentTarget
                                    const fallbackIndex = parseInt(img.getAttribute('data-fallback-index') || '0')
                                    const fallbackUrlsStr = img.getAttribute('data-fallback-urls')
                                    const fallbackUrls = fallbackUrlsStr ? JSON.parse(fallbackUrlsStr) : []
                                    
                                    console.log(`Image failed to load: ${img.src}, trying fallback ${fallbackIndex + 1} of ${fallbackUrls.length}`, fallbackUrls)
                                    
                                    // Try fallback URLs if original fails
                                    if (fallbackIndex < fallbackUrls.length) {
                                      const nextUrl = fallbackUrls[fallbackIndex]
                                      if (nextUrl && img.src !== nextUrl) {
                                        console.log(`Trying fallback URL: ${nextUrl}`)
                                        img.src = nextUrl
                                        img.setAttribute('data-fallback-index', String(fallbackIndex + 1))
                                        return
                                      }
                                    }
                                    
                                    // If all fallbacks failed, show placeholder
                                    console.log(`All image attempts failed for costume:`, costume.name, costumeImageUrl)
                                    img.style.display = 'none'
                                    const placeholder = img.parentElement?.querySelector('.costume-placeholder')
                                    if (placeholder) {
                                      (placeholder as HTMLElement).style.display = 'flex'
                                    }
                                  }}
                                />
                                <div className="costume-placeholder absolute inset-0 bg-gradient-to-br from-black/40 to-black/60 flex flex-col items-center justify-center text-center px-4" style={{ display: 'none' }}>
                                  <div className="text-4xl mb-2">👕</div>
                                  <div className="text-xs text-gray-300 font-medium">{costume.name}</div>
                                  {costume.quality && (
                                    <div className={`mt-2 px-2 py-0.5 rounded border text-xs font-medium ${getQualityColor(costume.quality)}`}>
                                      {costume.quality}
                                    </div>
                                  )}
                                </div>
                              </>
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-black/40 to-black/60 flex flex-col items-center justify-center text-center px-4">
                                <div className="text-4xl mb-2">👕</div>
                                <div className="text-xs text-gray-300 font-medium">{costume.name}</div>
                                {costume.quality && (
                                  <div className={`mt-2 px-2 py-0.5 rounded border text-xs font-medium ${getQualityColor(costume.quality)}`}>
                                    {costume.quality}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="p-4">
                            <h3 className="text-sm font-medium text-white mb-2">
                              {costume.name || `Costume ${idx + 1}`}
                            </h3>
                            {(costume.quality || costume.rarity) && (
                              <div className={`inline-block px-2 py-1 rounded border text-xs font-medium mb-2 ${getQualityColor(costume.quality || costume.rarity)}`}>
                                {costume.quality || costume.rarity}
                              </div>
                            )}
                            {costume.description && costume.description !== '0' && (
                              <p className="text-xs text-gray-400 mt-2 line-clamp-2">{costume.description}</p>
                            )}
                            {costume.appearance && costume.appearance !== '0' && (
                              <p className="text-xs text-gray-500 mt-2 italic">{costume.appearance}</p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-gray-400">No costumes available for this hero.</p>
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

