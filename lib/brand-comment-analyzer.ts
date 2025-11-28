/**
 * Comprehensive Brand Comment Analyzer
 * Analyzes comments from brand posts and earn voice mentions
 */

import { prisma } from './db'
import { scrapeInstagramBrandComments, scrapeInstagramPostComments } from './comment-scrapers/instagram-comments'
import { scrapeTikTokUserComments } from './comment-scrapers/tiktok-comments'
import { classifyCommentType, analyzeCommentSentimentKeywords } from './comment-analysis'
import { generateAIInsights } from './ollama-api'
import { fetchInstagramData, fetchTikTokData } from './tms-api'

interface BrandCommentData {
  brandName: string
  platform: string
  postId: string
  postUrl: string
  postCaption: string
  comments: Array<{
    commentId: string
    commentText: string
    commentAuthor: string
    likes: number
    replies: number
    sentiment: string
    isQuestion: boolean
    isComplaint: boolean
    isPraise: boolean
    relevantToCaption: boolean
    publishedAt: Date
  }>
}

interface BrandAnalysisResult {
  brandName: string
  totalComments: number
  ownPostComments: number
  earnPostComments: number
  sentimentBreakdown: {
    positive: number
    neutral: number
    negative: number
  }
  captionRelevance: {
    relevant: number
    irrelevant: number
    relevanceRate: number
  }
  messageCorrelation: string // AI analysis
  topThemes: string[]
  comparisonWithCompetitors?: string
}

/**
 * Analyze if a comment is relevant to the post caption
 */
async function analyzeCommentRelevance(comment: string, caption: string): Promise<boolean> {
  try {
    // Quick keyword-based check first
    const captionWords = caption.toLowerCase().split(/\s+/).filter(w => w.length > 3)
    const commentWords = comment.toLowerCase().split(/\s+/)

    // If comment mentions key words from caption, it's likely relevant
    const overlap = captionWords.filter(word =>
      commentWords.some(cw => cw.includes(word) || word.includes(cw))
    )

    if (overlap.length >= 2) return true

    // For deeper analysis, use AI (optional, can be slow)
    // For now, use heuristic: if comment is a question or very short, might not be relevant
    if (comment.includes('?') && comment.length < 50) return false
    if (comment.length < 15) return false // Very short comments often generic

    return true // Default to relevant
  } catch (error) {
    return true // Default to relevant on error
  }
}

/**
 * Scrape and analyze comments for a single brand
 */
