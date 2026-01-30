import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db, ads, eq } from '@/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const [ad] = await db
      .select()
      .from(ads)
      .where(eq(ads.id, id))
      .limit(1)

    if (!ad) {
      return NextResponse.json({ error: 'Iklan tidak ditemukan' }, { status: 404 })
    }

    return NextResponse.json({ ad })
  } catch (error) {
    console.error('Error fetching ad:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil data iklan' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { enabled, type, imageUrl, redirectUrl, altText, adCode } = body

    // Check if ad exists
    const [existingAd] = await db
      .select()
      .from(ads)
      .where(eq(ads.id, id))
      .limit(1)

    if (!existingAd) {
      return NextResponse.json({ error: 'Iklan tidak ditemukan' }, { status: 404 })
    }

    // Update ad
    const [updatedAd] = await db
      .update(ads)
      .set({
        enabled: enabled ?? existingAd.enabled,
        type: type ?? existingAd.type,
        imageUrl: type === 'custom' ? imageUrl : null,
        redirectUrl: type === 'custom' ? redirectUrl : null,
        altText: type === 'custom' ? altText : null,
        adCode: type === 'programmatic' ? adCode : null,
      })
      .where(eq(ads.id, id))
      .returning()

    return NextResponse.json({ success: true, ad: updatedAd })
  } catch (error) {
    console.error('Error updating ad:', error)
    return NextResponse.json(
      { error: 'Gagal memperbarui iklan' },
      { status: 500 }
    )
  }
}
