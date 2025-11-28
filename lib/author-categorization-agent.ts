/**
 * Author Categorization Agent
 *
 * Uses Ollama AI to analyze and categorize authors based on:
 * - Profile information
 * - Recent posts content
 * - Engagement patterns
 * - Brand alignment
 */

import { AuthorProfileData, AuthorPostData } from './author-profiler'

export interface AuthorCategories {
  industry: string[]
  contentType: string[]
  audienceType: string[]
  tone: string[]
  topics: string[]
}

export interface AuthorAnalysis {
  categories: AuthorCategories
  brandAlignmentScore: number
  sentiment: 'positive' | 'neutral' | 'negative'
  collaborationScore: number
  priority: 'high' | 'medium' | 'low'
  insights: string[]
}

/**
 * Categorize author using AI
 */
export async function categorizeAuthor(
  profile: AuthorProfileData,
  brandName: string,
  focusBrandIndustry?: string
): Promise<AuthorAnalysis> {
  try {
    console.log(`🤖 AI analyzing author: @${profile.username}...`)

    const prompt = buildCategorizationPrompt(profile, brandName, focusBrandIndustry)

    const response = await fetch('http://localhost:11434/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama2',
        prompt: prompt,
        stream: false,
        options: {
          temperature: 0.3,
          num_predict: 1000
        }
      })
    })

    if (!response.ok) {
      console.error('❌ Ollama AI request failed:', response.status)
      return generateDefaultAnalysis()
    }

    const data = await response.json()
    const aiResponse = data.response

    // Parse AI response
    const analysis = parseAIResponse(aiResponse, profile)

    console.log(`✅ AI categorization complete for @${profile.username}`)
    console.log(`   Priority: ${analysis.priority}, Score: ${analysis.collaborationScore}`)

    return analysis
  } catch (error) {
    console.error('❌ Error in AI categorization:', error)
    return generateDefaultAnalysis()
  }
}

/**
 * Build categorization prompt for AI
 */
function buildCategorizationPrompt(
  profile: AuthorProfileData,
  brandName: string,
  focusBrandIndustry?: string
): string {
  const postsText = profile.recentPosts
    .slice(0, 5)
    .map(p => p.text)
    .filter(Boolean)
    .join('\n---\n')

  return `You are an expert social media analyst. Analyze this author profile and categorize them.

AUTHOR PROFILE:
Username: @${profile.username}
Platform: ${profile.platform}
Display Name: ${profile.displayName}
Followers: ${profile.followers.toLocaleString()}
Bio: ${profile.bio || 'N/A'}

RECENT POSTS (last 5):
${postsText || 'No posts available'}

BRAND CONTEXT:
Brand Name: ${brandName}
Industry: ${focusBrandIndustry || 'Unknown'}

ANALYSIS TASKS:
1. Identify the author's industry/niche (e.g., fashion, beauty, tech, food, travel, lifestyle, etc.)
2. Classify their content type (e.g., educational, entertainment, promotional, inspirational, etc.)
3. Determine their audience type (e.g., young adults, professionals, parents, students, etc.)
4. Analyze their tone (e.g., casual, professional, humorous, inspirational, etc.)
5. Extract main topics they discuss
6. Rate brand alignment (0-100): How well does this author align with ${brandName}?
7. Determine sentiment toward brands in general (positive/neutral/negative)
8. Rate collaboration potential (0-100): How valuable would a collaboration be?
9. Assign priority (high/medium/low) for brand outreach

RESPONSE FORMAT (JSON):
{
  "industry": ["primary industry", "secondary industry"],
  "contentType": ["type1", "type2"],
  "audienceType": ["audience1", "audience2"],
  "tone": ["tone1", "tone2"],
  "topics": ["topic1", "topic2", "topic3"],
  "brandAlignmentScore": 75,
  "sentiment": "positive",
  "collaborationScore": 80,
  "priority": "high",
  "insights": [
    "Key insight 1",
    "Key insight 2"
  ]
}

Provide ONLY the JSON response, no additional text.`
}

/**
 * Parse AI response into structured analysis
 */