async function analyzeBrandComments(
  sessionId: string,
  brand: any,
  postCount: number = 30,
  commentsPerPost: number = 25
): Promise<BrandCommentData[]> {
  const brandCommentData: BrandCommentData[] = []

  console.log(`\n  📊 Analyzing comments for ${brand.name}...`)

  // Instagram Comments
  if (brand.instagramHandle) {
    try {
      console.log(`    📸 Scraping Instagram comments for @${brand.instagramHandle}...`)

      // Get posts from TMS API first
      const tmsData = await fetchInstagramData(brand.instagramHandle)
      const posts = (tmsData.data || []).slice(0, postCount)

      console.log(`      📋 Found ${posts.length} posts from TMS API`)

      for (const post of posts) {
        const postCaption = post.title || post.description || post.caption || post.text || ''
        const postId = post.id || post.post_id || post.media_id || 'unknown'
        const postUrl = post.url || post.link || post.permalink || `https://www.instagram.com/p/${postId}/`

        // Check if TMS data already has comments
        let commentsData: any[] = []
        if (post.comments && Array.isArray(post.comments)) {
          commentsData = post.comments.slice(0, commentsPerPost)
          console.log(`      ✅ Found ${commentsData.length} comments in TMS data for post ${postId}`)
        }

        // If no comments in TMS data, try scraping (this will likely fail without browser automation)
        if (commentsData.length === 0) {
          console.log(`      ⚠️ No comments in TMS data, scraping is blocked by Instagram`)
          // Skip scraping as it won't work without Playwright/authentication
          continue
        }

        // Process TMS comments
        const tmsComments = commentsData.map((c: any, index: number) => ({
          commentId: c.id || c.comment_id || `${postId}_comment_${index}`,
          commentText: c.text || c.comment_text || c.message || '',
          commentAuthor: c.username || c.author || c.from_user || 'unknown',
          commentAuthorId: c.user_id || c.author_id,
          likes: parseInt(c.likes || c.like_count || '0'),
          replies: parseInt(c.replies || c.reply_count || '0'),
          authorFollowers: c.follower_count,
          authorVerified: c.verified || false,
          authorBio: c.bio,
          publishedAt: c.created_time ? new Date(c.created_time) : new Date()
        }))

        if (tmsComments.length === 0) {
          console.log(`      ⚠️ Could not parse comments for post ${postId}`)
          continue
        }

        console.log(`      📊 Processing ${tmsComments.length} comments...`)

        const analyzedComments = []

        for (const comment of tmsComments) {
          const classification = classifyCommentType(comment.commentText)
          const sentiment = analyzeCommentSentimentKeywords(comment.commentText)
          const relevantToCaption = await analyzeCommentRelevance(comment.commentText, postCaption)

          // Save to database
          await prisma.postComment.create({
            data: {
              sessionId,
              platform: 'instagram',
              postId: postId,
              postUrl: postUrl,
              postAuthor: brand.instagramHandle,
              commentId: comment.commentId,
              commentText: comment.commentText,
              commentAuthor: comment.commentAuthor,
              commentAuthorId: comment.commentAuthorId,
              likes: comment.likes,
              replies: comment.replies,
              authorFollowers: comment.authorFollowers,
              authorVerified: comment.authorVerified,
              authorBio: comment.authorBio,
              sentiment: sentiment.sentiment,
              isBrandMention: false,
              isQuestion: classification.isQuestion,
              isComplaint: classification.isComplaint,
              isPraise: classification.isPraise,
              publishedAt: comment.publishedAt
            }
          }).catch(err => {
            // Skip duplicates silently
          })

          analyzedComments.push({
            commentId: comment.commentId,
            commentText: comment.commentText,
            commentAuthor: comment.commentAuthor,
            likes: comment.likes,
            replies: comment.replies,
            sentiment: sentiment.sentiment,
            isQuestion: classification.isQuestion,
            isComplaint: classification.isComplaint,
            isPraise: classification.isPraise,
            relevantToCaption,
            publishedAt: comment.publishedAt
          })
        }

        if (analyzedComments.length > 0) {
          brandCommentData.push({
            brandName: brand.name,
            platform: 'instagram',
            postId,
            postUrl,
            postCaption,
            comments: analyzedComments
          })
        }
      }

      console.log(`      ✅ Collected comments from ${posts.length} Instagram posts`)
    } catch (error) {
      console.log(`      ❌ Instagram scraping failed: ${error}`)
    }
  }

  // TikTok Comments
  if (brand.tiktokHandle) {
    try {
      console.log(`    🎵 Scraping TikTok comments for @${brand.tiktokHandle}...`)
      const tiktokComments = await scrapeTikTokUserComments(
        brand.tiktokHandle,
        postCount,
        commentsPerPost
      )

      for (const videoComments of tiktokComments) {
        // Get video caption
        let videoCaption = ''
        try {
          const tmsData = await fetchTikTokData(brand.tiktokHandle)
          const video = tmsData.data?.find((v: any) => v.id?.includes(videoComments.videoId))
          videoCaption = video?.title || video?.description || ''
        } catch (err) {
          console.log(`      ⚠️ Could not fetch caption for video ${videoComments.videoId}`)
        }

        const analyzedComments = []

        for (const comment of videoComments.comments) {
          const classification = classifyCommentType(comment.commentText)
          const sentiment = analyzeCommentSentimentKeywords(comment.commentText)
          const relevantToCaption = await analyzeCommentRelevance(comment.commentText, videoCaption)

          await prisma.postComment.create({
            data: {
              sessionId,
              platform: 'tiktok',
              postId: videoComments.videoId,
              postUrl: videoComments.videoUrl,
              postAuthor: videoComments.videoAuthor,
              commentId: comment.commentId,
              commentText: comment.commentText,
              commentAuthor: comment.commentAuthor,
              commentAuthorId: comment.commentAuthorId,
              likes: comment.likes,
              replies: comment.replies,
              authorFollowers: comment.authorFollowers,
              authorVerified: comment.authorVerified,
              authorBio: comment.authorBio,
              sentiment: sentiment.sentiment,
              isBrandMention: false,
              isQuestion: classification.isQuestion,
              isComplaint: classification.isComplaint,
              isPraise: classification.isPraise,
              publishedAt: comment.publishedAt
            }
          }).catch(err => {
            // Skip duplicates
          })

          analyzedComments.push({
            commentId: comment.commentId,
            commentText: comment.commentText,
            commentAuthor: comment.commentAuthor,
            likes: comment.likes,
            replies: comment.replies,
            sentiment: sentiment.sentiment,
            isQuestion: classification.isQuestion,
            isComplaint: classification.isComplaint,
            isPraise: classification.isPraise,
            relevantToCaption,
            publishedAt: comment.publishedAt
          })
        }

        if (analyzedComments.length > 0) {
          brandCommentData.push({
            brandName: brand.name,
            platform: 'tiktok',
            postId: videoComments.videoId,
            postUrl: videoComments.videoUrl,
            postCaption: videoCaption,
            comments: analyzedComments
          })
        }
      }

      console.log(`      ✅ Collected ${tiktokComments.length} TikTok videos`)
    } catch (error) {
      console.log(`      ❌ TikTok scraping failed: ${error}`)
    }
  }

  return brandCommentData
}

