/**
 * Post Content Analyzer
 * Analyzes post content (titles/descriptions/captions) from social media posts
 * Similar to AUDIENCE-PSICOGRAPH's Agent5 approach
 */

import { prisma } from './db'
import { fetchInstagramData, fetchTikTokData } from './tms-api'
import { analyzeCommentSentimentKeywords } from './comment-analysis'
import { generateAIInsights } from './ollama-api'

interface PostContent {
  brandName: string
  platform: string
  postId: string
  postUrl: string
  content: string
  author: string
  publishedAt: Date
  likeCount: number
  commentCount: number
}

interface BrandConversationAnalysis {
  brandName: string
  totalPosts: number
  ownPosts: number
  earnPosts: number
  sentimentBreakdown: {
    positive: number
    neutral: number
    negative: number
  }
  topThemes: string[]
  topHashtags: string[]
  topMentions: string[]
  engagementMetrics: {
    avgLikes: number
    avgComments: number
    totalLikes: number
    totalComments: number
  }
  conversationSummary: string
}

/**
 * Extract hashtags from text
 */
function extractHashtags(text: string): string[] {
  const hashtagRegex = /#[\w\u00C0-\u024F]+/g
  const matches = text.match(hashtagRegex) || []
  return matches.map(tag => tag.toLowerCase())
}

/**
 * Extract mentions from text
 */
function extractMentions(text: string): string[] {
  const mentionRegex = /@[\w\.]+/g
  const matches = text.match(mentionRegex) || []
  return matches.map(mention => mention.toLowerCase())
}

/**
 * Extract keywords from text (simple word frequency approach)
 */
function extractKeywords(text: string, minLength: number = 4): string[] {
  // Common stop words in English and Indonesian
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'yang', 'dan', 'di', 'ke', 'dari', 'untuk', 'pada', 'dengan', 'ini', 'itu', 'adalah',
    'akan', 'telah', 'sudah', 'bisa', 'dapat', 'kita', 'kami', 'mereka', 'anda', 'nya'
  ])

  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length >= minLength && !stopWords.has(word))

  return words
}

/**
 * Analyze post content for a single brand
 */
async function analyzeBrandPosts(
  sessionId: string,
  brand: any,
  maxPosts: number = 100
): Promise<{ ownPosts: PostContent[], earnPosts: PostContent[] }> {
  const ownPosts: PostContent[] = []
  const earnPosts: PostContent[] = []

  console.log(`\n  📊 Analyzing post content for ${brand.name}...`)

  // Fetch Instagram posts
  if (brand.instagramHandle) {
    try {
      console.log(`    📸 Fetching Instagram posts for @${brand.instagramHandle}...`)
      const tmsData = await fetchInstagramData(brand.instagramHandle)
      const posts = (tmsData.data || []).slice(0, maxPosts)

      console.log(`      📋 Found ${posts.length} Instagram posts`)

      for (const post of posts) {
        const content = post.title || post.description || post.caption || post.text || ''
        const author = post.author || brand.instagramHandle
        const isOwnPost = author.toLowerCase() === brand.instagramHandle.toLowerCase()

        const postContent: PostContent = {
          brandName: brand.name,
          platform: 'instagram',
          postId: post.id || post.post_id || post.media_id || 'unknown',
          postUrl: post.url || post.link || post.permalink || '',
          content,
          author,
          publishedAt: post.published_at ? new Date(post.published_at) : new Date(),
          likeCount: parseInt(post.like_count || '0'),
          commentCount: parseInt(post.comment_count || '0')
        }

        if (isOwnPost) {
          ownPosts.push(postContent)
        } else {
          earnPosts.push(postContent)
        }
      }

      console.log(`      ✅ Own posts: ${ownPosts.length}, Earn posts: ${earnPosts.length}`)
    } catch (error) {
      console.log(`      ❌ Instagram fetch failed: ${error}`)
    }
  }

  // Fetch TikTok posts
  if (brand.tiktokHandle) {
    try {
      console.log(`    🎵 Fetching TikTok posts for @${brand.tiktokHandle}...`)
      const tmsData = await fetchTikTokData(brand.tiktokHandle)
      const posts = (tmsData.data || []).slice(0, maxPosts)

      console.log(`      📋 Found ${posts.length} TikTok posts`)

      for (const post of posts) {
        const content = post.title || post.description || post.text || ''
        const author = post.author || brand.tiktokHandle
        const isOwnPost = author.toLowerCase() === brand.tiktokHandle.toLowerCase()

        const postContent: PostContent = {
          brandName: brand.name,
          platform: 'tiktok',
          postId: post.id || post.video_id || 'unknown',
          postUrl: post.url || post.link || '',
          content,
          author,
          publishedAt: post.published_at ? new Date(post.published_at) : new Date(),
          likeCount: parseInt(post.like_count || post.digg_count || '0'),
          commentCount: parseInt(post.comment_count || '0')
        }

        if (isOwnPost) {
          ownPosts.push(postContent)
        } else {
          earnPosts.push(postContent)
        }
      }

      console.log(`      ✅ Own posts: ${ownPosts.length}, Earn posts: ${earnPosts.length}`)
    } catch (error) {
      console.log(`      ❌ TikTok fetch failed: ${error}`)
    }
  }

  return { ownPosts, earnPosts }
}

