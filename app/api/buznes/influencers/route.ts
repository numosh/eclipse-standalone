import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const platform = searchParams.get('platform')
    const tier = searchParams.get('tier')
    const kolCategory = searchParams.get('kolCategory')

    const filters: any = {}
    if (platform && platform !== 'all') filters.platform = platform
    if (tier && tier !== 'all') filters.tier = tier
    if (kolCategory && kolCategory !== 'all') filters.kolCategory = kolCategory

    // Fetch influencers with their performance data
    const influencers = await prisma.buznesiaInfluencer.findMany({
      where: filters,
      include: {
        contents: {
          include: {
            campaign: {
              include: {
                client: true
              }
            }
          }
        }
      },
      orderBy: {
        followers: 'desc'
      }
    })

    // Calculate performance metrics for each influencer
    const influencerData = influencers.map(influencer => {
      const contents = influencer.contents
      const totalContent = contents.length

      if (totalContent === 0) {
        return {
          id: influencer.id,
          socmedHandle: influencer.socmedHandle,
          platform: influencer.platform,
          tier: influencer.tier,
          followers: influencer.followers,
          kolCategory: influencer.kolCategory,
          totalContent: 0,
          avgReach: 0,
          avgViews: 0,
          avgEngagement: 0,
          erRate: 0
        }
      }

      const totalReach = contents.reduce((sum, c) => sum + c.reach, 0)
      const totalViews = contents.reduce((sum, c) => sum + c.views, 0)
      const totalEngagement = contents.reduce((sum, c) => sum + c.engagement, 0)

      const avgReach = totalReach / totalContent
      const avgViews = totalViews / totalContent
      const avgEngagement = totalEngagement / totalContent
      const erRate = influencer.followers > 0 ? totalEngagement / (influencer.followers * totalContent) : 0

      return {
        id: influencer.id,
        socmedHandle: influencer.socmedHandle,
        platform: influencer.platform,
        tier: influencer.tier,
        followers: influencer.followers,
        kolCategory: influencer.kolCategory,
        totalContent,
        avgReach,
        avgViews,
        avgEngagement,
        erRate
      }
    })

    return NextResponse.json(influencerData)
  } catch (error) {
    console.error('Error fetching influencers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch influencers' },
      { status: 500 }
    )
  }
}
