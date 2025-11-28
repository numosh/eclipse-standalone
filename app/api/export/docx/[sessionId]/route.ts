import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle } from 'docx'

export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch the analysis session with all related data
    const analysisSession = await prisma.analysisSession.findUnique({
      where: { id: params.sessionId },
      include: {
        focusBrand: true,
        competitors: true,
        analysisResult: true,
        commentAnalysis: true,
        authorProfiles: {
          include: {
            posts: true
          }
        }
      }
    })

    if (!analysisSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Create document sections
    const children: Paragraph[] = []

    // Title
    children.push(
      new Paragraph({
        text: `Brand Analysis Report: ${analysisSession.title}`,
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 }
      })
    )

    // Session Info
    children.push(
      new Paragraph({
        text: 'Report Information',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 }
      })
    )

    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Generated: ', bold: true }),
          new TextRun(new Date().toLocaleString())
        ],
        spacing: { after: 100 }
      })
    )

    if (analysisSession.focusBrand) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Focus Brand: ', bold: true }),
            new TextRun(analysisSession.focusBrand.name)
          ],
          spacing: { after: 100 }
        })
      )
    }

    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Competitors: ', bold: true }),
          new TextRun(analysisSession.competitors.map(c => c.name).join(', '))
        ],
        spacing: { after: 100 }
      })
    )

    if (analysisSession.universeKeywords) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Universe Keywords: ', bold: true }),
            new TextRun(analysisSession.universeKeywords)
          ],
          spacing: { after: 300 }
        })
      )
    }

    // AI Insights
    if (analysisSession.analysisResult?.aiInsights) {
      children.push(
        new Paragraph({
          text: 'Executive Summary',
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 }
        })
      )

      try {
        const insights = JSON.parse(analysisSession.analysisResult.aiInsights)
        children.push(
          new Paragraph({
            text: insights.summary || 'No summary available',
            spacing: { after: 300 }
          })
        )

        if (insights.recommendations) {
          children.push(
            new Paragraph({
              text: 'Key Recommendations',
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 300, after: 200 }
            })
          )

          children.push(
            new Paragraph({
              text: insights.recommendations,
              spacing: { after: 300 }
            })
          )
        }
      } catch (e) {
        // If JSON parsing fails, treat as plain text
        children.push(
          new Paragraph({
            text: analysisSession.analysisResult.aiInsights,
            spacing: { after: 300 }
          })
        )
      }
    }

    // Audience Comparison
    if (analysisSession.analysisResult?.audienceComparison) {
      children.push(
        new Paragraph({
          text: 'Audience Comparison',
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 }
        })
      )

      try {
        const audienceData = JSON.parse(analysisSession.analysisResult.audienceComparison)
        audienceData.forEach((brand: any) => {
        children.push(
          new Paragraph({
            text: brand.brand,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 }
          })
        )

        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'Total Followers: ', bold: true }),
              new TextRun(brand.totalFollowers.toLocaleString())
            ],
            spacing: { after: 50 }
          })
        )

        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'Total Posts: ', bold: true }),
              new TextRun(brand.totalPosts.toLocaleString())
            ],
            spacing: { after: 50 }
          })
        )

        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'Avg Engagement Rate: ', bold: true }),
              new TextRun(`${brand.avgEngagement.toFixed(2)}%`)
            ],
            spacing: { after: 200 }
          })
        )
        })
      } catch (e) {
        // If JSON parsing fails, skip audience comparison
        console.error('Failed to parse audience comparison:', e)
      }
    }

    // Conversation Analysis
    if (analysisSession.commentAnalysis) {
      children.push(
        new Paragraph({
          text: 'Audience Conversation Analysis',
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 }
        })
      )

      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Total Posts Analyzed: ', bold: true }),
            new TextRun(analysisSession.commentAnalysis.totalComments.toString())
          ],
          spacing: { after: 100 }
        })
      )

      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Positive Sentiment: ', bold: true }),
            new TextRun(`${analysisSession.commentAnalysis.positiveCount} (${((analysisSession.commentAnalysis.positiveCount / analysisSession.commentAnalysis.totalComments) * 100).toFixed(1)}%)`)
          ],
          spacing: { after: 50 }
        })
      )

      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Neutral Sentiment: ', bold: true }),
            new TextRun(`${analysisSession.commentAnalysis.neutralCount} (${((analysisSession.commentAnalysis.neutralCount / analysisSession.commentAnalysis.totalComments) * 100).toFixed(1)}%)`)
          ],
          spacing: { after: 50 }
        })
      )

      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Negative Sentiment: ', bold: true }),
            new TextRun(`${analysisSession.commentAnalysis.negativeCount} (${((analysisSession.commentAnalysis.negativeCount / analysisSession.commentAnalysis.totalComments) * 100).toFixed(1)}%)`)
          ],
          spacing: { after: 200 }
        })
      )

      if (analysisSession.commentAnalysis.aiSummary) {
        children.push(
          new Paragraph({
            text: 'AI Summary',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 }
          })
        )

        children.push(
          new Paragraph({
            text: analysisSession.commentAnalysis.aiSummary,
            spacing: { after: 200 }
          })
        )
      }

      if (analysisSession.commentAnalysis.aiRecommendations) {
        children.push(
          new Paragraph({
            text: 'Recommendations',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 }
          })
        )

        children.push(
          new Paragraph({
            text: analysisSession.commentAnalysis.aiRecommendations,
            spacing: { after: 300 }
          })
        )
      }
    }

    // Author Profiles
    if (analysisSession.authorProfiles && analysisSession.authorProfiles.length > 0) {
      children.push(
        new Paragraph({
          text: 'Top Audience Profiles',
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 }
        })
      )

      analysisSession.authorProfiles.slice(0, 10).forEach((author) => {
        children.push(
          new Paragraph({
            text: `@${author.username}${author.displayName ? ` (${author.displayName})` : ''}`,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 }
          })
        )

        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'Platform: ', bold: true }),
              new TextRun(author.platform.toUpperCase())
            ],
            spacing: { after: 50 }
          })
        )

        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'Followers: ', bold: true }),
              new TextRun(author.followers.toLocaleString())
            ],
            spacing: { after: 50 }
          })
        )

        if (author.verified) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: 'Verified: ', bold: true }),
                new TextRun('✓')
              ],
              spacing: { after: 50 }
            })
          )
        }

        if (author.engagementRate) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: 'Engagement Rate: ', bold: true }),
                new TextRun(`${author.engagementRate.toFixed(2)}%`)
              ],
              spacing: { after: 50 }
            })
          )
        }

        if (author.categories) {
          try {
            const categorization = JSON.parse(author.categories)
            if (categorization.topics && Array.isArray(categorization.topics)) {
              children.push(
                new Paragraph({
                  children: [
                    new TextRun({ text: 'Topics: ', bold: true }),
                    new TextRun(categorization.topics.join(', '))
                  ],
                  spacing: { after: 50 }
                })
              )
            }
          } catch (e) {
            // Invalid JSON, skip
          }
        }

        children.push(
          new Paragraph({
            text: '',
            spacing: { after: 150 }
          })
        )
      })
    }

    // Create document
    const doc = new Document({
      sections: [{
        properties: {},
        children
      }]
    })

    // Generate buffer
    const buffer = await Packer.toBuffer(doc)

    // Return as downloadable file
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="Brand_Analysis_${analysisSession.title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.docx"`
      }
    })
  } catch (error) {
    console.error('Error generating DOCX:', error)
    return NextResponse.json({ error: 'Failed to generate export' }, { status: 500 })
  }
}
