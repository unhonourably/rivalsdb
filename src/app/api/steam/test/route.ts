import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const MARVEL_RIVALS_STEAM_APP_ID = '2767030'
const STEAM_API_KEY = process.env.STEAM_API_KEY

export async function GET() {
  try {
    const globalPercentagesUrl = `https://api.steampowered.com/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v2/?gameid=${MARVEL_RIVALS_STEAM_APP_ID}`
    const schemaUrl = `https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/?key=${STEAM_API_KEY}&appid=${MARVEL_RIVALS_STEAM_APP_ID}`

    const [globalResponse, schemaResponse] = await Promise.all([
      fetch(globalPercentagesUrl),
      fetch(schemaUrl)
    ])

    const globalData = await globalResponse.json()
    const schemaData = schemaResponse.ok ? await schemaResponse.json() : null

    return NextResponse.json({
      globalResponseStatus: globalResponse.status,
      globalResponseOk: globalResponse.ok,
      globalData,
      schemaResponseStatus: schemaResponse.status,
      schemaResponseOk: schemaResponse.ok,
      schemaData,
      apiKeyConfigured: !!STEAM_API_KEY,
      appId: MARVEL_RIVALS_STEAM_APP_ID
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

