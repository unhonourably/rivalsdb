'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

const API_DOMAIN = 'https://marvelrivalsapi.com'

interface GameVersionEntry {
  id: string
  versionLabel: string
  releaseLabel?: string
  patchNotesUrl?: string
}

export default function GameVersionsPage() {
  const [entries, setEntries] = useState<GameVersionEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async (signal?: AbortSignal) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/game-versions', {
        cache: 'no-store',
        signal
      })
      if (!response.ok) {
        throw new Error(`Failed to load game versions (${response.status})`)
      }
      const data = await response.json()
      const versions = Array.isArray(data?.gameVersions) ? data.gameVersions : []
      setEntries(
        versions.map((entry: any) => ({
          id: entry.id ?? `version-${entry.version_label}`,
          versionLabel: entry.version_label ?? 'Version',
          releaseLabel: entry.release_label,
          patchNotesUrl: undefined
        }))
      )
    } catch (err) {
      if (signal?.aborted) return
      setError(err instanceof Error ? err.message : 'Failed to load game versions')
    } finally {
      if (!signal?.aborted) {
        setLoading(false)
      }
    }
  }

  useEffect(() => {
    const controller = new AbortController()
    fetchData(controller.signal)
    return () => {
      controller.abort()
    }
  }, [])

  const handleReload = () => {
    fetchData()
  }

  return (
    <div className="min-h-screen flex flex-col bg-black">
      <Navbar />
      <div className="background"></div>

      <main className="flex-1 pt-32 pb-24">
        <div className="max-w-5xl mx-auto px-6 lg:px-8">
          <div className="flex flex-wrap items-start justify-between gap-6 mb-12">
            <div>
              <h1 className="text-4xl md:text-5xl font-light text-white mb-3">Game Versions</h1>
              <p className="text-gray-400 max-w-3xl">Browse the release history and jump directly to patch notes for each Marvel Rivals version.</p>
            </div>
            <button
              type="button"
              onClick={handleReload}
              className="px-4 py-2 rounded-lg border border-white/15 bg-white/5 text-sm text-white hover:bg-white/10 transition-colors"
              disabled={loading}
            >
              {loading ? 'Reloading…' : 'Reload'}
            </button>
          </div>

          {loading && (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
              <p className="text-gray-400 mt-4">Fetching version history...</p>
            </div>
          )}

          {error && !loading && (
            <div className="border border-red-500/30 bg-red-500/10 rounded-2xl p-6 text-center text-red-300">{error}</div>
          )}

          {!loading && !error && (
            <div className="space-y-4">
              {entries.map(entry => (
                <div key={entry.id} className="border border-white/10 bg-white/[0.02] rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:border-white/20 transition-all">
                  <div>
                    <div className="text-xs uppercase tracking-[0.3em] text-gray-500">Game Version</div>
                    <h2 className="text-2xl font-semibold text-white mt-2">{entry.versionLabel}</h2>
                    {entry.releaseLabel && <p className="text-sm text-gray-400 mt-1">Released {entry.releaseLabel}</p>}
                  </div>
                </div>
              ))}

              {entries.length === 0 && (
                <div className="text-center text-gray-400 py-20 border border-white/10 bg-white/[0.02] rounded-2xl">
                  No version history available.
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}