function parseAIResponse(aiResponse: string, profile: AuthorProfileData): AuthorAnalysis {
  try {
    // Extract JSON from response
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.warn('⚠️ Could not extract JSON from AI response')
      return generateDefaultAnalysis()
    }

    const parsed = JSON.parse(jsonMatch[0])

    return {
      categories: {
        industry: parsed.industry || [],
        contentType: parsed.contentType || [],
        audienceType: parsed.audienceType || [],
        tone: parsed.tone || [],
        topics: parsed.topics || []
      },
      brandAlignmentScore: parsed.brandAlignmentScore || 50,
      sentiment: parsed.sentiment || 'neutral',
      collaborationScore: parsed.collaborationScore || 50,
      priority: parsed.priority || 'medium',
      insights: parsed.insights || []
    }
  } catch (error) {
    console.error('❌ Error parsing AI response:', error)
    return generateDefaultAnalysis()
  }
}

/**
 * Generate default analysis when AI fails
 */
function generateDefaultAnalysis(): AuthorAnalysis {
  return {
    categories: {
      industry: ['general'],
      contentType: ['mixed'],
      audienceType: ['general'],
      tone: ['neutral'],
      topics: ['various']
    },
    brandAlignmentScore: 50,
    sentiment: 'neutral',
    collaborationScore: 50,
    priority: 'medium',
    insights: ['AI categorization unavailable - manual review recommended']
  }
}

/**
 * Calculate engagement metrics for scoring
 */
function calculateEngagementMetrics(profile: AuthorProfileData): {
  avgEngagementRate: number
  totalReach: number
  postConsistency: number
} {
  if (profile.recentPosts.length === 0) {
    return {
      avgEngagementRate: 0,
      totalReach: profile.followers,
      postConsistency: 0
    }
  }

  const totalEngagement = profile.recentPosts.reduce((sum, post) => sum + post.engagement, 0)
  const avgEngagement = totalEngagement / profile.recentPosts.length

  const avgEngagementRate = profile.followers > 0
    ? (avgEngagement / profile.followers) * 100
    : 0

  // Calculate post consistency (how regular are their posts)
  const dates = profile.recentPosts.map(p => p.publishedAt.getTime()).sort((a, b) => a - b)
  let consistency = 0
  if (dates.length > 1) {
    const intervals = []
    for (let i = 1; i < dates.length; i++) {
      intervals.push(dates[i] - dates[i - 1])
    }
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
    const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length
    const stdDev = Math.sqrt(variance)
    consistency = avgInterval > 0 ? Math.max(0, 100 - (stdDev / avgInterval * 100)) : 0
  }

  return {
    avgEngagementRate: parseFloat(avgEngagementRate.toFixed(2)),
    totalReach: profile.followers,
    postConsistency: parseFloat(consistency.toFixed(2))
  }
}

/**
 * Analyze brand mentions in author's content
 */
function analyzeBrandMentions(
  profile: AuthorProfileData,
  brandName: string
): {
  mentionCount: number
  lastMentionDate: Date | null
  mentionSentiment: 'positive' | 'neutral' | 'negative'
} {
  const brandLower = brandName.toLowerCase()
  let mentionCount = 0
  let lastMentionDate: Date | null = null
  let positiveCount = 0
  let negativeCount = 0

  profile.recentPosts.forEach(post => {
    const text = post.text.toLowerCase()
    if (text.includes(brandLower)) {
      mentionCount++
      if (!lastMentionDate || post.publishedAt > lastMentionDate) {
        lastMentionDate = post.publishedAt
      }

      // Simple sentiment analysis
      const positiveWords = ['love', 'amazing', 'great', 'excellent', 'fantastic', 'awesome', 'best', 'perfect']
      const negativeWords = ['hate', 'bad', 'terrible', 'awful', 'worst', 'disappointing', 'poor']

      const hasPositive = positiveWords.some(word => text.includes(word))
      const hasNegative = negativeWords.some(word => text.includes(word))

      if (hasPositive) positiveCount++
      if (hasNegative) negativeCount++
    }
  })

  let mentionSentiment: 'positive' | 'neutral' | 'negative' = 'neutral'
  if (mentionCount > 0) {
    if (positiveCount > negativeCount) mentionSentiment = 'positive'
    else if (negativeCount > positiveCount) mentionSentiment = 'negative'
  }

  return {
    mentionCount,
    lastMentionDate,
    mentionSentiment
  }
}

