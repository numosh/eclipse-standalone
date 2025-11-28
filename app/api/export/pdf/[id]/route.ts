import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

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
        focusBrand: true,
        competitors: true,
        analysisResult: true
      }
    })

    if (!analysisSession || !analysisSession.analysisResult) {
      return NextResponse.json({ error: 'Analysis not found' }, { status: 404 })
    }

    // Generate PDF
    const doc = new jsPDF()
    let yPosition = 20

    // Title
    doc.setFontSize(20)
    doc.setTextColor(139, 92, 246) // Purple
    doc.text(analysisSession.title, 20, yPosition)
    yPosition += 10

    // Subtitle
    doc.setFontSize(10)
    doc.setTextColor(100, 100, 100)
    doc.text(`Analysis Report - ${new Date(analysisSession.completedAt!).toLocaleDateString()}`, 20, yPosition)
    yPosition += 15

    // Brand Information
    doc.setFontSize(14)
    doc.setTextColor(0, 0, 0)
    doc.text('Brand Information', 20, yPosition)
    yPosition += 7

    doc.setFontSize(10)
    doc.text(`Focus Brand: ${analysisSession.focusBrand?.name || 'N/A'}`, 20, yPosition)
    yPosition += 6

    if (analysisSession.competitors.length > 0) {
      doc.text(`Competitors: ${analysisSession.competitors.map(c => c.name).join(', ')}`, 20, yPosition)
      yPosition += 10
    }

    // Parse ALL analysis results
    const analysis = {
      brandEquity: JSON.parse(analysisSession.analysisResult.brandEquityData),
      audienceComparison: JSON.parse(analysisSession.analysisResult.audienceComparison),
      postChannelData: JSON.parse(analysisSession.analysisResult.postChannelData),
      hashtags: JSON.parse(analysisSession.analysisResult.hashtagAnalysis),
      postTypeEngagement: JSON.parse(analysisSession.analysisResult.postTypeEngagement),
      postTimingData: JSON.parse(analysisSession.analysisResult.postTimingData || '{}'),
      keywordClustering: analysisSession.analysisResult.keywordClustering ? JSON.parse(analysisSession.analysisResult.keywordClustering) : [],
      voiceAnalysis: analysisSession.analysisResult.voiceAnalysis ? JSON.parse(analysisSession.analysisResult.voiceAnalysis) : [],
      aiInsights: analysisSession.analysisResult.aiInsights || '',
      aiKeywordInsights: analysisSession.analysisResult.aiKeywordInsights || '',
      additionalMetrics: JSON.parse(analysisSession.analysisResult.additionalMetrics || '{}')
    }

    // Brand Equity Table
    doc.setFontSize(14)
    doc.text('Brand Equity Comparison', 20, yPosition)
    yPosition += 5

    autoTable(doc, {
      startY: yPosition,
      head: [['Brand', 'Total Followers', 'Avg Engagement', 'Content Velocity', 'Equity Score']],
      body: analysis.brandEquity.map((b: any) => [
        b.brand,
        b.totalFollowers.toLocaleString(),
        `${b.avgEngagement}%`,
        `${b.contentVelocity}`,
        b.equityScore
      ]),
      theme: 'grid',
      headStyles: { fillColor: [139, 92, 246] }
    })

    yPosition = (doc as any).lastAutoTable.finalY + 10

    // Hashtag Analysis
    if (yPosition > 250) {
      doc.addPage()
      yPosition = 20
    }

    doc.setFontSize(14)
    doc.text('Top Hashtags Used', 20, yPosition)
    yPosition += 7

    doc.setFontSize(9)
    analysis.hashtags.forEach((brand: any) => {
      if (yPosition > 270) {
        doc.addPage()
        yPosition = 20
      }

      doc.setFontSize(11)
      doc.text(brand.brand, 20, yPosition)
      yPosition += 5

      doc.setFontSize(9)
      const hashtags = brand.topHashtags.join(', ')
      const lines = doc.splitTextToSize(hashtags || 'No hashtags found', 170)
      doc.text(lines, 20, yPosition)
      yPosition += lines.length * 5 + 5
    })

    // Keyword Clustering Analysis
    if (analysis.keywordClustering && analysis.keywordClustering.length > 0) {
      if (yPosition > 250) {
        doc.addPage()
        yPosition = 20
      }

      doc.setFontSize(14)
      doc.setTextColor(34, 197, 94) // Green
      doc.text('Keyword Clustering & Conversation Analysis', 20, yPosition)
      yPosition += 7

      doc.setFontSize(9)
      doc.setTextColor(0, 0, 0)

      analysis.keywordClustering.forEach((brandKw: any) => {
        if (yPosition > 260) {
          doc.addPage()
          yPosition = 20
        }

        doc.setFontSize(11)
        doc.setTextColor(22, 163, 74) // Green
        doc.text(`${brandKw.brand} - ${brandKw.platform.toUpperCase()}`, 20, yPosition)
        yPosition += 5

        doc.setFontSize(9)
        doc.setTextColor(0, 0, 0)
        doc.text(`${brandKw.totalPosts} posts analyzed • ${brandKw.clusters.length} clusters`, 20, yPosition)
        yPosition += 5

        // Top keywords
        if (brandKw.topKeywords.length > 0) {
          doc.text('Top Keywords:', 20, yPosition)
          yPosition += 4
          const keywords = brandKw.topKeywords.map((kw: any) => `${kw.keyword} (${kw.frequency}x)`).join(', ')
          const kwLines = doc.splitTextToSize(keywords, 165)
          doc.text(kwLines, 25, yPosition)
          yPosition += kwLines.length * 4 + 3
        }

        // Conversation themes
        if (brandKw.conversationThemes.length > 0) {
          doc.text('Themes:', 20, yPosition)
          yPosition += 4
          const themes = brandKw.conversationThemes.join(', ')
          const themeLines = doc.splitTextToSize(themes, 165)
          doc.text(themeLines, 25, yPosition)
          yPosition += themeLines.length * 4 + 5
        }
      })
      yPosition += 5
    }

    // AI Keyword Insights
    if (analysis.aiKeywordInsights) {
      if (yPosition > 250) {
        doc.addPage()
        yPosition = 20
      }

      doc.setFontSize(14)
      doc.setTextColor(147, 51, 234) // Purple
      doc.text('AI Insights: Keyword Analysis', 20, yPosition)
      yPosition += 7

      doc.setFontSize(9)
      doc.setTextColor(0, 0, 0)
      const kwInsightLines = doc.splitTextToSize(analysis.aiKeywordInsights, 170)

      kwInsightLines.forEach((line: string) => {
        if (yPosition > 280) {
          doc.addPage()
          yPosition = 20
        }
        doc.text(line, 20, yPosition)
        yPosition += 5
      })
      yPosition += 5
    }

    // AI Insights
    if (analysis.aiInsights) {
      if (yPosition > 250) {
        doc.addPage()
        yPosition = 20
      }

      doc.setFontSize(14)
      doc.setTextColor(59, 130, 246) // Blue
      doc.text('AI-Generated Strategic Insights', 20, yPosition)
      yPosition += 7

      doc.setFontSize(9)
      doc.setTextColor(0, 0, 0)
      const insightLines = doc.splitTextToSize(analysis.aiInsights, 170)

      insightLines.forEach((line: string) => {
        if (yPosition > 280) {
          doc.addPage()
          yPosition = 20
        }
        doc.text(line, 20, yPosition)
        yPosition += 5
      })
      yPosition += 10
    }

    // Audience Comparison
    if (analysis.audienceComparison && analysis.audienceComparison.length > 0) {
      if (yPosition > 230) {
        doc.addPage()
        yPosition = 20
      }

      doc.setFontSize(14)
      doc.setTextColor(34, 197, 94) // Green
      doc.text('Audience Comparison by Platform', 20, yPosition)
      yPosition += 5

      const audienceTableData = analysis.audienceComparison.map((brand: any) => {
        const row = [brand.brand]
        brand.platforms.forEach((p: any) => {
          row.push(`${p.platform}: ${p.followers.toLocaleString()}`)
        })
        return row
      })

      autoTable(doc, {
        startY: yPosition,
        head: [['Brand', 'Platforms & Followers']],
        body: audienceTableData,
        theme: 'grid',
        headStyles: { fillColor: [34, 197, 94] }
      })

      yPosition = (doc as any).lastAutoTable.finalY + 10
    }

    // Own & Earn Voice Analysis
    if (analysis.voiceAnalysis && analysis.voiceAnalysis.length > 0) {
      if (yPosition > 230) {
        doc.addPage()
        yPosition = 20
      }

      doc.setFontSize(14)
      doc.setTextColor(99, 102, 241) // Indigo
      doc.text('Own & Earn Voice Analysis', 20, yPosition)
      yPosition += 5

      const voiceTableData = analysis.voiceAnalysis.map((voice: any) => [
        voice.brand,
        voice.metrics.ownVoice.totalPosts,
        voice.metrics.earnVoice.totalMentions,
        voice.metrics.voiceRatio.toFixed(2) + 'x',
        voice.metrics.amplificationFactor.toFixed(2) + 'x'
      ])

      autoTable(doc, {
        startY: yPosition,
        head: [['Brand', 'Own Posts', 'Earned Mentions', 'Voice Ratio', 'Amplification']],
        body: voiceTableData,
        theme: 'grid',
        headStyles: { fillColor: [99, 102, 241] }
      })

      yPosition = (doc as any).lastAutoTable.finalY + 10
    }

    // Post Type & Engagement
    if (analysis.postTypeEngagement && analysis.postTypeEngagement.length > 0) {
      if (yPosition > 230) {
        doc.addPage()
        yPosition = 20
      }

      doc.setFontSize(14)
      doc.setTextColor(236, 72, 153) // Pink
      doc.text('Post Type & Engagement Analysis', 20, yPosition)
      yPosition += 7

      analysis.postTypeEngagement.forEach((brand: any) => {
        if (yPosition > 260) {
          doc.addPage()
          yPosition = 20
        }

        doc.setFontSize(11)
        doc.setTextColor(0, 0, 0)
        doc.text(brand.brand, 20, yPosition)
        yPosition += 5

        doc.setFontSize(9)
        brand.postTypes.forEach((pt: any) => {
          doc.text(`  ${pt.type}: ${pt.count} posts, Avg Eng: ${pt.avgEngagement.toLocaleString()}`, 20, yPosition)
          yPosition += 4
        })
        yPosition += 5
      })
    }

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(150, 150, 150)
      doc.text(
        `Eclipse Brand Analysis Platform - Page ${i} of ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      )
    }

    // Generate buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${analysisSession.title}_analysis.pdf"`
      }
    })
  } catch (error) {
    console.error('Error generating PDF:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