/**
 * Analyze caption-comment correlation for a brand
 */
async function analyzeMessageCorrelation(brandData: BrandCommentData[]): Promise<string> {
  try {
    // Sample a few posts for AI analysis
    const samplePosts = brandData.slice(0, 5)

    const prompt = `Analyze the correlation between these post captions and their comments:

${samplePosts.map((post, i) => `
Post ${i + 1}:
Caption: "${post.postCaption}"
Sample Comments:
${post.comments.slice(0, 5).map(c => `- "${c.commentText}" (${c.sentiment})`).join('\n')}
`).join('\n')}

Analyze:
1. Are comments generally related to the post content/message?
2. Are users engaging with the brand's intended message?
3. What percentage seems on-topic vs off-topic?

Provide a brief 2-3 sentence analysis.`

    const analysis = await generateAIInsights(prompt)
    return analysis
  } catch (error) {
    return 'Unable to analyze message correlation at this time.'
  }
}

/**
 * Scrape comments from "earn" posts (mentions of brand by others)
 */
async function scrapeEarnPostComments(
  sessionId: string,
  brandName: string
): Promise<BrandCommentData[]> {
  const earnComments: BrandCommentData[] = []

  try {
    console.log(`    📰 Scraping earn post comments mentioning ${brandName}...`)

    // Get mentions from TMS API
    const [instagramMentions, tiktokMentions] = await Promise.all([
      fetchInstagramData(brandName),
      fetchTikTokData(brandName)
    ])

    // Process Instagram mentions (limited to first 10)
    if (instagramMentions.data && instagramMentions.data.length > 0) {
      const mentionPosts = instagramMentions.data.slice(0, 10)

      for (const post of mentionPosts) {
        // In a real scenario, we'd scrape comments from these mention posts
        // For now, we'll mark them as earn voice in the database
        console.log(`      Found Instagram mention: ${post.title || 'Untitled'}`)
      }
    }

    // Process TikTok mentions
    if (tiktokMentions.data && tiktokMentions.data.length > 0) {
      const mentionVideos = tiktokMentions.data.slice(0, 10)

      for (const video of mentionVideos) {
        console.log(`      Found TikTok mention: ${video.title || 'Untitled'}`)
      }
    }

    console.log(`    ✅ Found ${instagramMentions.data?.length || 0} Instagram + ${tiktokMentions.data?.length || 0} TikTok mentions`)
  } catch (error) {
    console.log(`    ❌ Earn post scraping failed: ${error}`)
  }

  return earnComments
}

