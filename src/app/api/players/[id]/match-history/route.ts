import { NextRequest, NextResponse } from 'next/server'
import { getMatchHistory, saveMatchHistory, fetchMatchHistoryFromApi } from '@/lib/matchHistory'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const playerUid = parseInt(params.id, 10)
    
    if (isNaN(playerUid)) {
      return NextResponse.json({ error: 'Invalid player ID' }, { status: 400 })
    }
    
    let matches = await getMatchHistory(playerUid)
    
    if (matches.length === 0) {
      const apiMatches = await fetchMatchHistoryFromApi(playerUid)
      
      if (apiMatches && apiMatches.length > 0) {
        await saveMatchHistory(playerUid, apiMatches)
        matches = apiMatches
      }
    }
    
    return NextResponse.json({ match_history: matches, source: matches.length > 0 ? 'database' : 'not_found' })
  } catch (error) {
    console.error('Error fetching match history:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch match history' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const playerUid = parseInt(params.id, 10)
    
    if (isNaN(playerUid)) {
      return NextResponse.json({ error: 'Invalid player ID' }, { status: 400 })
    }
    
    const apiMatches = await fetchMatchHistoryFromApi(playerUid)
    
    if (!apiMatches) {
      return NextResponse.json({ error: 'Failed to fetch match history from API' }, { status: 404 })
    }
    
    await saveMatchHistory(playerUid, apiMatches)
    
    return NextResponse.json({ 
      match_history: apiMatches, 
      count: apiMatches.length,
      source: 'api_refreshed'
    })
  } catch (error) {
    console.error('Error refreshing match history:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to refresh match history' },
      { status: 500 }
    )
  }
}

