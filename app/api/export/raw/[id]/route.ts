import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const analysisSession = await prisma.analysisSession.findFirst({
      where: {
        id: params.id,
        userId: (session.user as any).id
      },
      include: {
        focusBrand: {
          include: {
            brandData: true
          }
        },
        competitors: {
          include: {
            brandData: true
          }
        },
        analysisResult: true
      }
    })

    if (!analysisSession) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 })
    }

    // Prepare comprehensive raw data export
    const exportData = {
      session: {
        id: analysisSession.id,
        title: analysisSession.title,
        status: analysisSession.status,
        createdAt: analysisSession.createdAt,
        completedAt: analysisSession.completedAt
      },
      focusBrand: {
        ...analysisSession.focusBrand,
        brandData: analysisSession.focusBrand?.brandData.map(bd => ({
          platform: bd.platform,
          followerCount: bd.followerCount,
          postCount: bd.postCount,
          engagementRate: bd.engagementRate,
          avgPostPerDay: bd.avgPostPerDay,
          rawData: JSON.parse(bd.rawData),
          scrapedData: bd.scrapedData ? JSON.parse(bd.scrapedData) : null
        }))
      },
      competitors: analysisSession.competitors.map(comp => ({
        ...comp,
        brandData: comp.brandData.map(bd => ({
          platform: bd.platform,
          followerCount: bd.followerCount,
          postCount: bd.postCount,
          engagementRate: bd.engagementRate,
          avgPostPerDay: bd.avgPostPerDay,
          rawData: JSON.parse(bd.rawData),
          scrapedData: bd.scrapedData ? JSON.parse(bd.scrapedData) : null
        }))
      })),
      analysisResults: analysisSession.analysisResult ? {
        audienceComparison: JSON.parse(analysisSession.analysisResult.audienceComparison),
        postChannelData: JSON.parse(analysisSession.analysisResult.postChannelData),
        hashtagAnalysis: JSON.parse(analysisSession.analysisResult.hashtagAnalysis),
        postTypeEngagement: JSON.parse(analysisSession.analysisResult.postTypeEngagement),
        postTimingData: JSON.parse(analysisSession.analysisResult.postTimingData),
        brandEquityData: JSON.parse(analysisSession.analysisResult.brandEquityData),
        keywordClustering: analysisSession.analysisResult.keywordClustering ? JSON.parse(analysisSession.analysisResult.keywordClustering) : [],
        aiInsights: analysisSession.analysisResult.aiInsights,
        aiKeywordInsights: analysisSession.analysisResult.aiKeywordInsights,
        additionalMetrics: analysisSession.analysisResult.additionalMetrics ? JSON.parse(analysisSession.analysisResult.additionalMetrics) : null
      } : null
    }

    const jsonString = JSON.stringify(exportData, null, 2)

    return new NextResponse(jsonString, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${analysisSession.title}_raw_data.json"`
      }
    })
  } catch (error) {
    console.error('Error exporting raw data:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
