import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const MARVEL_RIVALS_STEAM_APP_ID = '2767030'

export async function GET() {
  try {
    const response = await fetch(
      `https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=${MARVEL_RIVALS_STEAM_APP_ID}`,
      {
        next: { revalidate: 60 }
      }
    )

    if (!response.ok) {
      throw new Error(`Steam API error: ${response.status}`)
    }

    const data = await response.json()
    const playerCount = data?.response?.result === 1 
      ? data.response.player_count 
      : null

    return NextResponse.json({ 
      playerCount,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching player count:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to fetch player count',
        playerCount: null
      },
      { status: 500 }
    )
  }
}

