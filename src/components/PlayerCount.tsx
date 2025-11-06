'use client'

import { useEffect, useState } from 'react'

export default function PlayerCount() {
  const [playerCount, setPlayerCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPlayerCount = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/player-count')
      const data = await response.json()
      
      if (data.playerCount !== null && data.playerCount !== undefined) {
        setPlayerCount(data.playerCount)
      } else {
        setError('Unable to fetch player count')
      }
    } catch (err) {
      setError('Failed to load player count')
      console.error('Error fetching player count:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPlayerCount()
    const interval = setInterval(fetchPlayerCount, 60000)
    
    return () => clearInterval(interval)
  }, [])

  if (loading && playerCount === null) {
    return (
      <div className="inline-flex items-center gap-2.5">
        <div className="relative">
          <div className="w-2.5 h-2.5 rounded-full bg-gray-400/60 animate-pulse"></div>
          <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-gray-400/30 animate-ping"></div>
        </div>
        <span className="text-sm text-gray-400">Loading players...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="inline-flex items-center gap-2.5 text-gray-400">
        <span className="text-sm">{error}</span>
      </div>
    )
  }

  return (
    <div className="inline-flex items-center gap-2.5">
      <div className="relative">
        <div className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse"></div>
        <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-green-400/40 animate-ping"></div>
      </div>
      <span className="text-sm font-medium">
        <span className="text-white font-semibold">{playerCount?.toLocaleString()}</span>
        <span className="text-gray-300 ml-1.5">players online</span>
      </span>
    </div>
  )
}