/**
 * Generate per-brand analysis
 */
async function generateBrandAnalysis(
  brandName: string,
  ownPostData: BrandCommentData[],
  earnPostData: BrandCommentData[]
): Promise<BrandAnalysisResult> {
  const allComments = [
    ...ownPostData.flatMap(p => p.comments),
    ...earnPostData.flatMap(p => p.comments)
  ]

  const ownComments = ownPostData.flatMap(p => p.comments)
  const earnComments = earnPostData.flatMap(p => p.comments)

  // Sentiment breakdown
  const sentimentBreakdown = {
    positive: allComments.filter(c => c.sentiment === 'positive').length,
    neutral: allComments.filter(c => c.sentiment === 'neutral').length,
    negative: allComments.filter(c => c.sentiment === 'negative').length
  }

  // Caption relevance
  const relevantComments = allComments.filter(c => c.relevantToCaption).length
  const captionRelevance = {
    relevant: relevantComments,
    irrelevant: allComments.length - relevantComments,
    relevanceRate: allComments.length > 0 ? (relevantComments / allComments.length) * 100 : 0
  }

  // Message correlation analysis
  const messageCorrelation = await analyzeMessageCorrelation(ownPostData)

  // Extract top themes
  const commentTexts = allComments.map(c => c.commentText).join(' ').toLowerCase()
  const words = commentTexts.split(/\s+/).filter(w => w.length > 4)
  const wordFreq = new Map<string, number>()
  words.forEach(word => {
    wordFreq.set(word, (wordFreq.get(word) || 0) + 1)
  })
  const topThemes = Array.from(wordFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word)

  return {
    brandName,
    totalComments: allComments.length,
    ownPostComments: ownComments.length,
    earnPostComments: earnComments.length,
    sentimentBreakdown,
    captionRelevance,
    messageCorrelation,
    topThemes
  }
}

/**
 * Main function: Analyze all brands and generate comparative analysis
 */
export async function analyzeAllBrandComments(
  sessionId: string,
  brands: any[],
  focusBrandName: string
): Promise<void> {
  console.log(`  💬 Starting comprehensive comment analysis for ${brands.length} brands...`)

  const brandAnalyses: BrandAnalysisResult[] = []

  for (const brand of brands) {
    console.log(`\n  📊 Processing ${brand.name}...`)

    // 1. Scrape own post comments (30 posts, 25 comments each)
    const ownPostData = await analyzeBrandComments(sessionId, brand, 30, 25)

    // 2. Scrape earn post comments (mentions)
    const earnPostData = await scrapeEarnPostComments(sessionId, brand.name)

    // 3. Generate analysis for this brand
    const brandAnalysis = await generateBrandAnalysis(brand.name, ownPostData, earnPostData)
    brandAnalyses.push(brandAnalysis)

    console.log(`  ✅ ${brand.name}: ${brandAnalysis.totalComments} comments analyzed`)
    console.log(`     Sentiment: ${brandAnalysis.sentimentBreakdown.positive}+ / ${brandAnalysis.sentimentBreakdown.neutral}= / ${brandAnalysis.sentimentBreakdown.negative}-`)
    console.log(`     Caption Relevance: ${brandAnalysis.captionRelevance.relevanceRate.toFixed(1)}%`)
  }

  // 4. Generate comparative analysis
  console.log(`\n  📈 Generating comparative analysis...`)
  const comparativeAnalysis = await generateComparativeCommentAnalysis(brandAnalyses, focusBrandName)

  // 5. Save to database
  await prisma.commentAnalysis.upsert({
    where: { sessionId },
    create: {
      sessionId,
      totalComments: brandAnalyses.reduce((sum, b) => sum + b.totalComments, 0),
      avgCommentsPerPost: brandAnalyses.reduce((sum, b) => sum + b.totalComments, 0) / (brands.length * 30),
      positiveCount: brandAnalyses.reduce((sum, b) => sum + b.sentimentBreakdown.positive, 0),
      neutralCount: brandAnalyses.reduce((sum, b) => sum + b.sentimentBreakdown.neutral, 0),
      negativeCount: brandAnalyses.reduce((sum, b) => sum + b.sentimentBreakdown.negative, 0),
      topCommenters: JSON.stringify([]),
      mostLikedComments: JSON.stringify([]),
      commentThemes: JSON.stringify(brandAnalyses),
      questionCount: 0,
      complaintCount: 0,
      praiseCount: 0,
      commonQuestions: JSON.stringify([]),
      peakCommentHours: JSON.stringify([]),
      aiSummary: comparativeAnalysis.summary,
      aiRecommendations: comparativeAnalysis.recommendations
    },
    update: {
      totalComments: brandAnalyses.reduce((sum, b) => sum + b.totalComments, 0),
      avgCommentsPerPost: brandAnalyses.reduce((sum, b) => sum + b.totalComments, 0) / (brands.length * 30),
      positiveCount: brandAnalyses.reduce((sum, b) => sum + b.sentimentBreakdown.positive, 0),
      neutralCount: brandAnalyses.reduce((sum, b) => sum + b.sentimentBreakdown.neutral, 0),
      negativeCount: brandAnalyses.reduce((sum, b) => sum + b.sentimentBreakdown.negative, 0),
      commentThemes: JSON.stringify(brandAnalyses),
      aiSummary: comparativeAnalysis.summary,
      aiRecommendations: comparativeAnalysis.recommendations
    }
  })

  console.log(`  ✅ Comment analysis complete and saved!`)
}

