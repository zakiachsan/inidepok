import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db, ads, asc } from '@/db'

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const allAds = await db
      .select()
      .from(ads)
      .orderBy(asc(ads.position))

    return NextResponse.json({ ads: allAds })
  } catch (error) {
    console.error('Error fetching ads:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil data iklan' },
      { status: 500 }
    )
  }
}
