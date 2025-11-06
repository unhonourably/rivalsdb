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

    const globalPercentagesUrl = `https://api.steampowered.com/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v2/?gameid=${MARVEL_RIVALS_STEAM_APP_ID}`
    const schemaUrl = `https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?key=${STEAM_API_KEY}&appid=${MARVEL_RIVALS_STEAM_APP_ID}`

    const [globalPercentagesResponse, schemaResponse] = await Promise.all([
      fetch(globalPercentagesUrl, { next: { revalidate: 3600 } }),
      fetch(schemaUrl, { next: { revalidate: 3600 } })
    ])

    if (!globalPercentagesResponse.ok) {
      const errorText = await globalPercentagesResponse.text()
      console.error('Steam global percentages API error:', {
        status: globalPercentagesResponse.status,
        statusText: globalPercentagesResponse.statusText,
        body: errorText
      })
      throw new Error(`Steam API error: ${globalPercentagesResponse.status} - ${errorText}`)
    }

    const globalData = await globalPercentagesResponse.json()
    const schemaData = schemaResponse.ok ? await schemaResponse.json() : null

    console.log('Steam API Response Debug:', {
      globalDataFull: JSON.stringify(globalData),
      globalDataKeys: Object.keys(globalData || {}),
      schemaResponseStatus: schemaResponse.status,
      schemaDataKeys: schemaData ? Object.keys(schemaData) : null,
      schemaDataGame: schemaData?.game ? Object.keys(schemaData.game) : null
    })

    let achievements = []
    
    if (globalData?.achievementpercentages?.achievements) {
      achievements = globalData.achievementpercentages.achievements
    } else if (globalData?.achievements) {
      achievements = globalData.achievements
    } else if (Array.isArray(globalData)) {
      achievements = globalData
    }
    
    console.log('Parsed achievements:', {
      count: achievements.length,
      firstFew: achievements.slice(0, 5),
      sample: achievements[0]
    })
    
    if (achievements.length === 0) {
      console.warn('No achievements found in Steam API response. Raw response:', JSON.stringify(globalData))
    }
    
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
      .filter((ach: any) => {
        const hasName = ach.name || ach.apiname || ach.achievement_name
        const hasPercent = ach.percent != null && ach.percent !== undefined
        if (!hasName || !hasPercent) {
          console.log('Filtering out achievement:', ach)
        }
        return hasName && hasPercent
      })
      .map((ach: any) => {
        const name = ach.name || ach.apiname || ach.achievement_name || 'Unknown'
        const percent = typeof ach.percent === 'number' ? ach.percent : parseFloat(ach.percent) || 0
        return {
          name,
          percent,
          ...(achievementDetails[name] || {})
        }
      })

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
      timestamp: new Date().toISOString(),
      debug: process.env.NODE_ENV === 'development' ? {
        rawAchievementsCount: achievements.length,
        enrichedCount: enrichedAchievements.length,
        sampleRaw: achievements[0],
        sampleEnriched: enrichedAchievements[0]
      } : undefined
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