/**
 * Calculate collaboration score based on multiple factors
 */
export function calculateCollaborationScore(
  profile: AuthorProfileData,
  aiAnalysis: AuthorAnalysis,
  engagementMetrics: {
    avgEngagementRate: number
    totalReach: number
    postConsistency: number
  }
): number {
  let score = 0

  // Factor 1: Follower count (0-25 points)
  if (profile.followers >= 1000000) score += 25
  else if (profile.followers >= 500000) score += 20
  else if (profile.followers >= 100000) score += 15
  else if (profile.followers >= 50000) score += 10
  else if (profile.followers >= 10000) score += 5

  // Factor 2: Engagement rate (0-25 points)
  if (engagementMetrics.avgEngagementRate >= 10) score += 25
  else if (engagementMetrics.avgEngagementRate >= 5) score += 20
  else if (engagementMetrics.avgEngagementRate >= 3) score += 15
  else if (engagementMetrics.avgEngagementRate >= 1) score += 10
  else score += 5

  // Factor 3: Brand alignment (0-25 points)
  score += (aiAnalysis.brandAlignmentScore / 100) * 25

  // Factor 4: Post consistency (0-15 points)
  score += (engagementMetrics.postConsistency / 100) * 15

  // Factor 5: Verified status (0-10 points)
  if (profile.verified) score += 10

  return Math.min(100, Math.round(score))
}

/**
 * Determine priority based on collaboration score
 */
export function determinePriority(collaborationScore: number): 'high' | 'medium' | 'low' {
  if (collaborationScore >= 75) return 'high'
  if (collaborationScore >= 50) return 'medium'
  return 'low'
}

/**
 * Complete author analysis with AI categorization
 */
export async function performCompleteAuthorAnalysis(
  profile: AuthorProfileData,
  brandName: string,
  focusBrandIndustry?: string
): Promise<AuthorAnalysis> {
  // AI categorization
  const aiAnalysis = await categorizeAuthor(profile, brandName, focusBrandIndustry)

  // Calculate metrics
  const engagementMetrics = calculateEngagementMetrics(profile)
  const brandMentions = analyzeBrandMentions(profile, brandName)

  // Calculate final collaboration score
  const collaborationScore = calculateCollaborationScore(profile, aiAnalysis, engagementMetrics)

  // Determine priority
  const priority = determinePriority(collaborationScore)

  // Enhanced insights
  const insights = [
    ...aiAnalysis.insights,
    `Avg engagement rate: ${engagementMetrics.avgEngagementRate}%`,
    `Post consistency: ${engagementMetrics.postConsistency.toFixed(0)}%`,
    brandMentions.mentionCount > 0
      ? `Mentioned brand ${brandMentions.mentionCount} times (${brandMentions.mentionSentiment} sentiment)`
      : 'No brand mentions in recent posts'
  ]

  return {
    categories: aiAnalysis.categories,
    brandAlignmentScore: aiAnalysis.brandAlignmentScore,
    sentiment: brandMentions.mentionCount > 0 ? brandMentions.mentionSentiment : aiAnalysis.sentiment,
    collaborationScore,
    priority,
    insights
  }
}

/**
 * Batch categorize multiple authors
 */
export async function batchCategorizeAuthors(
  profiles: AuthorProfileData[],
  brandName: string,
  focusBrandIndustry?: string,
  batchSize: number = 5
): Promise<Map<string, AuthorAnalysis>> {
  const results = new Map<string, AuthorAnalysis>()

  console.log(`🤖 Starting batch AI categorization for ${profiles.length} authors...`)

  for (let i = 0; i < profiles.length; i += batchSize) {
    const batch = profiles.slice(i, i + batchSize)

    console.log(`   Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(profiles.length / batchSize)}...`)

    const batchPromises = batch.map(async profile => {
      const analysis = await performCompleteAuthorAnalysis(profile, brandName, focusBrandIndustry)
      return { username: profile.username, analysis }
    })

    const batchResults = await Promise.all(batchPromises)

    batchResults.forEach(({ username, analysis }) => {
      results.set(username, analysis)
    })

    // Rate limiting between batches
    if (i + batchSize < profiles.length) {
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }

  console.log(`✅ Batch categorization complete: ${results.size} authors analyzed`)

  return results
}
