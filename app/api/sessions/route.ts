import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { runAnalysis } from '@/lib/analysis-engine'
import { z } from 'zod'

const createSessionSchema = z.object({
  title: z.string().min(1).max(255),
  focusBrand: z.object({
    name: z.string().min(1),
    website: z.string().url().optional().or(z.literal('')),
    instagramHandle: z.string().optional().or(z.literal('')),
    tiktokHandle: z.string().optional().or(z.literal('')),
    twitterHandle: z.string().optional().or(z.literal('')),
    youtubeHandle: z.string().optional().or(z.literal('')),
    facebookHandle: z.string().optional().or(z.literal('')),
  }),
  competitors: z.array(
    z.object({
      name: z.string().min(1),
      website: z.string().url().optional().or(z.literal('')),
      instagramHandle: z.string().optional().or(z.literal('')),
      tiktokHandle: z.string().optional().or(z.literal('')),
      twitterHandle: z.string().optional().or(z.literal('')),
      youtubeHandle: z.string().optional().or(z.literal('')),
      facebookHandle: z.string().optional().or(z.literal('')),
    })
  ).max(3),
  universeKeywords: z.string().optional()
})

// GET - Fetch all sessions for user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sessions = await prisma.analysisSession.findMany({
      where: {
        userId: (session.user as any).id
      },
      include: {
        focusBrand: true,
        competitors: true,
        analysisResult: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(sessions)
  } catch (error) {
    console.error('Error fetching sessions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new analysis session
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validated = createSessionSchema.parse(body)

    // Create session with focus brand and competitors
    const analysisSession = await prisma.analysisSession.create({
      data: {
        title: validated.title,
        userId: (session.user as any).id,
        status: 'pending',
        universeKeywords: validated.universeKeywords || null,
        focusBrand: {
          create: {
            name: validated.focusBrand.name,
            website: validated.focusBrand.website || null,
            instagramHandle: validated.focusBrand.instagramHandle || null,
            tiktokHandle: validated.focusBrand.tiktokHandle || null,
            twitterHandle: validated.focusBrand.twitterHandle || null,
            youtubeHandle: validated.focusBrand.youtubeHandle || null,
            facebookHandle: validated.focusBrand.facebookHandle || null,
          }
        },
        competitors: {
          create: validated.competitors.map(comp => ({
            name: comp.name,
            website: comp.website || null,
            instagramHandle: comp.instagramHandle || null,
            tiktokHandle: comp.tiktokHandle || null,
            twitterHandle: comp.twitterHandle || null,
            youtubeHandle: comp.youtubeHandle || null,
            facebookHandle: comp.facebookHandle || null,
          }))
        }
      },
      include: {
        focusBrand: true,
        competitors: true
      }
    })

    // Trigger background analysis directly (no HTTP call needed)
    console.log(`🚀 Triggering analysis for session: ${analysisSession.id}`)
    runAnalysis(analysisSession.id).catch(err => {
      console.error('❌ Background analysis error:', err)
    })

    return NextResponse.json(analysisSession, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    console.error('Error creating session:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
