import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'

export const runtime = 'nodejs'

/**
 * OG Image Generator - Auto-resize images to 1200x630 for optimal social sharing
 * Usage: /api/og-image?url=/uploads/image.jpg
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const imageUrl = searchParams.get('url')

    if (!imageUrl) {
      return new NextResponse('Missing url parameter', { status: 400 })
    }

    // Build full URL
    const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://inidepok.com'
    const fullUrl = imageUrl.startsWith('http') ? imageUrl : `${BASE_URL}${imageUrl}`

    // Fetch original image
    const response = await fetch(fullUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; OGImageBot/1.0)',
      },
    })

    if (!response.ok) {
      console.error(`Failed to fetch image: ${response.status} ${fullUrl}`)
      return new NextResponse('Failed to fetch image', { status: 404 })
    }

    const imageBuffer = Buffer.from(await response.arrayBuffer())

    // Resize to 1200x630 with cover fit (crop to fill)
    const resizedImage = await sharp(imageBuffer)
      .resize(1200, 630, {
        fit: 'cover',
        position: 'center',
      })
      .jpeg({ quality: 85 })
      .toBuffer()

    // Return resized image with appropriate headers
    return new NextResponse(new Uint8Array(resizedImage), {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400', // Cache for 1 day
      },
    })
  } catch (error) {
    console.error('OG Image generation error:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
}
