import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sessionId = params.id

    // Fetch author profiles for this session
    const authorProfiles = await prisma.authorProfile.findMany({
      where: {
        sessionId
      },
      include: {
        posts: {
          take: 10,
          orderBy: {
            publishedAt: 'desc'
          }
        }
      },
      orderBy: {
        collaborationScore: 'desc'
      }
    })

    return NextResponse.json({
      authorProfiles
    })
  } catch (error) {
    console.error('Error fetching author profiles:', error)
    return NextResponse.json(
      { error: 'Failed to fetch author profiles' },
      { status: 500 }
    )
  }
}