/**
 * Generate conversation analysis for a brand
 */
async function generateBrandConversationAnalysis(
  brandName: string,
  ownPosts: PostContent[],
  earnPosts: PostContent[]
): Promise<BrandConversationAnalysis> {
  const allPosts = [...ownPosts, ...earnPosts]

  // Sentiment analysis
  const sentimentBreakdown = {
    positive: 0,
    neutral: 0,
    negative: 0
  }

  const allHashtags: string[] = []
  const allMentions: string[] = []
  const allKeywords: string[] = []

  let totalLikes = 0
  let totalComments = 0

  for (const post of allPosts) {
    // Analyze sentiment
    const sentiment = analyzeCommentSentimentKeywords(post.content)
    if (sentiment.sentiment === 'positive') sentimentBreakdown.positive++
    else if (sentiment.sentiment === 'negative') sentimentBreakdown.negative++
    else sentimentBreakdown.neutral++

    // Extract hashtags and mentions
    allHashtags.push(...extractHashtags(post.content))
    allMentions.push(...extractMentions(post.content))
    allKeywords.push(...extractKeywords(post.content))

    // Engagement metrics
    totalLikes += post.likeCount
    totalComments += post.commentCount
  }

  // Get top themes (most frequent keywords)
  const keywordFreq = new Map<string, number>()
  allKeywords.forEach(keyword => {
    keywordFreq.set(keyword, (keywordFreq.get(keyword) || 0) + 1)
  })
  const topThemes = Array.from(keywordFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word)

  // Get top hashtags
  const hashtagFreq = new Map<string, number>()
  allHashtags.forEach(hashtag => {
    hashtagFreq.set(hashtag, (hashtagFreq.get(hashtag) || 0) + 1)
  })
  const topHashtags = Array.from(hashtagFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag]) => tag)

  // Get top mentions
  const mentionFreq = new Map<string, number>()
  allMentions.forEach(mention => {
    mentionFreq.set(mention, (mentionFreq.get(mention) || 0) + 1)
  })
  const topMentions = Array.from(mentionFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([mention]) => mention)

  // Generate AI summary
  const conversationSummary = await generateConversationSummary(
    brandName,
    allPosts,
    topThemes,
    topHashtags,
    sentimentBreakdown
  )

  return {
    brandName,
    totalPosts: allPosts.length,
    ownPosts: ownPosts.length,
    earnPosts: earnPosts.length,
    sentimentBreakdown,
    topThemes,
    topHashtags,
    topMentions,
    engagementMetrics: {
      avgLikes: allPosts.length > 0 ? totalLikes / allPosts.length : 0,
      avgComments: allPosts.length > 0 ? totalComments / allPosts.length : 0,
      totalLikes,
      totalComments
    },
    conversationSummary
  }
}

/**
 * Generate AI summary of conversation themes
 */
async function generateConversationSummary(
  brandName: string,
  posts: PostContent[],
  topThemes: string[],
  topHashtags: string[],
  sentiment: { positive: number; neutral: number; negative: number }
): Promise<string> {
  try {
    const samplePosts = posts.slice(0, 10).map(p => p.content).join('\n')

    const prompt = `Analyze the conversation themes for ${brandName} based on these social media posts:

Sample Posts:
${samplePosts}

Top Themes: ${topThemes.join(', ')}
Top Hashtags: ${topHashtags.join(', ')}
Sentiment: ${sentiment.positive} positive, ${sentiment.neutral} neutral, ${sentiment.negative} negative

Provide a brief 3-4 sentence summary of:
1. What is the brand talking about?
2. What are the main conversation themes?
3. What is the overall tone and messaging strategy?`

    const summary = await generateAIInsights(prompt)
    return summary
  } catch (error) {
    console.error('Error generating conversation summary:', error)
    return `Analyzed ${posts.length} posts from ${brandName}. Top themes include: ${topThemes.slice(0, 5).join(', ')}.`
  }
}

