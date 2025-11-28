/**
 * Own & Earn Voice Analysis
 *
 * Own Voice: Content created BY the brand (posts from brand's account)
 * Earn Voice: Content ABOUT the brand (mentions, tags, user-generated content)
 *
 * Analyzes the ratio and effectiveness of both voice types
 */

interface VoiceMetrics {
  ownVoice: {
    totalPosts: number
    totalReach: number  // followers
    totalEngagement: number
    avgEngagementPerPost: number
    platforms: {
      platform: string
      posts: number
      engagement: number
    }[]
  }
  earnVoice: {
    totalMentions: number
    totalReach: number  // estimated reach from mentions
    totalEngagement: number
    avgEngagementPerMention: number
    sentiment: {
      positive: number
      neutral: number
      negative: number
    }
    topMentioners: {
      handle: string
      mentions: number
      followers: number
    }[]
  }
  voiceRatio: number  // earn / own (higher = better brand awareness)
  amplificationFactor: number  // earn engagement / own engagement
}

/**
 * Analyze Own Voice metrics
 */
export function analyzeOwnVoice(brandData: any): VoiceMetrics['ownVoice'] {
  const platforms = Object.entries(brandData.platforms || {})

  let totalPosts = 0
  let totalReach = 0
  let totalEngagement = 0
  const platformMetrics: any[] = []

  platforms.forEach(([platformName, data]: [string, any]) => {
    const posts = data.posts || 0
    const followers = data.followers || 0
    const engagementRate = data.engagement || 0

    // Calculate engagement count from engagement rate
    const engagement = Math.round((followers * engagementRate / 100) * posts)

    totalPosts += posts
    totalReach += followers
    totalEngagement += engagement

    platformMetrics.push({
      platform: platformName,
      posts,
      engagement
    })
  })

  return {
    totalPosts,
    totalReach,
    totalEngagement,
    avgEngagementPerPost: totalPosts > 0 ? Math.round(totalEngagement / totalPosts) : 0,
    platforms: platformMetrics
  }
}

/**
 * Analyze Earn Voice metrics from TMS API mentions data
 * IMPORTANT: Only count posts where username/author IS NOT the brand itself!
 */
export function analyzeEarnVoice(mentionsData: any[], brandName: string, brandData?: any): VoiceMetrics['earnVoice'] {
  if (!mentionsData || mentionsData.length === 0) {
    return {
      totalMentions: 0,
      totalReach: 0,
      totalEngagement: 0,
      avgEngagementPerMention: 0,
      sentiment: { positive: 0, neutral: 0, negative: 0 },
      topMentioners: []
    }
  }

  // CRITICAL: Filter for Earn Voice
  // 1. Author/username IS NOT the brand itself (excludes brand's own posts)
  // 2. Content CONTAINS brand name (mentions the brand)
  const brandLower = brandName.toLowerCase().replace(/\s/g, '')
  const brandNameForSearch = brandName.toLowerCase()

  // Also get brand's social media handles to exclude
  const brandHandles = new Set<string>()
  if (brandData) {
    // Add all social media handles (without @ symbol)
    const handles = [
      brandData.instagramHandle,
      brandData.tiktokHandle,
      brandData.twitterHandle,
      brandData.youtubeHandle,
      brandData.facebookHandle
    ].filter(Boolean)

    handles.forEach(handle => {
      const cleanHandle = handle.replace(/^@/, '').toLowerCase().replace(/\s/g, '')
      brandHandles.add(cleanHandle)
    })
  }
  // Also add brand name as a potential handle
  brandHandles.add(brandLower)

  console.log(`  🔍 Filtering mentions - excluding brand handles:`, Array.from(brandHandles))

  const userMentions = mentionsData.filter(mention => {
    // Check 1: Author is NOT the brand (check against all known handles)
    const author = (mention.author || mention.username || mention.user || mention.profile || '').toLowerCase().replace(/\s/g, '').replace(/^@/, '')
    const isNotBrandAuthor = !Array.from(brandHandles).some(handle =>
      author === handle || author.includes(handle)
    )

    // Check 2: Content contains brand name
    const text = (
      mention.text ||
      mention.title ||
      mention.description ||
      mention.caption ||
      mention.content ||
      mention.message ||
      ''
    ).toLowerCase()
    const containsBrandName = text.includes(brandNameForSearch)

    // Must satisfy BOTH conditions:
    // - Posted by user (not brand)
    // - Mentions the brand in content
    return isNotBrandAuthor && containsBrandName
  })

  console.log(`  📊 Earn Voice filtering: ${mentionsData.length} total → ${userMentions.length} user mentions about "${brandName}"`)

  let totalMentions = userMentions.length
  let totalReach = 0
  let totalEngagement = 0
  let sentimentCounts = { positive: 0, neutral: 0, negative: 0 }
  const mentioners = new Map<string, { mentions: number; followers: number }>()

  userMentions.forEach(mention => {
    // Calculate engagement
    const engagement = (mention.like_count || mention.likes || 0) +
                      (mention.comment_count || mention.comments || 0) +
                      (mention.shares || 0) +
                      (mention.retweets || 0)

    totalEngagement += engagement

    // Estimate reach (from author's followers or engagement)
    const authorFollowers = mention.author_followers || mention.followers || 0
    totalReach += authorFollowers || (engagement * 10) // fallback: estimate from engagement

    // Sentiment analysis (basic keyword-based)
    const text = (mention.text || mention.title || mention.description || '').toLowerCase()
    const brandLower = brandName.toLowerCase()

    // Check if brand is mentioned in positive, neutral, or negative context
    const positiveWords = ['love', 'great', 'amazing', 'best', 'excellent', 'perfect', 'good', 'suka', 'bagus', 'mantap']
    const negativeWords = ['hate', 'bad', 'worst', 'terrible', 'awful', 'poor', 'jelek', 'buruk', 'kecewa']

    if (positiveWords.some(word => text.includes(word))) {
      sentimentCounts.positive++
    } else if (negativeWords.some(word => text.includes(word))) {
      sentimentCounts.negative++
    } else {
      sentimentCounts.neutral++
    }

    // Track mentioners
    const handle = mention.author || mention.username || 'unknown'
    const current = mentioners.get(handle) || { mentions: 0, followers: authorFollowers }
    mentioners.set(handle, {
      mentions: current.mentions + 1,
      followers: Math.max(current.followers, authorFollowers)
    })
  })

  // Get top mentioners
  const topMentioners = Array.from(mentioners.entries())
    .map(([handle, data]) => ({ handle, ...data }))
    .sort((a, b) => b.mentions - a.mentions)
    .slice(0, 10)

  return {
    totalMentions,
    totalReach,
    totalEngagement,
    avgEngagementPerMention: totalMentions > 0 ? Math.round(totalEngagement / totalMentions) : 0,
    sentiment: sentimentCounts,
    topMentioners
  }
}

