'use client'

import { useState, useEffect, useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

interface Ability {
  ability_name: string
  cooldown: number
  description: string
}

interface Hero {
  id: string
  name: string
  alias: string
  role: string
  type?: string
  abilities: Ability[]
  imageUrl: string
}

interface ApiResponse {
  status: string
  heroes: Hero[]
}

export default function HeroesPage() {
  const [heroes, setHeroes] = useState<Hero[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedType, setSelectedType] = useState<string | null>(null)

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
    const fetchHeroes = async () => {
      try {
        setLoading(true)
        const response = await fetch('https://marvelrivalsapi.com/api/v1/heroes', {
          headers: {
            'x-api-key': '188d3cd06e7db493dbd00811774d009528e8516c560a6b3e2751c2e411c40f9f'
          }
        })

        if (!response.ok) {
          const errorText = await response.text()
          throw new Error(`API Error: ${response.status} - ${errorText}`)
        }

        const data = await response.json()
        console.log('API Response:', data) // Debug log
        
        // Handle different possible response formats
        if (data.heroes && Array.isArray(data.heroes)) {
          setHeroes(data.heroes)
        } else if (Array.isArray(data)) {
          // If the API directly returns an array
          setHeroes(data)
        } else if (data.data && Array.isArray(data.data)) {
          // Some APIs wrap in a data property
          setHeroes(data.data)
        } else {
          console.error('Unexpected response format:', data)
          throw new Error(`Invalid response format. Received: ${JSON.stringify(data).substring(0, 200)}`)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch heroes')
        console.error('Error fetching heroes:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchHeroes()
  }, [])

  const [searchedHeroes, setSearchedHeroes] = useState<Hero[]>([])
  const [isSearching, setIsSearching] = useState(false)

  // Helper function for fuzzy matching
  const normalizeString = (str: string): string => {
    return str.toLowerCase().replace(/^(the|a|an)\s+/i, '').trim()
  }

  const fuzzyMatch = (hero: Hero, query: string): boolean => {
    if (!query.trim()) return false
    
    const normalizedQuery = normalizeString(query)
    const heroName = normalizeString(hero.name || '')
    const heroAlias = normalizeString(hero.alias || '')
    const heroRealName = normalizeString((hero as any).real_name || '')
    
    // Exact matches (after normalization)
    if (heroName === normalizedQuery || heroAlias === normalizedQuery || heroRealName === normalizedQuery) {
      return true
    }
    
    // Contains matches
    if (heroName.includes(normalizedQuery) || heroAlias.includes(normalizedQuery) || heroRealName.includes(normalizedQuery)) {
      return true
    }
    
    // Partial word matches (for "Punisher" matching "The Punisher")
    const queryWords = normalizedQuery.split(/\s+/)
    const allHeroText = `${heroName} ${heroAlias} ${heroRealName}`
    
    return queryWords.every(word => word.length > 2 && allHeroText.includes(word))
  }

  // Search API call with client-side fallback
  useEffect(() => {
    const searchHeroes = async () => {
      if (!searchQuery.trim()) {
        setSearchedHeroes([])
        return
      }

      try {
        setIsSearching(true)
        
        // Try API first
        const response = await fetch(
          `https://marvelrivalsapi.com/api/v1/heroes/hero/${encodeURIComponent(searchQuery)}`,
          {
            headers: {
              'x-api-key': '188d3cd06e7db493dbd00811774d009528e8516c560a6b3e2751c2e411c40f9f'
            }
          }
        )

        let results: Hero[] = []
        
        if (response.ok) {
          const data = await response.json()
          console.log('Search API Response:', data)
          
          // Handle different response formats
          if (Array.isArray(data)) {
            results = data
          } else if (data.hero && Array.isArray(data.hero)) {
            results = data.hero
          } else if (data.heroes && Array.isArray(data.heroes)) {
            results = data.heroes
          } else if (data.hero && !Array.isArray(data.hero)) {
            results = [data.hero]
          } else if (data.data) {
            if (Array.isArray(data.data)) {
              results = data.data
            } else {
              results = [data.data]
            }
          } else if (data.id || data.name) {
            results = [data]
          }
        }
        
        // If API returned no results, do client-side fuzzy search
        if (results.length === 0 && heroes.length > 0) {
          console.log('API returned no results, doing client-side fuzzy search')
          results = heroes.filter(hero => fuzzyMatch(hero, searchQuery))
        }
        
        console.log('Final search results:', results.length, results)
        setSearchedHeroes(results)
      } catch (err) {
        console.error('Error searching heroes:', err)
        // On error, fall back to client-side search
        if (heroes.length > 0) {
          const results = heroes.filter(hero => fuzzyMatch(hero, searchQuery))
          setSearchedHeroes(results)
        } else {
          setSearchedHeroes([])
        }
      } finally {
        setIsSearching(false)
      }
    }

    const debounceTimer = setTimeout(() => {
      searchHeroes()
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [searchQuery, heroes])

  const filteredHeroes = useMemo(() => {
    // Use search results if searching, otherwise use all heroes
    const heroesToFilter = searchQuery.trim() ? searchedHeroes : heroes
    
    // If no type filter, return all heroes
    if (!selectedType) {
      return heroesToFilter
    }
    
    return heroesToFilter.filter(hero => {
      // Safe property access with null checks
      const heroRole = (hero.role || '').toLowerCase()
      const heroType = (hero.type || '').toLowerCase()
      const filterType = selectedType.toLowerCase()
      
      const matchesType = heroType === filterType || heroRole === filterType
      
      return matchesType
    })
  }, [heroes, searchedHeroes, searchQuery, selectedType])

  const getRoleColor = (role: string) => {
    switch (role.toUpperCase()) {
      case 'DPS':
        return 'text-red-400 border-red-400/30 bg-red-400/10'
      case 'TANK':
        return 'text-blue-400 border-blue-400/30 bg-blue-400/10'
      case 'SUPPORT':
        return 'text-green-400 border-green-400/30 bg-green-400/10'
      default:
        return 'text-gray-400 border-gray-400/30 bg-gray-400/10'
    }
  }


  return (
    <div className="min-h-screen flex flex-col bg-black">
      <Navbar />
      <div className="background"></div>

      <main className="flex-1 pt-32 pb-24">
        <section className="px-6 lg:px-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-light mb-4 tracking-tight text-center">
              <span className="bubble-text red-glint" data-text="Heroes">Heroes</span>
            </h1>
            <p className="text-gray-400 text-center max-w-2xl mx-auto mb-8">
              Explore all available heroes in Marvel Rivals
            </p>

            {/* Search Bar */}
            <div className="max-w-xl mx-auto mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-white/10 to-white/5 rounded-2xl blur-xl opacity-50"></div>
                <div className="relative bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-2xl">
                  <div className="flex items-center px-6 py-4">
                    <svg className="w-5 h-5 text-gray-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search heroes by name, alias, or role..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1 bg-transparent text-white placeholder-gray-500 text-sm focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Type Filter */}
            <div className="flex flex-wrap justify-center gap-3 mb-8">
              <button
                onClick={() => setSelectedType(null)}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  selectedType === null
                    ? 'bg-white text-black'
                    : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white'
                }`}
              >
                All Heroes
              </button>
              <button
                onClick={() => setSelectedType('vanguard')}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  selectedType === 'vanguard'
                    ? 'bg-white text-black'
                    : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white'
                }`}
              >
                Vanguard
              </button>
              <button
                onClick={() => setSelectedType('duelist')}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  selectedType === 'duelist'
                    ? 'bg-white text-black'
                    : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white'
                }`}
              >
                Duelist
              </button>
              <button
                onClick={() => setSelectedType('strategist')}
                className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  selectedType === 'strategist'
                    ? 'bg-white text-black'
                    : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white'
                }`}
              >
                Strategist
              </button>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
              <p className="text-gray-400 mt-4">Loading heroes...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-20">
              <p className="text-red-400 mb-4">Error: {error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {/* Heroes Grid */}
          {!loading && !error && (
            <>
              <div className="mb-6 text-sm text-gray-400 text-center">
                {isSearching ? (
                  <span>Searching...</span>
                ) : searchQuery.trim() ? (
                  <span>Found {filteredHeroes.length} {filteredHeroes.length === 1 ? 'hero' : 'heroes'}</span>
                ) : (
                  <span>Showing {filteredHeroes.length} of {heroes.length} heroes</span>
                )}
              </div>
              
              {/* Container */}
              <div className="border border-white/10 rounded-xl p-6 bg-black/30">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {filteredHeroes.map((hero, index) => {
                    const imageUrl = hero.imageUrl
                      ? (hero.imageUrl.startsWith('http')
                          ? hero.imageUrl
                          : `https://marvelrivalsapi.com${hero.imageUrl}`)
                      : null

                    return (
                      <Link
                        key={hero.id}
                        href={`/heroes/${hero.id}`}
                        className="group relative block animate-hero-card focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                        style={{
                          animationDelay: `${index * 0.05}s`,
                          animationFillMode: 'both'
                        }}
                        prefetch={true}
                      >
                        <div className="relative w-full aspect-square min-h-[280px] overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] transition-all duration-300 group-hover:border-white/30 group-hover:bg-white/[0.08]">
                          {imageUrl ? (
                            <Image
                              src={imageUrl}
                              alt={toTitleCase(hero.name)}
                              fill
                              className="object-contain transition-transform duration-500 group-hover:scale-105"
                              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 33vw, 25vw"
                              loading="lazy"
                              unoptimized
                              quality={85}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                              }}
                            />
                          ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-center gap-3 p-6 text-white/80">
                              <div className="text-6xl">🦸</div>
                              <h3 className="text-lg font-medium text-white">{toTitleCase(hero.name)}</h3>
                              {hero.alias && (
                                <p className="text-sm text-gray-400">{toTitleCase(hero.alias)}</p>
                              )}
                            </div>
                          )}

                          <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/85 via-black/25 to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-95"></div>

                          <div className="absolute inset-x-0 bottom-0 p-6 pt-12">
                            <div className="flex items-end justify-between gap-4">
                              <div>
                                {hero.alias && (
                                  <p className="text-xs uppercase tracking-[0.35em] text-gray-400 mb-2">
                                    {toTitleCase(hero.alias)}
                                  </p>
                                )}
                                <h3 className="text-xl font-semibold text-white">
                                  {toTitleCase(hero.name)}
                                </h3>
                                {hero.type && (
                                  <p className="text-sm text-gray-300/70 mt-1">{toTitleCase(hero.type)}</p>
                                )}
                              </div>
                              <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getRoleColor(hero.role)}`}>
                                {toTitleCase(hero.role)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>

                {filteredHeroes.length === 0 && (
                  <div className="text-center py-20">
                    <p className="text-gray-400">No heroes found matching your filters</p>
                  </div>
                )}
              </div>
            </>
          )}
        </section>
      </main>

      <Footer />
    </div>
  )
}

