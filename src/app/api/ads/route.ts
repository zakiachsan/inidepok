import { NextResponse } from 'next/server'
import { db, ads, eq } from '@/db'

export async function GET() {
  try {
    const enabledAds = await db
      .select()
      .from(ads)
      .where(eq(ads.enabled, true))

    return NextResponse.json(
      { ads: enabledAds },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
        },
      }
    )
  } catch (error) {
    console.error('Error fetching ads:', error)
    return NextResponse.json({ error: 'Failed to fetch ads' }, { status: 500 })
  }
}