/**
 * Calculate comprehensive voice metrics
 */
export function calculateVoiceMetrics(
  brandData: any,
  mentionsData: any[],
  brandName: string
): VoiceMetrics {
  const ownVoice = analyzeOwnVoice(brandData)
  const earnVoice = analyzeEarnVoice(mentionsData, brandName, brandData)

  // Voice ratio: how much people talk about you vs. how much you post
  const voiceRatio = ownVoice.totalPosts > 0
    ? parseFloat((earnVoice.totalMentions / ownVoice.totalPosts).toFixed(2))
    : 0

  // Amplification factor: how much more engagement your brand gets from others vs. your own posts
  const amplificationFactor = ownVoice.totalEngagement > 0
    ? parseFloat((earnVoice.totalEngagement / ownVoice.totalEngagement).toFixed(2))
    : 0

  return {
    ownVoice,
    earnVoice,
    voiceRatio,
    amplificationFactor
  }
}

/**
 * Generate insights from voice analysis
 */
export function generateVoiceInsights(metrics: VoiceMetrics, brandName: string): string {
  const insights: string[] = []

  // Voice ratio insights
  if (metrics.voiceRatio > 5) {
    insights.push(`${brandName} memiliki strong earned media presence dengan ${metrics.voiceRatio}x lebih banyak mentions dibanding posts. Ini menunjukkan brand awareness yang sangat baik.`)
  } else if (metrics.voiceRatio > 2) {
    insights.push(`${brandName} memiliki healthy earned voice dengan ${metrics.voiceRatio}x mentions per post.`)
  } else if (metrics.voiceRatio < 1) {
    insights.push(`${brandName} perlu meningkatkan brand awareness - earned mentions masih lebih rendah dari owned posts.`)
  }

  // Amplification insights
  if (metrics.amplificationFactor > 3) {
    insights.push(`Konten ${brandName} memiliki viral potential yang tinggi - ${metrics.amplificationFactor}x amplification dari user-generated content.`)
  } else if (metrics.amplificationFactor > 1) {
    insights.push(`User-generated content memberikan ${metrics.amplificationFactor}x engagement boost dibanding owned posts.`)
  } else {
    insights.push(`Owned content masih lebih engaging dari earned media. Fokus pada campaign untuk encourage UGC.`)
  }

  // Sentiment insights
  const totalSentiment = metrics.earnVoice.sentiment.positive +
                        metrics.earnVoice.sentiment.neutral +
                        metrics.earnVoice.sentiment.negative

  if (totalSentiment > 0) {
    const positivePercent = Math.round((metrics.earnVoice.sentiment.positive / totalSentiment) * 100)
    const negativePercent = Math.round((metrics.earnVoice.sentiment.negative / totalSentiment) * 100)

    if (positivePercent > 60) {
      insights.push(`Sentiment sangat positif (${positivePercent}% positive mentions). Brand perception excellent.`)
    } else if (negativePercent > 30) {
      insights.push(`Perhatian: ${negativePercent}% negative sentiment detected. Perlu crisis monitoring.`)
    } else {
      insights.push(`Sentiment majority neutral-to-positive (${positivePercent}% positive).`)
    }
  }

  return insights.join('\n\n')
}
