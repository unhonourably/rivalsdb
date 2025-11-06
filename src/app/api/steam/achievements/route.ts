import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const MARVEL_RIVALS_STEAM_APP_ID = '2767030'
const STEAM_API_KEY = process.env.STEAM_API_KEY

export async function GET() {
  try {
    if (!STEAM_API_KEY) {
      return NextResponse.json(
        { error: 'Steam API key not configured' },
        { status: 500 }
      )
    }

    const [globalPercentagesResponse, schemaResponse] = await Promise.all([
      fetch(
        `https://api.steampowered.com/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v2/?gameid=${MARVEL_RIVALS_STEAM_APP_ID}`,
        { next: { revalidate: 3600 } }
      ),
      fetch(
        `https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?key=${STEAM_API_KEY}&appid=${MARVEL_RIVALS_STEAM_APP_ID}`,
        { next: { revalidate: 3600 } }
      )
    ])

    if (!globalPercentagesResponse.ok) {
      throw new Error(`Steam API error: ${globalPercentagesResponse.status}`)
    }

    const globalData = await globalPercentagesResponse.json()
    const schemaData = schemaResponse.ok ? await schemaResponse.json() : null

    const achievements = globalData?.achievementpercentages?.achievements || []
    
    const achievementDetails: Record<string, {
      displayName?: string
      description?: string
      icon?: string
      iconGray?: string
    }> = {}
    
    if (schemaData?.game?.availableGameStats?.achievements) {
      const details = schemaData.game.availableGameStats.achievements
      details.forEach((ach: any) => {
        if (ach.name) {
          achievementDetails[ach.name] = {
            displayName: ach.displayName,
            description: ach.description,
            icon: ach.icon,
            iconGray: ach.icongray
          }
        }
      })
    }

    const enrichedAchievements = achievements
      .filter((ach: any) => ach.name && ach.percent != null)
      .map((ach: any) => ({
        name: ach.name,
        percent: typeof ach.percent === 'number' ? ach.percent : 0,
        ...(achievementDetails[ach.name] || {})
      }))

    const totalAchievements = enrichedAchievements.length
    const averageCompletion = totalAchievements > 0
      ? enrichedAchievements.reduce((sum: number, ach: any) => sum + (ach.percent || 0), 0) / totalAchievements
      : 0

    const rarestAchievements = [...enrichedAchievements]
      .sort((a, b) => a.percent - b.percent)
      .slice(0, 10)

    const mostCommonAchievements = [...enrichedAchievements]
      .sort((a, b) => b.percent - a.percent)
      .slice(0, 10)

    return NextResponse.json({
      totalAchievements,
      averageCompletion,
      achievements: enrichedAchievements,
      rarestAchievements,
      mostCommonAchievements,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error fetching Steam achievements:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch Steam achievements',
        achievements: [],
        totalAchievements: 0,
        averageCompletion: 0
      },
      { status: 500 }
    )
  }
}

