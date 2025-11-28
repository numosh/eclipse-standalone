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
    const year = searchParams.get('year')
    const month = searchParams.get('month')
    const brandName = searchParams.get('brandName')
    const campaignName = searchParams.get('campaignName')
    const platform = searchParams.get('platform')
    const sow = searchParams.get('sow')
    const tier = searchParams.get('tier')
    const kolCategory = searchParams.get('kolCategory')

    // Build filter conditions
    const campaignFilters: any = {}
    const influencerFilters: any = {}
    const contentFilters: any = {}

    if (year) campaignFilters.year = parseInt(year)
    if (month) campaignFilters.month = parseInt(month)
    if (campaignName) campaignFilters.name = { contains: campaignName }
    if (brandName) {
      campaignFilters.client = {
        name: { contains: brandName }
      }
    }

    if (platform) influencerFilters.platform = platform
    if (tier) influencerFilters.tier = tier
    if (kolCategory) influencerFilters.kolCategory = kolCategory

    if (sow) contentFilters.sow = sow

    // Fetch all content with filters
    const contents = await prisma.buznesiaContent.findMany({
      where: {
        ...contentFilters,
        campaign: campaignFilters,
        influencer: influencerFilters
      },
      include: {
        campaign: {
          include: {
            client: true
          }
        },
        influencer: true
      }
    })

    // Calculate aggregated metrics
    const totalContent = contents.length
    const uniqueInfluencers = new Set(contents.map(c => c.influencerId))
    const uniqueCampaigns = new Set(contents.map(c => c.campaignId))
    const uniqueClients = new Set(contents.map(c => c.campaign.clientId))

    let totalImpressions = 0
    let totalReach = 0
    let totalEngagement = 0
    let totalViews = 0
    let totalCost = 0
    let totalFollowers = 0

    contents.forEach(content => {
      totalImpressions += content.impressions
      totalReach += content.reach
      totalEngagement += content.engagement
      totalViews += content.views
      totalCost += content.cost
      totalFollowers += content.influencer.followers
    })

    const avgImpression = totalContent > 0 ? totalImpressions / totalContent : 0
    const avgReach = totalContent > 0 ? totalReach / totalContent : 0
    const avgEngagement = totalContent > 0 ? totalEngagement / totalContent : 0
    const avgViews = totalContent > 0 ? totalViews / totalContent : 0

    // Calculate rates
    const irRate = totalFollowers > 0 ? totalImpressions / totalFollowers : 0
    const rrRate = totalFollowers > 0 ? totalReach / totalFollowers : 0
    const erRate = totalFollowers > 0 ? totalEngagement / totalFollowers : 0
    const vrRate = totalFollowers > 0 ? totalViews / totalFollowers : 0

    // Calculate cost metrics
    const cpi = totalImpressions > 0 ? totalCost / totalImpressions : 0
    const cpr = totalReach > 0 ? totalCost / totalReach : 0
    const cpe = totalEngagement > 0 ? totalCost / totalEngagement : 0
    const cpv = totalViews > 0 ? totalCost / totalViews : 0

    return NextResponse.json({
      totalInfluencers: uniqueInfluencers.size,
      totalContent,
      totalClients: uniqueClients.size,
      totalCampaigns: uniqueCampaigns.size,
      avgImpression,
      avgReach,
      avgEngagement,
      avgViews,
      irRate,
      rrRate,
      erRate,
      vrRate,
      cpi,
      cpr,
      cpe,
      cpv
    })
  } catch (error) {
    console.error('Error fetching benchmark data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch benchmark data' },
      { status: 500 }
    )
  }
}