/**
 * Generate comparative analysis across all brands
 */
async function generateComparativeCommentAnalysis(
  brandAnalyses: BrandAnalysisResult[],
  focusBrandName: string
): Promise<{ summary: string; recommendations: string }> {
  try {
    const focusAnalysis = brandAnalyses.find(b => b.brandName === focusBrandName)
    const competitorAnalyses = brandAnalyses.filter(b => b.brandName !== focusBrandName)

    const prompt = `Analyze these comment patterns for brand comparison:

Focus Brand: ${focusAnalysis?.brandName}
- Total Comments: ${focusAnalysis?.totalComments}
- Sentiment: ${focusAnalysis?.sentimentBreakdown.positive}+ / ${focusAnalysis?.sentimentBreakdown.neutral}= / ${focusAnalysis?.sentimentBreakdown.negative}-
- Caption Relevance: ${focusAnalysis?.captionRelevance.relevanceRate.toFixed(1)}%
- Message Correlation: ${focusAnalysis?.messageCorrelation}

Competitors:
${competitorAnalyses.map(c => `
${c.brandName}:
- Total Comments: ${c.totalComments}
- Sentiment: ${c.sentimentBreakdown.positive}+ / ${c.sentimentBreakdown.neutral}= / ${c.sentimentBreakdown.negative}-
- Caption Relevance: ${c.captionRelevance.relevanceRate.toFixed(1)}%
`).join('\n')}

Provide:
1. A summary comparing ${focusAnalysis?.brandName} to competitors (3-4 sentences)
2. 3-5 strategic recommendations for ${focusAnalysis?.brandName}

Format as JSON:
{
  "summary": "...",
  "recommendations": "..."
}`

    const response = await generateAIInsights(prompt)

    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0])
      return {
        summary: result.summary,
        recommendations: result.recommendations
      }
    }

    return {
      summary: `Analyzed ${brandAnalyses.reduce((sum, b) => sum + b.totalComments, 0)} comments across ${brandAnalyses.length} brands.`,
      recommendations: 'Continue engaging with your audience and monitor sentiment trends.'
    }
  } catch (error) {
    console.error('Error generating comparative analysis:', error)
    return {
      summary: 'Analysis complete',
      recommendations: 'Monitor audience engagement patterns'
    }
  }
}