/**
 * Main function: Analyze all brands' post content
 */
export async function analyzeAllBrandConversations(
  sessionId: string,
  brands: any[],
  focusBrandName: string
): Promise<void> {
  console.log(`  💬 Starting post content analysis for ${brands.length} brands...`)

  const brandAnalyses: BrandConversationAnalysis[] = []

  for (const brand of brands) {
    console.log(`\n  📊 Processing ${brand.name}...`)

    // Fetch and analyze posts
    const { ownPosts, earnPosts } = await analyzeBrandPosts(sessionId, brand, 100)

    // Generate analysis
    const brandAnalysis = await generateBrandConversationAnalysis(
      brand.name,
      ownPosts,
      earnPosts
    )
    brandAnalyses.push(brandAnalysis)

    console.log(`  ✅ ${brand.name}: ${brandAnalysis.totalPosts} posts analyzed`)
    console.log(`     Sentiment: ${brandAnalysis.sentimentBreakdown.positive}+ / ${brandAnalysis.sentimentBreakdown.neutral}= / ${brandAnalysis.sentimentBreakdown.negative}-`)
    console.log(`     Themes: ${brandAnalysis.topThemes.slice(0, 5).join(', ')}`)
  }

  // Generate comparative analysis
  console.log(`\n  📈 Generating comparative conversation analysis...`)
  const comparativeAnalysis = await generateComparativeConversationAnalysis(
    brandAnalyses,
    focusBrandName
  )

  // Calculate totals
  const totalPosts = brandAnalyses.reduce((sum, b) => sum + b.totalPosts, 0)
  const avgPostsPerBrand = totalPosts / brands.length

  // Save to database (reuse commentAnalysis table structure)
  // Use delete + create to avoid upsert conflicts
  try {
    await prisma.commentAnalysis.deleteMany({
      where: { sessionId }
    })

    await prisma.commentAnalysis.create({
      data: {
        sessionId,
        totalComments: totalPosts, // Actually total posts
        avgCommentsPerPost: avgPostsPerBrand,
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
      }
    })

    console.log(`  ✅ Conversation analysis complete and saved!`)
  } catch (error) {
    console.error('❌ Failed to save conversation analysis:', error)
    throw error
  }
}

/**
 * Generate comparative analysis across all brands
 */
async function generateComparativeConversationAnalysis(
  brandAnalyses: BrandConversationAnalysis[],
  focusBrandName: string
): Promise<{ summary: string; recommendations: string }> {
  try {
    const focusAnalysis = brandAnalyses.find(b => b.brandName === focusBrandName)
    const competitorAnalyses = brandAnalyses.filter(b => b.brandName !== focusBrandName)

    const prompt = `Compare conversation strategies across these brands:

Focus Brand: ${focusAnalysis?.brandName}
- Total Posts: ${focusAnalysis?.totalPosts}
- Sentiment: ${focusAnalysis?.sentimentBreakdown.positive}+ / ${focusAnalysis?.sentimentBreakdown.neutral}= / ${focusAnalysis?.sentimentBreakdown.negative}-
- Top Themes: ${focusAnalysis?.topThemes.slice(0, 5).join(', ')}
- Avg Engagement: ${focusAnalysis?.engagementMetrics.avgLikes.toFixed(0)} likes
- Summary: ${focusAnalysis?.conversationSummary}

Competitors:
${competitorAnalyses.map(c => `
${c.brandName}:
- Posts: ${c.totalPosts}
- Sentiment: ${c.sentimentBreakdown.positive}+ / ${c.sentimentBreakdown.neutral}= / ${c.sentimentBreakdown.negative}-
- Themes: ${c.topThemes.slice(0, 3).join(', ')}
- Avg Engagement: ${c.engagementMetrics.avgLikes.toFixed(0)} likes
`).join('\n')}

Provide:
1. A summary comparing ${focusAnalysis?.brandName}'s conversation strategy to competitors (3-4 sentences)
2. 3-5 strategic recommendations for ${focusAnalysis?.brandName}'s content strategy

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
      summary: `Analyzed ${brandAnalyses.reduce((sum, b) => sum + b.totalPosts, 0)} posts across ${brandAnalyses.length} brands.`,
      recommendations: 'Continue creating engaging content and monitor conversation themes.'
    }
  } catch (error) {
    console.error('Error generating comparative analysis:', error)
    return {
      summary: 'Conversation analysis complete',
      recommendations: 'Monitor content performance and audience engagement'
    }
  }
}
