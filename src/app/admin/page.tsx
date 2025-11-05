'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

function LeaderboardPlayersPanel() {
  const [players, setPlayers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [pushing, setPushing] = useState<Record<string, boolean>>({})
  const [privatePlayers, setPrivatePlayers] = useState<Set<string>>(new Set())
  const [success, setSuccess] = useState<Record<string, boolean>>({})
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10
  
  const isPrivate = (uid: string) => privatePlayers.has(uid)
  
  const totalPages = Math.ceil(players.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentPlayers = players.slice(startIndex, endIndex)

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/admin/leaderboard-players')
        if (!response.ok) throw new Error('Failed to fetch players')
        const data = await response.json()
        setPlayers(data.players || [])
      } catch (error) {
        console.error('Error fetching leaderboard players:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchPlayers()
  }, [])

  const handlePushToDb = async (uid: string) => {
    setPushing(prev => ({ ...prev, [uid]: true }))
    setSuccess(prev => ({ ...prev, [uid]: false }))
    
    try {
      const response = await fetch('/api/admin/push-player-to-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid })
      })
      
      const data = await response.json()
      
      if (data.isPrivate) {
        setPrivatePlayers(prev => {
          const next = new Set(prev)
          next.add(uid)
          return next
        })
      } else if (data.success) {
        setSuccess(prev => ({ ...prev, [uid]: true }))
        setPrivatePlayers(prev => {
          const next = new Set(prev)
          next.delete(uid)
          return next
        })
      }
    } catch (error) {
      console.error('Error pushing player to DB:', error)
    } finally {
      setPushing(prev => ({ ...prev, [uid]: false }))
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-4xl font-light text-white mb-4">Leaderboard Players</h1>
        <div className="text-gray-400">Loading players...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-medium text-white mb-2">Leaderboard Players</h1>
        <p className="text-gray-400">
          Push leaderboard players to the players cache database. Players marked as private will show a red icon.
        </p>
      </div>
      <div className="border border-white/10 bg-gradient-to-br from-white/[0.03] to-white/[0.01] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/[0.05] border-b border-white/10">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Rank</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Player</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Rank Score</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Win Rate</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {currentPlayers.map((player) => (
                <tr key={player.uid} className="hover:bg-white/[0.02]">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    #{player.rank_position}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      {player.player_icon && (
                        <img
                          src={player.player_icon.startsWith('http') ? player.player_icon : `https://marvelrivalsapi.com${player.player_icon.startsWith('/') ? player.player_icon : '/' + player.player_icon}`}
                          alt={player.name}
                          className="w-10 h-10 rounded-full"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                          }}
                        />
                      )}
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{player.name}</span>
                        {isPrivate(player.uid) && (
                          <span className="text-red-500" title="Private Profile">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                          </span>
                        )}
                        {success[player.uid] && (
                          <span className="text-green-500" title="Saved to Database">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {player.rank_score ? player.rank_score.toLocaleString() : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    {player.win_rate || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handlePushToDb(player.uid)}
                      disabled={pushing[player.uid]}
                      className="px-4 py-2 rounded-lg bg-white text-black text-sm font-semibold hover:scale-[1.02] transition disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {pushing[player.uid] ? 'Pushing...' : 'Push to DB'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between">
            <div className="text-sm text-gray-400">
              Showing {startIndex + 1} to {Math.min(endIndex, players.length)} of {players.length} players
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-sm font-medium text-white hover:bg-white/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <div className="flex items-center gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={page}
                        type="button"
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                          currentPage === page
                            ? 'bg-white text-black'
                            : 'border border-white/10 bg-white/5 text-white hover:bg-white/10'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  } else if (page === currentPage - 2 || page === currentPage + 2) {
                    return <span key={page} className="text-gray-500">...</span>
                  }
                  return null
                })}
              </div>
              <button
                type="button"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-sm font-medium text-white hover:bg-white/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
import { refreshAchievements } from './achievements/actions'
import { refreshItems } from './items/actions'
import { refreshBattlePass } from './battlepass/actions'
import { refreshPatchNotes } from './patch-notes/actions'
import { refreshBalances } from './balances/actions'
import { refreshDevDiaries } from './dev-diaries/actions'
import { refreshGameVersions } from './game-versions/actions'
import { refreshLeaderboard } from './leaderboard/actions'
import { 
  refreshHeroList, 
  refreshAllHeroDetails, 
  refreshAllHeroStats, 
  refreshAllHeroCostumes, 
  refreshAllHeroLeaderboards 
} from './heroes/actions'

type SyncStatus = 'idle' | 'pending' | 'success' | 'error'

type PanelKey = 'overview' | 'auto-sync' | 'achievements' | 'items' | 'battlepass' | 'patchnotes' | 'balances' | 'devdiaries' | 'gameversions' | 'leaderboard' | 'leaderboard-players' | 'heroes'

interface SyncState {
  status: SyncStatus
  message: string | null
  error: string | null
  lastSynced: string | null
  count: number | null
}

const initialSyncState: SyncState = {
  status: 'idle',
  message: null,
  error: null,
  lastSynced: null,
  count: null
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [loginPassword, setLoginPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [showChangePassword, setShowChangePassword] = useState(false)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordChangeError, setPasswordChangeError] = useState('')
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  
  const [activePanel, setActivePanel] = useState<PanelKey>('overview')
  const [achievementsState, setAchievementsState] = useState<SyncState>(initialSyncState)
  const [itemsState, setItemsState] = useState<SyncState>(initialSyncState)
  const [battlePassState, setBattlePassState] = useState<SyncState>(initialSyncState)
  const [patchNotesState, setPatchNotesState] = useState<SyncState>(initialSyncState)
  const [balancesState, setBalancesState] = useState<SyncState>(initialSyncState)
  const [devDiariesState, setDevDiariesState] = useState<SyncState>(initialSyncState)
  const [gameVersionsState, setGameVersionsState] = useState<SyncState>(initialSyncState)
  const [leaderboardState, setLeaderboardState] = useState<SyncState>(initialSyncState)
  const [heroListState, setHeroListState] = useState<SyncState>(initialSyncState)
  const [heroDetailsState, setHeroDetailsState] = useState<SyncState>(initialSyncState)
  const [heroStatsState, setHeroStatsState] = useState<SyncState>(initialSyncState)
  const [heroCostumesState, setHeroCostumesState] = useState<SyncState>(initialSyncState)
  const [heroLeaderboardsState, setHeroLeaderboardsState] = useState<SyncState>(initialSyncState)
  const [achievementsPending, startAchievementsTransition] = useTransition()
  const [itemsPending, startItemsTransition] = useTransition()
  const [battlePassPending, startBattlePassTransition] = useTransition()
  const [patchNotesPending, startPatchNotesTransition] = useTransition()
  const [balancesPending, startBalancesTransition] = useTransition()
  const [devDiariesPending, startDevDiariesTransition] = useTransition()
  const [gameVersionsPending, startGameVersionsTransition] = useTransition()
  const [leaderboardPending, startLeaderboardTransition] = useTransition()
  const [heroListPending, startHeroListTransition] = useTransition()
  const [heroDetailsPending, startHeroDetailsTransition] = useTransition()
  const [heroStatsPending, startHeroStatsTransition] = useTransition()
  const [heroCostumesPending, startHeroCostumesTransition] = useTransition()
  const [heroLeaderboardsPending, startHeroLeaderboardsTransition] = useTransition()

  useEffect(() => {
    let cancelled = false
    const loadMetadata = async () => {
      try {
        const response = await fetch('/api/admin/cache-meta', { cache: 'no-store' })
        if (!response.ok) {
          return
        }
        const data = await response.json()
        if (cancelled) return
        const metadata = data?.metadata ?? {}
        if (metadata.achievements) {
          setAchievementsState(prev => ({
            ...prev,
            status: metadata.achievements.lastSynced ? 'success' : prev.status,
            lastSynced: metadata.achievements.lastSynced ?? null,
            count: typeof metadata.achievements.count === 'number' ? metadata.achievements.count : null
          }))
        }
        if (metadata.items) {
          setItemsState(prev => ({
            ...prev,
            status: metadata.items.lastSynced ? 'success' : prev.status,
            lastSynced: metadata.items.lastSynced ?? null,
            count: typeof metadata.items.count === 'number' ? metadata.items.count : null
          }))
        }
        if (metadata.battlepass) {
          setBattlePassState(prev => ({
            ...prev,
            status: metadata.battlepass.lastSynced ? 'success' : prev.status,
            lastSynced: metadata.battlepass.lastSynced ?? null,
            count: typeof metadata.battlepass.count === 'number' ? metadata.battlepass.count : null
          }))
        }
        if (metadata.patch_notes) {
          setPatchNotesState(prev => ({
            ...prev,
            status: metadata.patch_notes.lastSynced ? 'success' : prev.status,
            lastSynced: metadata.patch_notes.lastSynced ?? null,
            count: typeof metadata.patch_notes.count === 'number' ? metadata.patch_notes.count : null
          }))
        }
        if (metadata.balances) {
          setBalancesState(prev => ({
            ...prev,
            status: metadata.balances.lastSynced ? 'success' : prev.status,
            lastSynced: metadata.balances.lastSynced ?? null,
            count: typeof metadata.balances.count === 'number' ? metadata.balances.count : null
          }))
        }
        if (metadata.dev_diaries) {
          setDevDiariesState(prev => ({
            ...prev,
            status: metadata.dev_diaries.lastSynced ? 'success' : prev.status,
            lastSynced: metadata.dev_diaries.lastSynced ?? null,
            count: typeof metadata.dev_diaries.count === 'number' ? metadata.dev_diaries.count : null
          }))
        }
        if (metadata.game_versions) {
          setGameVersionsState(prev => ({
            ...prev,
            status: metadata.game_versions.lastSynced ? 'success' : prev.status,
            lastSynced: metadata.game_versions.lastSynced ?? null,
            count: typeof metadata.game_versions.count === 'number' ? metadata.game_versions.count : null
          }))
        }
        if (metadata.leaderboard) {
          setLeaderboardState(prev => ({
            ...prev,
            status: metadata.leaderboard.lastSynced ? 'success' : prev.status,
            lastSynced: metadata.leaderboard.lastSynced ?? null,
            count: typeof metadata.leaderboard.count === 'number' ? metadata.leaderboard.count : null
          }))
        }
        if (metadata.heroes_list) {
          setHeroListState(prev => ({
            ...prev,
            status: metadata.heroes_list.lastSynced ? 'success' : prev.status,
            lastSynced: metadata.heroes_list.lastSynced ?? null,
            count: typeof metadata.heroes_list.count === 'number' ? metadata.heroes_list.count : null
          }))
        }
        if (metadata.heroes_details) {
          setHeroDetailsState(prev => ({
            ...prev,
            status: metadata.heroes_details.lastSynced ? 'success' : prev.status,
            lastSynced: metadata.heroes_details.lastSynced ?? null,
            count: typeof metadata.heroes_details.count === 'number' ? metadata.heroes_details.count : null
          }))
        }
        if (metadata.heroes_stats) {
          setHeroStatsState(prev => ({
            ...prev,
            status: metadata.heroes_stats.lastSynced ? 'success' : prev.status,
            lastSynced: metadata.heroes_stats.lastSynced ?? null,
            count: typeof metadata.heroes_stats.count === 'number' ? metadata.heroes_stats.count : null
          }))
        }
        if (metadata.heroes_costumes) {
          setHeroCostumesState(prev => ({
            ...prev,
            status: metadata.heroes_costumes.lastSynced ? 'success' : prev.status,
            lastSynced: metadata.heroes_costumes.lastSynced ?? null,
            count: typeof metadata.heroes_costumes.count === 'number' ? metadata.heroes_costumes.count : null
          }))
        }
        if (metadata.heroes_leaderboards) {
          setHeroLeaderboardsState(prev => ({
            ...prev,
            status: metadata.heroes_leaderboards.lastSynced ? 'success' : prev.status,
            lastSynced: metadata.heroes_leaderboards.lastSynced ?? null,
            count: typeof metadata.heroes_leaderboards.count === 'number' ? metadata.heroes_leaderboards.count : null
          }))
        }
      } catch (_) {
        return
      }
    }
    loadMetadata()
    return () => {
      cancelled = true
    }
  }, [])

  const formatTimestamp = (value: string | null) => {
    if (!value) return '—'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '—'
    return date.toLocaleString()
  }

  const handleAchievementsSync = () => {
    startAchievementsTransition(async () => {
      setAchievementsState(prev => ({ ...prev, status: 'pending', message: null, error: null }))
      try {
        const result = await refreshAchievements()
        const now = new Date()
        const timestamp = now.toISOString()
        setAchievementsState({
          status: 'success',
          message: `Synced ${result.count} achievements`,
          error: null,
          lastSynced: timestamp,
          count: result.count
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to sync achievements.'
        setAchievementsState(prev => ({
          ...prev,
          status: 'error',
          error: message
        }))
      }
    })
  }

  const handleItemsSync = () => {
    startItemsTransition(async () => {
      setItemsState(prev => ({ ...prev, status: 'pending', message: null, error: null }))
      try {
        const result = await refreshItems()
        const now = new Date()
        const timestamp = now.toISOString()
        setItemsState({
          status: 'success',
          message: `Synced ${result.count} items`,
          error: null,
          lastSynced: timestamp,
          count: result.count
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to sync items.'
        setItemsState(prev => ({
          ...prev,
          status: 'error',
          error: message
        }))
      }
    })
  }

  const handleBattlePassSync = () => {
    startBattlePassTransition(async () => {
      setBattlePassState(prev => ({ ...prev, status: 'pending', message: null, error: null }))
      try {
        const result = await refreshBattlePass()
        const now = new Date()
        const timestamp = now.toISOString()
        setBattlePassState({
          status: 'success',
          message: `Synced ${result.seasons} seasons (${result.items} items)`,
          error: null,
          lastSynced: timestamp,
          count: result.items
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to sync battle pass.'
        setBattlePassState(prev => ({
          ...prev,
          status: 'error',
          error: message
        }))
      }
    })
  }

  const handlePatchNotesSync = () => {
    startPatchNotesTransition(async () => {
      setPatchNotesState(prev => ({ ...prev, status: 'pending', message: null, error: null }))
      try {
        const result = await refreshPatchNotes()
        const now = new Date()
        const timestamp = now.toISOString()
        setPatchNotesState({
          status: 'success',
          message: `Synced ${result.count} patch notes`,
          error: null,
          lastSynced: timestamp,
          count: result.count
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to sync patch notes.'
        setPatchNotesState(prev => ({
          ...prev,
          status: 'error',
          error: message
        }))
      }
    })
  }

  const handleBalancesSync = () => {
    startBalancesTransition(async () => {
      setBalancesState(prev => ({ ...prev, status: 'pending', message: null, error: null }))
      try {
        const result = await refreshBalances()
        const now = new Date()
        const timestamp = now.toISOString()
        setBalancesState({
          status: 'success',
          message: `Synced ${result.count} balance updates`,
          error: null,
          lastSynced: timestamp,
          count: result.count
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to sync balances.'
        setBalancesState(prev => ({
          ...prev,
          status: 'error',
          error: message
        }))
      }
    })
  }

  const handleDevDiariesSync = () => {
    startDevDiariesTransition(async () => {
      setDevDiariesState(prev => ({ ...prev, status: 'pending', message: null, error: null }))
      try {
        const result = await refreshDevDiaries()
        const now = new Date()
        const timestamp = now.toISOString()
        setDevDiariesState({
          status: 'success',
          message: `Synced ${result.count} dev diaries`,
          error: null,
          lastSynced: timestamp,
          count: result.count
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to sync dev diaries.'
        setDevDiariesState(prev => ({
          ...prev,
          status: 'error',
          error: message
        }))
      }
    })
  }

  const handleGameVersionsSync = () => {
    startGameVersionsTransition(async () => {
      setGameVersionsState(prev => ({ ...prev, status: 'pending', message: null, error: null }))
      try {
        const result = await refreshGameVersions()
        const now = new Date()
        const timestamp = now.toISOString()
        setGameVersionsState({
          status: 'success',
          message: `Synced ${result.count} game versions`,
          error: null,
          lastSynced: timestamp,
          count: result.count
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to sync game versions.'
        setGameVersionsState(prev => ({
          ...prev,
          status: 'error',
          error: message
        }))
      }
    })
  }

  const handleLeaderboardSync = () => {
    startLeaderboardTransition(async () => {
      setLeaderboardState(prev => ({ ...prev, status: 'pending', message: null, error: null }))
      try {
        const result = await refreshLeaderboard()
        const now = new Date()
        const timestamp = now.toISOString()
        setLeaderboardState({
          status: 'success',
          message: `Synced ${result.count} leaderboard entries`,
          error: null,
          lastSynced: timestamp,
          count: result.count
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to sync leaderboard.'
        setLeaderboardState(prev => ({
          ...prev,
          status: 'error',
          error: message
        }))
      }
    })
  }

  const handleHeroListSync = () => {
    startHeroListTransition(async () => {
      setHeroListState(prev => ({ ...prev, status: 'pending', message: null, error: null }))
      try {
        const result = await refreshHeroList()
        const now = new Date()
        const timestamp = now.toISOString()
        setHeroListState({
          status: 'success',
          message: `Synced ${result.count} heroes`,
          error: null,
          lastSynced: timestamp,
          count: result.count
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to sync hero list.'
        setHeroListState(prev => ({
          ...prev,
          status: 'error',
          error: message
        }))
      }
    })
  }

  const handleHeroDetailsSync = () => {
    startHeroDetailsTransition(async () => {
      setHeroDetailsState(prev => ({ ...prev, status: 'pending', message: null, error: null }))
      try {
        const result = await refreshAllHeroDetails()
        const now = new Date()
        const timestamp = now.toISOString()
        setHeroDetailsState({
          status: 'success',
          message: `Synced details for ${result.count} heroes`,
          error: null,
          lastSynced: timestamp,
          count: result.count
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to sync hero details.'
        setHeroDetailsState(prev => ({
          ...prev,
          status: 'error',
          error: message
        }))
      }
    })
  }

  const handleHeroStatsSync = () => {
    startHeroStatsTransition(async () => {
      setHeroStatsState(prev => ({ ...prev, status: 'pending', message: null, error: null }))
      try {
        const result = await refreshAllHeroStats()
        const now = new Date()
        const timestamp = now.toISOString()
        setHeroStatsState({
          status: 'success',
          message: `Synced ${result.count} stats records`,
          error: null,
          lastSynced: timestamp,
          count: result.count
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to sync hero stats.'
        setHeroStatsState(prev => ({
          ...prev,
          status: 'error',
          error: message
        }))
      }
    })
  }

  const handleHeroCostumesSync = () => {
    startHeroCostumesTransition(async () => {
      setHeroCostumesState(prev => ({ ...prev, status: 'pending', message: null, error: null }))
      try {
        const result = await refreshAllHeroCostumes()
        const now = new Date()
        const timestamp = now.toISOString()
        setHeroCostumesState({
          status: 'success',
          message: `Synced ${result.count} costumes`,
          error: null,
          lastSynced: timestamp,
          count: result.count
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to sync hero costumes.'
        setHeroCostumesState(prev => ({
          ...prev,
          status: 'error',
          error: message
        }))
      }
    })
  }

  const handleHeroLeaderboardsSync = () => {
    startHeroLeaderboardsTransition(async () => {
      setHeroLeaderboardsState(prev => ({ ...prev, status: 'pending', message: null, error: null }))
      
      let totalCount = 0
      let currentIndex = 0
      let isComplete = false
      const batchSize = 5
      
      try {
        while (!isComplete) {
          const response = await fetch('/api/admin/heroes-leaderboards-batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ startIndex: currentIndex, batchSize })
          })
          
          if (!response.ok) {
            throw new Error('Failed to sync batch')
          }
          
          const result = await response.json()
          totalCount += result.count
          currentIndex = result.nextIndex
          isComplete = result.isComplete
          
          setHeroLeaderboardsState(prev => ({
            ...prev,
            message: `Processing: ${result.processed}/${result.total} heroes...`
          }))
          
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
        
        await fetch('/api/cache-meta', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            cacheType: 'heroes_leaderboards',
            count: totalCount
          })
        })
        
        const now = new Date()
        const timestamp = now.toISOString()
        setHeroLeaderboardsState({
          status: 'success',
          message: `Synced ${totalCount} leaderboard entries`,
          error: null,
          lastSynced: timestamp,
          count: totalCount
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to sync hero leaderboards.'
        setHeroLeaderboardsState(prev => ({
          ...prev,
          status: 'error',
          error: message
        }))
      }
    })
  }

  const overviewCards = useMemo(() => ([
    {
      key: 'achievements' as const,
      title: 'Achievements Cache',
      state: achievementsState,
      pending: achievementsPending,
      onSync: handleAchievementsSync
    },
    {
      key: 'items' as const,
      title: 'Items Cache',
      state: itemsState,
      pending: itemsPending,
      onSync: handleItemsSync
    },
    {
      key: 'battlepass' as const,
      title: 'Battle Pass Cache',
      state: battlePassState,
      pending: battlePassPending,
      onSync: handleBattlePassSync
    },
    {
      key: 'patchnotes' as const,
      title: 'Patch Notes Cache',
      state: patchNotesState,
      pending: patchNotesPending,
      onSync: handlePatchNotesSync
    },
    {
      key: 'balances' as const,
      title: 'Balances Cache',
      state: balancesState,
      pending: balancesPending,
      onSync: handleBalancesSync
    },
    {
      key: 'devdiaries' as const,
      title: 'Dev Diaries Cache',
      state: devDiariesState,
      pending: devDiariesPending,
      onSync: handleDevDiariesSync
    },
    {
      key: 'gameversions' as const,
      title: 'Game Versions Cache',
      state: gameVersionsState,
      pending: gameVersionsPending,
      onSync: handleGameVersionsSync
    },
    {
      key: 'leaderboard' as const,
      title: 'Leaderboard Cache',
      state: leaderboardState,
      pending: leaderboardPending,
      onSync: handleLeaderboardSync
    }
  ]), [achievementsState, achievementsPending, itemsState, itemsPending, battlePassState, battlePassPending, patchNotesState, patchNotesPending, balancesState, balancesPending, devDiariesState, devDiariesPending, gameVersionsState, gameVersionsPending, leaderboardState, leaderboardPending])

  const renderStatusBadge = (state: SyncState) => {
    if (state.status === 'pending') {
      return (
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></div>
          <span className="text-xs font-medium text-blue-400">Syncing</span>
        </div>
      )
    }
    if (state.status === 'success') {
      return (
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
          <span className="text-xs font-medium text-emerald-400">Ready</span>
        </div>
      )
    }
    if (state.status === 'error') {
      return (
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-400"></div>
          <span className="text-xs font-medium text-red-400">Error</span>
        </div>
      )
    }
    return (
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-gray-500"></div>
        <span className="text-xs font-medium text-gray-500">Idle</span>
      </div>
    )
  }

  const renderSyncCard = (
    title: string,
    description: string,
    state: SyncState,
    pending: boolean,
    onSync: () => void
  ) => (
    <div className="border border-white/10 bg-gradient-to-br from-white/[0.03] to-white/[0.01] rounded-2xl p-6 backdrop-blur-sm hover:border-white/20 transition-all">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1">
          <h2 className="text-xl font-medium text-white mb-1.5">{title}</h2>
          <p className="text-gray-400 text-sm leading-relaxed">{description}</p>
        </div>
        {renderStatusBadge(state)}
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="rounded-lg border border-white/5 bg-white/5 px-3 py-2">
          <div className="text-xs text-gray-500 mb-0.5">Last Synced</div>
          <div className="text-sm font-medium text-white">{formatTimestamp(state.lastSynced)}</div>
        </div>
        <div className="rounded-lg border border-white/5 bg-white/5 px-3 py-2">
          <div className="text-xs text-gray-500 mb-0.5">Records</div>
          <div className="text-sm font-medium text-white">{state.count ?? '—'}</div>
        </div>
      </div>
      <div className="space-y-3">
        <button
          type="button"
          onClick={onSync}
          disabled={pending}
          className="w-full px-4 py-2.5 rounded-lg bg-white text-black font-medium text-sm transition-all hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {pending ? (
            <>
              <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
              <span>Syncing...</span>
            </>
          ) : (
            <span>Sync Now</span>
          )}
        </button>
        {state.message && state.status === 'success' && (
          <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-emerald-300 text-sm">
            {state.message}
          </div>
        )}
        {state.error && state.status === 'error' && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-red-300 text-sm">
            {state.error}
          </div>
        )}
      </div>
    </div>
  )

  const [autoSyncConfigs, setAutoSyncConfigs] = useState<any[]>([])
  const [autoSyncLoading, setAutoSyncLoading] = useState(true)
  const [savingConfig, setSavingConfig] = useState<Record<string, boolean>>({})
  const [runningManualSync, setRunningManualSync] = useState(false)
  const [manualSyncResults, setManualSyncResults] = useState<any>(null)
  const [pendingChanges, setPendingChanges] = useState<Record<string, any>>({})

  useEffect(() => {
    const checkAuth = () => {
      const isLoggedIn = localStorage.getItem('adminLoggedIn') === 'true'
      setIsAuthenticated(isLoggedIn)
      setIsCheckingAuth(false)
    }
    checkAuth()
  }, [])

  useEffect(() => {
    if (activePanel === 'auto-sync') {
      loadAutoSyncConfigs()
    }
  }, [activePanel])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')
    setIsLoggingIn(true)

    try {
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: loginPassword })
      })

      if (!response.ok) {
        const data = await response.json()
        setLoginError(data.error || 'Invalid password')
        return
      }

      localStorage.setItem('adminLoggedIn', 'true')
      setIsAuthenticated(true)
      setLoginPassword('')
    } catch (error) {
      setLoginError('Login failed. Please try again.')
    } finally {
      setIsLoggingIn(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('adminLoggedIn')
    setIsAuthenticated(false)
    router.push('/')
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordChangeError('')
    setPasswordChangeSuccess(false)

    if (newPassword !== confirmPassword) {
      setPasswordChangeError('New passwords do not match')
      return
    }

    if (newPassword.length < 6) {
      setPasswordChangeError('Password must be at least 6 characters')
      return
    }

    setIsChangingPassword(true)

    try {
      const response = await fetch('/api/admin/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword, newPassword })
      })

      if (!response.ok) {
        const data = await response.json()
        setPasswordChangeError(data.error || 'Failed to change password')
        return
      }

      setPasswordChangeSuccess(true)
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
      
      setTimeout(() => {
        setShowChangePassword(false)
        setPasswordChangeSuccess(false)
      }, 2000)
    } catch (error) {
      setPasswordChangeError('Failed to change password. Please try again.')
    } finally {
      setIsChangingPassword(false)
    }
  }

  const loadAutoSyncConfigs = async () => {
    try {
      setAutoSyncLoading(true)
      const response = await fetch('/api/admin/auto-sync')
      if (!response.ok) throw new Error('Failed to fetch auto-sync configs')
      const data = await response.json()
      setAutoSyncConfigs(data.configs || [])
    } catch (error) {
      console.error('Error loading auto-sync configs:', error)
    } finally {
      setAutoSyncLoading(false)
    }
  }

  const handleAutoSyncToggle = (cacheType: string, currentConfig: any) => {
    const currentPending = pendingChanges[cacheType] || {}
    const currentEnabled = currentPending.enabled !== undefined ? currentPending.enabled : currentConfig.enabled
    
    setPendingChanges(prev => ({
      ...prev,
      [cacheType]: {
        ...currentPending,
        enabled: !currentEnabled
      }
    }))
  }

  const handleSaveChanges = async (cacheType: string) => {
    setSavingConfig(prev => ({ ...prev, [cacheType]: true }))
    try {
      const pending = pendingChanges[cacheType]
      const currentConfig = autoSyncConfigs.find(c => c.cache_type === cacheType)
      
      const payload: any = {
        cache_type: cacheType,
        enabled: pending?.enabled ?? currentConfig?.enabled ?? false,
        interval_count: pending?.interval_count ?? currentConfig?.interval_count ?? 1,
        interval_unit: pending?.interval_unit ?? currentConfig?.interval_unit ?? 'day',
        batch_size: pending?.batch_size ?? currentConfig?.batch_size ?? null,
        batch_delay: pending?.batch_delay ?? currentConfig?.batch_delay ?? null
      }
      
      if (pending?.next_sync_at !== undefined) {
        payload.next_sync_at = pending.next_sync_at
      }
      
      const response = await fetch('/api/admin/auto-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!response.ok) throw new Error('Failed to save config')
      await loadAutoSyncConfigs()
      setPendingChanges(prev => {
        const next = { ...prev }
        delete next[cacheType]
        return next
      })
    } catch (error) {
      console.error('Error saving auto-sync config:', error)
    } finally {
      setSavingConfig(prev => ({ ...prev, [cacheType]: false }))
    }
  }

  const handleRunManualSync = async () => {
    setRunningManualSync(true)
    setManualSyncResults(null)
    try {
      const response = await fetch('/api/admin/auto-sync/run', {
        method: 'POST'
      })
      if (!response.ok) throw new Error('Failed to run manual sync')
      const data = await response.json()
      setManualSyncResults(data)
      await loadAutoSyncConfigs()
    } catch (error) {
      console.error('Error running manual sync:', error)
      setManualSyncResults({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to run manual sync' 
      })
    } finally {
      setRunningManualSync(false)
    }
  }

  const renderActivePanel = () => {
    switch (activePanel) {
      case 'auto-sync':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-medium text-white mb-2">Auto Sync Configuration</h1>
              <p className="text-gray-400">
                Configure automatic synchronization schedules for each cache type. When enabled, the system will automatically refresh data at the specified intervals.
              </p>
            </div>

            {autoSyncLoading ? (
              <div className="text-gray-400">Loading configurations...</div>
            ) : (
              <div className="space-y-4">
                {[
                  { key: 'achievements', label: 'Achievements' },
                  { key: 'items', label: 'Items' },
                  { key: 'battlepass', label: 'Battle Pass' },
                  { key: 'patch_notes', label: 'Patch Notes' },
                  { key: 'balances', label: 'Balances' },
                  { key: 'dev_diaries', label: 'Dev Diaries' },
                  { key: 'game_versions', label: 'Game Versions' },
                  { key: 'leaderboard', label: 'Leaderboard' },
                  { key: 'heroes_list', label: 'Heroes List' },
                  { key: 'heroes_details', label: 'Heroes Details & Abilities' },
                  { key: 'heroes_stats', label: 'Heroes Statistics' },
                  { key: 'heroes_costumes', label: 'Heroes Costumes' },
                  { key: 'heroes_leaderboards', label: 'Heroes Leaderboards' },
                  { key: 'player_stats_update', label: 'Player Stats Update' }
                ].map(({ key, label }) => {
                  const config = autoSyncConfigs.find(c => c.cache_type === key) || {
                    cache_type: key,
                    enabled: false,
                    interval_count: 1,
                    interval_unit: 'day',
                    last_auto_synced: null,
                    next_sync_at: null,
                    batch_size: 10,
                    batch_delay: 5
                  }
                  const isSaving = savingConfig[key]
                  const pending = pendingChanges[key] || {}
                  const hasChanges = Object.keys(pending).length > 0
                  const displayConfig = { ...config, ...pending }

                  return (
                    <div key={key} className="border border-white/10 bg-gradient-to-br from-white/[0.03] to-white/[0.01] rounded-xl p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-medium text-white mb-1">{label}</h3>
                            {hasChanges && (
                              <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-500/20 text-yellow-400">
                                Unsaved
                              </span>
                            )}
                          </div>
                          {config.next_sync_at && displayConfig.enabled && (
                            <p className="text-sm text-gray-400">
                              Next sync: {new Date(config.next_sync_at).toLocaleString()}
                            </p>
                          )}
                          {config.last_auto_synced && (
                            <p className="text-xs text-gray-500 mt-1">
                              Last synced: {new Date(config.last_auto_synced).toLocaleString()}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAutoSyncToggle(key, displayConfig)}
                          disabled={isSaving}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            displayConfig.enabled ? 'bg-emerald-500' : 'bg-gray-600'
                          } ${isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              displayConfig.enabled ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-400 mb-2">Interval Count</label>
                            <input
                              type="number"
                              min="1"
                              value={displayConfig.interval_count}
                              onChange={(e) => {
                                const value = parseInt(e.target.value) || 1
                                setPendingChanges(prev => ({
                                  ...prev,
                                  [key]: { ...prev[key], interval_count: value }
                                }))
                              }}
                              disabled={isSaving}
                              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-white/30 disabled:opacity-50"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-400 mb-2">Interval Unit</label>
                            <select
                              value={displayConfig.interval_unit}
                              onChange={(e) => {
                                setPendingChanges(prev => ({
                                  ...prev,
                                  [key]: { ...prev[key], interval_unit: e.target.value }
                                }))
                              }}
                              disabled={isSaving}
                              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-white/30 disabled:opacity-50 [&>option]:text-black [&>option]:bg-white"
                            >
                              <option value="hour">Hour(s)</option>
                              <option value="day">Day(s)</option>
                              <option value="week">Week(s)</option>
                              <option value="month">Month(s)</option>
                            </select>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-xs text-gray-400 mb-2">Set Specific Next Sync Time (Optional)</label>
                          <input
                            type="datetime-local"
                            onChange={(e) => {
                              setPendingChanges(prev => ({
                                ...prev,
                                [key]: { ...prev[key], next_sync_at: e.target.value || null }
                              }))
                            }}
                            disabled={isSaving}
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-white/30 disabled:opacity-50"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Leave empty to start from now. After first sync, intervals will continue from that point.
                          </p>
                        </div>
                        
                        {key === 'player_stats_update' && (
                          <>
                            <div className="border-t border-white/10 pt-3">
                              <h4 className="text-sm font-medium text-white mb-3">Batch Processing Configuration</h4>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs text-gray-400 mb-2">Batch Size (players)</label>
                                  <input
                                    type="number"
                                    min="1"
                                    value={displayConfig.batch_size || 10}
                                    onChange={(e) => {
                                      const value = parseInt(e.target.value) || 10
                                      setPendingChanges(prev => ({
                                        ...prev,
                                        [key]: { ...prev[key], batch_size: value }
                                      }))
                                    }}
                                    disabled={isSaving}
                                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-white/30 disabled:opacity-50"
                                  />
                                  <p className="text-xs text-gray-500 mt-1">
                                    Number of players to process in each batch
                                  </p>
                                </div>
                                <div>
                                  <label className="block text-xs text-gray-400 mb-2">Delay Between Batches (minutes)</label>
                                  <input
                                    type="number"
                                    min="1"
                                    value={displayConfig.batch_delay || 5}
                                    onChange={(e) => {
                                      const value = parseInt(e.target.value) || 5
                                      setPendingChanges(prev => ({
                                        ...prev,
                                        [key]: { ...prev[key], batch_delay: value }
                                      }))
                                    }}
                                    disabled={isSaving}
                                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-white/30 disabled:opacity-50"
                                  />
                                  <p className="text-xs text-gray-500 mt-1">
                                    Wait time between processing batches
                                  </p>
                                </div>
                              </div>
                            </div>
                          </>
                        )}
                        
                        {hasChanges && (
                          <div className="flex gap-2 pt-2">
                            <button
                              type="button"
                              onClick={() => handleSaveChanges(key)}
                              disabled={isSaving}
                              className="flex-1 px-4 py-2 rounded-lg bg-white text-black text-sm font-semibold hover:bg-white/90 transition disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setPendingChanges(prev => {
                                  const next = { ...prev }
                                  delete next[key]
                                  return next
                                })
                              }}
                              disabled={isSaving}
                              className="px-4 py-2 rounded-lg border border-white/10 bg-white/5 text-white text-sm font-medium hover:bg-white/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="border border-white/10 bg-gradient-to-br from-white/[0.03] to-white/[0.01] rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium text-white mb-1">Manual Sync</h3>
                  <p className="text-sm text-gray-400">
                    Manually trigger all due syncs now instead of waiting for the cron job.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRunManualSync}
                  disabled={runningManualSync}
                  className="px-4 py-2 rounded-lg bg-white text-black text-sm font-semibold hover:scale-[1.02] transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {runningManualSync ? 'Running...' : 'Run Due Syncs Now'}
                </button>
              </div>
              {manualSyncResults && (
                <div className={`rounded-lg border p-4 ${
                  manualSyncResults.success 
                    ? 'border-emerald-500/20 bg-emerald-500/10' 
                    : 'border-red-500/20 bg-red-500/10'
                }`}>
                  {manualSyncResults.success ? (
                    <div>
                      <p className="text-emerald-300 text-sm font-medium mb-2">
                        Sync completed successfully
                      </p>
                      {manualSyncResults.results && manualSyncResults.results.length > 0 ? (
                        <div className="space-y-1">
                          {manualSyncResults.results.map((result: any, idx: number) => (
                            <div key={idx} className="text-xs text-emerald-200/80">
                              {result.cache_type}: {result.success ? '✓ Success' : `✗ ${result.error}`}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-emerald-200/80">No syncs were due at this time.</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-red-300 text-sm">{manualSyncResults.error}</p>
                  )}
                </div>
              )}
            </div>

            <div className="border border-blue-500/20 bg-blue-500/10 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <div className="text-blue-400 text-xl">ℹ️</div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-blue-300 mb-1">Setup Instructions</h4>
                  <p className="text-sm text-blue-200/80 leading-relaxed">
                    To enable automatic syncing, configure a cron job to call the endpoint: <code className="px-1.5 py-0.5 bg-black/20 rounded text-xs">GET /api/admin/auto-sync/cron</code>
                  </p>
                  <p className="text-sm text-blue-200/80 leading-relaxed mt-2">
                    Set the <code className="px-1.5 py-0.5 bg-black/20 rounded text-xs">CRON_SECRET</code> environment variable and include it in the Authorization header as a Bearer token.
                  </p>
                  <p className="text-xs text-blue-200/60 mt-2">
                    Example: <code className="px-1.5 py-0.5 bg-black/20 rounded">Authorization: Bearer YOUR_CRON_SECRET</code>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )
      case 'achievements':
        return renderSyncCard(
          'Achievements Cache',
          'Pull the full achievement catalog from the Marvel Rivals API, normalize it, and persist the results to MySQL for fast UI access.',
          achievementsState,
          achievementsPending,
          handleAchievementsSync
        )
      case 'items':
        return renderSyncCard(
          'Items Cache',
          'Refresh the items catalog, including metadata, stats, effects, and pricing details, to keep the explorer responsive.',
          itemsState,
          itemsPending,
          handleItemsSync
        )
      case 'battlepass':
        return renderSyncCard(
          'Battle Pass Cache',
          'Cache every season and reward so the battle pass viewer can switch between seasons instantly without hammering the upstream API.',
          battlePassState,
          battlePassPending,
          handleBattlePassSync
        )
      case 'patchnotes':
        return renderSyncCard(
          'Patch Notes Cache',
          'Store all patch notes with images and HTML content so the viewer loads instantly and requires no external API calls.',
          patchNotesState,
          patchNotesPending,
          handlePatchNotesSync
        )
      case 'balances':
        return renderSyncCard(
          'Balances Cache',
          'Cache hero and gameplay balance changes with full content and images for immediate display without external requests.',
          balancesState,
          balancesPending,
          handleBalancesSync
        )
      case 'devdiaries':
        return renderSyncCard(
          'Dev Diaries Cache',
          'Store development insights and team updates for offline browsing.',
          devDiariesState,
          devDiariesPending,
          handleDevDiariesSync
        )
      case 'gameversions':
        return renderSyncCard(
          'Game Versions Cache',
          'Cache release history and patch note links so version browsing stays snappy.',
          gameVersionsState,
          gameVersionsPending,
          handleGameVersionsSync
        )
      case 'leaderboard':
        return renderSyncCard(
          'Leaderboard Cache',
          'Cache global player rankings. The leaderboard auto-refreshes every 2 hours when viewed, but you can manually trigger a sync here.',
          leaderboardState,
          leaderboardPending,
          handleLeaderboardSync
        )
      case 'leaderboard-players':
        return <LeaderboardPlayersPanel />
      case 'heroes':
        return (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-medium text-white mb-2">Heroes Data Management</h1>
              <p className="text-gray-400">
                Manage all hero-related cached data. Each section can be synced independently. Hero List must be synced first before syncing details, stats, costumes, or leaderboards.
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {renderSyncCard(
                'Hero List',
                'Basic hero information including names, roles, types, and images. Sync this first.',
                heroListState,
                heroListPending,
                handleHeroListSync
              )}
              {renderSyncCard(
                'Hero Details & Abilities',
                'Full hero details including abilities, team-ups, transformations, bio, and lore for all heroes.',
                heroDetailsState,
                heroDetailsPending,
                handleHeroDetailsSync
              )}
              {renderSyncCard(
                'Hero Statistics',
                'Global usage statistics for each hero including win rates, KDA, and performance metrics.',
                heroStatsState,
                heroStatsPending,
                handleHeroStatsSync
              )}
              {renderSyncCard(
                'Hero Costumes',
                'All available costumes/skins for each hero with images and rarity information.',
                heroCostumesState,
                heroCostumesPending,
                handleHeroCostumesSync
              )}
              {renderSyncCard(
                'Hero Leaderboards',
                'Top players for each hero across all platforms (PC, PlayStation, Xbox). This sync can take several minutes.',
                heroLeaderboardsState,
                heroLeaderboardsPending,
                handleHeroLeaderboardsSync
              )}
            </div>
          </div>
        )
      default:
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-medium text-white mb-2">Admin Dashboard</h1>
              <p className="text-gray-400">
                Manage cached Marvel Rivals data sets. Trigger a resync when upstream data changes or when cache entries grow stale.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {overviewCards.map(card => (
                <div key={card.key} className="border border-white/10 bg-gradient-to-br from-white/[0.03] to-white/[0.01] rounded-xl p-5 hover:border-white/20 transition-all cursor-pointer group" onClick={() => setActivePanel(card.key)}>
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-base font-medium text-white group-hover:text-white/90 transition">{card.title.replace(' Cache', '')}</h3>
                    {renderStatusBadge(card.state)}
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Last synced</span>
                      <span className="text-white font-medium">{formatTimestamp(card.state.lastSynced)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Records</span>
                      <span className="text-white font-medium">{card.state.count ?? '—'}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      card.onSync()
                    }}
                    disabled={card.pending}
                    className="w-full px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {card.pending ? 'Syncing...' : 'Sync Now'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )
    }
  }

  const sidebarItems = [
    { key: 'overview', label: 'Overview', icon: '📊' },
    { key: 'auto-sync', label: 'Auto Syncs', icon: '⏰' },
    { key: 'leaderboard-players', label: 'LB Players', icon: '👥' },
    { key: 'heroes', label: 'Heroes', icon: '🦸' },
  ]

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#05060A]">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#05060A]">
        <div className="w-full max-w-md p-8">
          <div className="bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/10 rounded-2xl p-8">
            <h1 className="text-3xl font-bold text-white mb-2">Admin Login</h1>
            <p className="text-gray-400 mb-8">Enter your password to access the admin panel</p>
            
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white/30"
                  placeholder="Enter password"
                  required
                />
              </div>
              
              {loginError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
                  {loginError}
                </div>
              )}
              
              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full px-4 py-3 bg-white text-black font-semibold rounded-lg hover:bg-white/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoggingIn ? 'Logging in...' : 'Login'}
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#05060A]">
      <Navbar />
      <div className="flex-1 flex pt-20 pb-16">
        <aside className="hidden lg:flex w-64 flex-col border-r border-white/10 bg-gradient-to-b from-white/[0.02] to-transparent px-6 py-8 gap-6">
          <div className="mb-4">
            <div className="text-xs uppercase tracking-wider text-gray-500 mb-2">Admin Panel</div>
            <h2 className="text-xl font-semibold text-white">Data Management</h2>
          </div>
          <nav className="flex flex-col gap-1">
            {sidebarItems.map(item => (
              <button
                key={item.key}
                type="button"
                onClick={() => setActivePanel(item.key as PanelKey)}
                className={`text-left px-3 py-2.5 rounded-lg transition-all flex items-center gap-3 ${
                  activePanel === item.key
                    ? 'bg-white text-black font-medium'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
          <div className="mt-auto pt-6 border-t border-white/10 space-y-3">
            <button
              type="button"
              onClick={() => setShowChangePassword(true)}
              className="w-full px-3 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white text-sm font-medium transition flex items-center gap-2"
            >
              <span>🔑</span>
              <span>Change Password</span>
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full px-3 py-2.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-300 hover:text-red-200 text-sm font-medium transition flex items-center gap-2"
            >
              <span>🚪</span>
              <span>Logout</span>
            </button>
            <div className="text-xs text-gray-500 leading-relaxed pt-3 border-t border-white/10">
              <div className="mb-2">Ensure API keys and database credentials are configured.</div>
              <div>Syncs run asynchronously and may take several minutes.</div>
            </div>
          </div>
        </aside>
        <main className="flex-1 overflow-auto">
          <div className="max-w-6xl mx-auto px-6 lg:px-12 py-8">
            <div className="lg:hidden border border-white/10 bg-white/5 rounded-xl p-4 mb-6">
              <div className="flex flex-wrap gap-2">
                {sidebarItems.map(item => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setActivePanel(item.key as PanelKey)}
                    className={`px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2 ${
                      activePanel === item.key
                        ? 'bg-white text-black font-medium'
                        : 'border border-white/10 text-white/70 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="pb-8">
              {renderActivePanel()}
            </div>
          </div>
        </main>
      </div>
      <Footer />
      
      {showChangePassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#05060A] border border-white/10 rounded-2xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-bold text-white mb-6">Change Password</h2>
            
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white/30"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white/30"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white/30"
                  required
                />
              </div>
              
              {passwordChangeError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
                  {passwordChangeError}
                </div>
              )}
              
              {passwordChangeSuccess && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm">
                  Password changed successfully!
                </div>
              )}
              
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="flex-1 px-4 py-3 bg-white text-black font-semibold rounded-lg hover:bg-white/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isChangingPassword ? 'Changing...' : 'Change Password'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowChangePassword(false)
                    setOldPassword('')
                    setNewPassword('')
                    setConfirmPassword('')
                    setPasswordChangeError('')
                    setPasswordChangeSuccess(false)
                  }}
                  className="px-4 py-3 border border-white/10 bg-white/5 text-white font-medium rounded-lg hover:bg-white/10 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}


