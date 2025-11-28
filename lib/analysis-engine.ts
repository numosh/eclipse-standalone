import { prisma } from './db'
import {
  fetchTwitterData,
  fetchInstagramData,
  fetchTikTokData,
  fetchFacebookData,
  fetchNewsData,
  buildBooleanQuery
} from './tms-api'
import {
  scrapeInstagramProfile,
  scrapeTikTokProfile,
  scrapeYouTubeChannel,
  scrapeWebsite,
  closeBrowser
} from './web-scraper'
import { getInstagramFollowers } from './instagram-scraper'
import { getTikTokFollowers } from './tiktok-scraper'
import { generateAIInsights, buildAnalysisPrompt } from './ollama-api'
import { analyzePostsByKeywords, buildKeywordAnalysisPrompt } from './text-analysis'
import { qualifyKeywordInsights, qualifyStrategicInsights } from './ai-qualifier'
import { calculateVoiceMetrics, generateVoiceInsights } from './voice-analysis'
import { subDays } from 'date-fns'
import { profileAuthorsFromEarnVoice, fetchAuthorProfile, fetchAuthorPosts, saveAuthorProfile } from './author-profiler'
import { performCompleteAuthorAnalysis } from './author-categorization-agent'
import { analyzeShareOfVoice, generateShareOfVoiceInsights } from './share-of-voice-analysis'
import { analyzeAllBrandConversations } from './post-content-analyzer'
import { validateDataQuality, extractDateRange, type DataSource, type DataQualityReport } from './data-quality-validator'

interface BrandAnalysisData {
  brandId: string
  brandName: string
  platforms: {
    [key: string]: {
      followers: number
      posts: number
      engagement: number
      avgPostPerDay: number
      hashtags: string[]
      postTypes: { type: string; count: number; avgEngagement: number }[]
      postTimes: { hour: number; count: number }[]
      rawPosts?: any[] // Store raw posts for keyword analysis
      configured?: boolean // Platform was configured by user
      dataAvailable?: boolean // Data was successfully fetched
      dataQuality?: DataQualityReport // Data quality assessment
    }
  }
}

// Helper to log only in development or when explicitly enabled
const shouldLog = process.env.NODE_ENV !== 'production' || process.env.ENABLE_ANALYSIS_LOGS === 'true'
const log = (...args: any[]) => shouldLog && console.log(...args)
const logError = (...args: any[]) => console.error(...args) // Always log errors

export async function runAnalysis(sessionId: string) {
  try {
    log(`🚀 Starting analysis for session: ${sessionId}`)

    // Update status to processing
    await prisma.analysisSession.update({
      where: { id: sessionId },
      data: { status: 'processing' }
    })

    // Fetch session with brands
    const session = await prisma.analysisSession.findUnique({
      where: { id: sessionId },
      include: {
        focusBrand: true,
        competitors: true
      }
    })

    if (!session || !session.focusBrand) {
      throw new Error('Session or focus brand not found')
    }

    const allBrands = [session.focusBrand, ...session.competitors]
    const brandAnalysisData: BrandAnalysisData[] = []

    // Analyze each brand
    for (const brand of allBrands) {
      log(`📊 Analyzing brand: ${brand.name}`)
      const brandData = await analyzeBrand(brand.id, brand)
      brandAnalysisData.push(brandData)
    }

    // Generate comparative analysis
    const analysisResults = await generateComparativeAnalysis(brandAnalysisData, session.focusBrand.name)

    // Generate keyword clustering analysis
    log('📝 Analyzing keyword clusters...')
    const keywordAnalysis = await generateKeywordClustering(brandAnalysisData)

    // Generate Share of Voice Analysis
    log('🎯 Analyzing Share of Voice...')
    let shareOfVoiceAnalysis = null
    try {
      shareOfVoiceAnalysis = await analyzeShareOfVoice(
        allBrands.map(brand => ({
          name: brand.name,
          category: undefined // Auto-detect category
        })),
        session.universeKeywords || undefined // Use custom keywords if provided
      )
      log(`✅ Share of Voice complete: ${shareOfVoiceAnalysis.totalUniverseConversations} universe conversations`)
    } catch (error) {
      logError('❌ Share of Voice analysis failed (non-critical):', error)
    }

    // Generate Own & Earn Voice Analysis
    log('🎙️ Analyzing Own & Earn Voice...')
    const voiceAnalysis = await Promise.all(allBrands.map(async brand => {
      try {
        // Fetch mentions from ALL platforms (Instagram, TikTok, Twitter, News)
        // Use boolean search to expand brand voice results
        const booleanQuery = buildBooleanQuery(
          brand.name,
          brand.instagramHandle || brand.tiktokHandle || brand.twitterHandle || undefined
        )
        log(`  📰 Fetching mentions for ${brand.name} using boolean query...`)
        log(`     Query: ${booleanQuery}`)

        const [instagramData, tiktokData, twitterData, newsData] = await Promise.all([
          fetchInstagramData(booleanQuery),
          fetchTikTokData(booleanQuery),
          fetchTwitterData(booleanQuery),
          fetchNewsData(booleanQuery)
        ])

        // Combine all mentions from all platforms
        const allMentions = [
          ...(instagramData.data || []).map((item: any) => ({ ...item, platform: 'instagram' })),
          ...(tiktokData.data || []).map((item: any) => ({ ...item, platform: 'tiktok' })),
          ...(twitterData.data || []).map((item: any) => ({ ...item, platform: 'twitter' })),
          ...(newsData.data || []).map((item: any) => ({ ...item, platform: 'news' }))
        ]

        log(`    Found ${allMentions.length} total mentions (IG: ${instagramData.data?.length || 0}, TT: ${tiktokData.data?.length || 0}, TW: ${twitterData.data?.length || 0}, News: ${newsData.data?.length || 0})`)

        const metrics = calculateVoiceMetrics(brand, allMentions, brand.name)
        const insights = generateVoiceInsights(metrics, brand.name)

        return {
          brand: brand.name,
          metrics,
          insights
        }
      } catch (error) {
        logError(`❌ Error analyzing voice for ${brand.name}:`, error)
        // Return empty metrics on error
        return {
          brand: brand.name,
          metrics: {
            ownVoice: {
              totalPosts: 0,
              totalReach: 0,
              totalEngagement: 0,
              avgEngagementPerPost: 0,
              platforms: []
            },
            earnVoice: {
              totalMentions: 0,
              totalReach: 0,
              totalEngagement: 0,
              avgEngagementPerMention: 0,
              sentiment: { positive: 0, neutral: 0, negative: 0 },
              topMentioners: []
            },
            voiceRatio: 0,
            amplificationFactor: 0
          },
          insights: 'Voice analysis unavailable due to error.'
        }
      }
    }))

    // Generate AI insights (non-blocking - skip if AI service unavailable)
    let aiInsights = 'AI insights generation skipped (AI service not available)'
    let aiKeywordInsights = ''

    try {
      log('🤖 Generating AI insights...')
      const rawAiInsights = await generateAIInsights(
        buildAnalysisPrompt({
          focusBrand: session.focusBrand.name,
          competitors: session.competitors.map(c => c.name),
          analysisData: analysisResults
        })
      )

      // Qualify and enhance strategic insights
      log('✨ Qualifying strategic insights with AI Agent...')
      aiInsights = await qualifyStrategicInsights(
        rawAiInsights,
        analysisResults.brandEquityData,
        session.focusBrand.name
      )

      // Generate AI insights for keyword clustering
      log('🤖 Generating keyword insights...')
      if (keywordAnalysis.length > 0) {
        const keywordPrompts = keywordAnalysis.map(ka => buildKeywordAnalysisPrompt(ka)).join('\n\n---\n\n')
        const rawKeywordInsights = await generateAIInsights(keywordPrompts)

        // Qualify and enhance keyword insights
        log('✨ Qualifying keyword insights with AI Agent...')
        aiKeywordInsights = await qualifyKeywordInsights(rawKeywordInsights, keywordAnalysis)
      }
    } catch (error) {
      logError('❌ AI insights generation failed (non-critical, continuing analysis):', error)
      aiInsights = 'AI insights unavailable - AI service timeout or not configured. Analysis completed without AI-generated insights.'
    }

    // Profile authors from Earn Voice
    log('\n👥 Starting author profiling from Earn Voice...')
    try {
      const authorCount = await profileAuthorsFromEarnVoice(
        sessionId,
        voiceAnalysis,
        session.focusBrand.name,
        20 // Profile top 20 authors
      )

      if (authorCount > 0) {
        log(`✅ Profiled ${authorCount} authors from Earn Voice`)

        // Fetch all profiled authors for this session
        const authorProfiles = await prisma.authorProfile.findMany({
          where: { sessionId },
          include: { posts: true }
        })

        // Perform AI categorization for each author
        log('🤖 AI categorization starting...')
        for (const authorProfile of authorProfiles) {
          try {
            const profileData = {
              username: authorProfile.username,
              displayName: authorProfile.displayName || authorProfile.username,
              platform: authorProfile.platform,
              followers: authorProfile.followers,
              following: authorProfile.following,
              totalPosts: authorProfile.totalPosts,
              verified: authorProfile.verified,
              bio: authorProfile.bio || undefined,
              location: authorProfile.location || undefined,
              website: authorProfile.website || undefined,
              profileUrl: authorProfile.profileUrl || undefined,
              recentPosts: authorProfile.posts.map(post => ({
                platform: post.platform,
                postId: post.postId,
                text: post.text || '',
                publishedAt: post.publishedAt,
                likes: post.likes,
                comments: post.comments,
                shares: post.shares,
                engagement: post.engagement,
                mediaType: post.mediaType || undefined,
                hashtags: post.hashtags ? JSON.parse(post.hashtags) : undefined,
                mentions: post.mentions ? JSON.parse(post.mentions) : undefined
              }))
            }

            const analysis = await performCompleteAuthorAnalysis(
              profileData,
              session.focusBrand.name
            )

            // Update author profile with AI analysis
            await prisma.authorProfile.update({
              where: { id: authorProfile.id },
              data: {
                categories: JSON.stringify(analysis.categories),
                sentiment: analysis.sentiment,
                brandAlignmentScore: analysis.brandAlignmentScore,
                collaborationScore: analysis.collaborationScore,
                priority: analysis.priority
              }
            })
          } catch (error) {
            logError(`❌ Failed to categorize author ${authorProfile.username}:`, error)
          }
        }

        log(`✅ AI categorization complete for ${authorProfiles.length} authors`)
      } else {
        log('⚠️ No authors found in Earn Voice data')
      }
    } catch (error) {
      logError('❌ Author profiling failed (non-critical):', error)
      // Continue with analysis even if author profiling fails
    }

    // Analyze post content conversations from all brands (focus + competitors)
    log('\n💬 Starting comprehensive conversation analysis...')
    try {
      await analyzeAllBrandConversations(session.id, allBrands, session.focusBrand.name)
    } catch (error) {
      logError('❌ Conversation analysis failed (non-critical):', error)
      // Continue with analysis even if conversation analysis fails
    }

    // Extract data quality reports from all brands
    const dataQualityReports: Record<string, any> = {}
    brandAnalysisData.forEach((brand: BrandAnalysisData) => {
      dataQualityReports[brand.brandName] = {}
      Object.entries(brand.platforms).forEach(([platform, data]) => {
        if (data.dataQuality) {
          dataQualityReports[brand.brandName][platform] = {
            confidence: data.dataQuality.confidence,
            confidenceScore: data.dataQuality.confidenceScore,
            issues: data.dataQuality.issues,
            recommendations: data.dataQuality.recommendations,
            dataPointsAnalyzed: data.dataQuality.mergedData.dataPointsAnalyzed,
            estimatedTotalPosts: data.dataQuality.mergedData.estimatedTotalPosts
          }
        }
      })
    })

    // Save analysis results
    await prisma.analysisResult.create({
      data: {
        sessionId: session.id,
        audienceComparison: JSON.stringify(analysisResults.audienceComparison),
        postChannelData: JSON.stringify(analysisResults.postChannelData),
        hashtagAnalysis: JSON.stringify(analysisResults.hashtagAnalysis),
        postTypeEngagement: JSON.stringify(analysisResults.postTypeEngagement),
        postTimingData: JSON.stringify(analysisResults.postTimingData),
        brandEquityData: JSON.stringify(analysisResults.brandEquityData),
        keywordClustering: JSON.stringify(keywordAnalysis),
        voiceAnalysis: JSON.stringify(voiceAnalysis),
        shareOfVoice: shareOfVoiceAnalysis ? JSON.stringify(shareOfVoiceAnalysis) : null,
        aiInsights: aiInsights,
        aiKeywordInsights: aiKeywordInsights,
        additionalMetrics: JSON.stringify(analysisResults.additionalMetrics),
        dataQualityReport: JSON.stringify(dataQualityReports)
      }
    })

    // Update session status
    await prisma.analysisSession.update({
      where: { id: sessionId },
      data: {
        status: 'completed',
        completedAt: new Date(),
        notificationRead: false
      }
    })

    log(`✅ Analysis completed for session: ${sessionId}`)

    // Cleanup
    await closeBrowser()

  } catch (error) {
    logError(`❌ Analysis failed for session ${sessionId}:`, error)

    await prisma.analysisSession.update({
      where: { id: sessionId },
      data: { status: 'failed' }
    })

    await closeBrowser()
    throw error
  }
}

async function analyzeBrand(brandId: string, brand: any): Promise<BrandAnalysisData> {
  const platformData: any = {}

  // Define all possible platforms
  const allPlatforms = ['instagram', 'tiktok', 'twitter', 'youtube', 'facebook']

  // Initialize empty platform data for ALL configured platforms
  allPlatforms.forEach(platform => {
    const handleKey = `${platform}Handle` as keyof typeof brand
    if (brand[handleKey]) {
      // Platform is configured - will be populated below
      platformData[platform] = {
        followers: 0,
        posts: 0,
        engagement: 0,
        avgPostPerDay: 0,
        hashtags: [],
        postTypes: [],
        postTimes: [],
        rawPosts: [],
        configured: true,
        dataAvailable: false
      }
    }
  })

  // Instagram Analysis
  if (brand.instagramHandle) {
    log(`  📸 Analyzing Instagram: @${brand.instagramHandle}`)
    const tmsData = await fetchInstagramData(brand.instagramHandle)

    // Use new accurate Instagram scraper with caching
    const instagramProfile = await getInstagramFollowers(brand.instagramHandle)
    log(`    ✅ Followers: ${instagramProfile?.followers.toLocaleString() || 'N/A'}`)

    const igAnalysis = analyzeInstagramData(tmsData, instagramProfile)

    await prisma.brandData.create({
      data: {
        brandId,
        platform: 'instagram',
        rawData: JSON.stringify(tmsData),
        scrapedData: JSON.stringify(instagramProfile),
        followerCount: igAnalysis.followers,
        postCount: igAnalysis.posts,
        engagementRate: igAnalysis.engagement,
        avgPostPerDay: igAnalysis.avgPostPerDay
      }
    })

    platformData.instagram = { ...igAnalysis, configured: true, dataAvailable: true }
  }

  // TikTok Analysis
  if (brand.tiktokHandle) {
    log(`  🎵 Analyzing TikTok: @${brand.tiktokHandle}`)
    const tmsData = await fetchTikTokData(brand.tiktokHandle)

    // Use new accurate TikTok scraper with caching
    const tiktokProfile = await getTikTokFollowers(brand.tiktokHandle)
    log(`    ✅ Followers: ${tiktokProfile?.followers.toLocaleString() || 'N/A'}`)

    const ttAnalysis = analyzeTikTokData(tmsData, tiktokProfile)

    await prisma.brandData.create({
      data: {
        brandId,
        platform: 'tiktok',
        rawData: JSON.stringify(tmsData),
        scrapedData: JSON.stringify(tiktokProfile),
        followerCount: ttAnalysis.followers,
        postCount: ttAnalysis.posts,
        engagementRate: ttAnalysis.engagement,
        avgPostPerDay: ttAnalysis.avgPostPerDay
      }
    })

    platformData.tiktok = { ...ttAnalysis, configured: true, dataAvailable: true }
  }

  // Twitter Analysis
  if (brand.twitterHandle) {
    log(`  🐦 Analyzing Twitter: @${brand.twitterHandle}`)
    const tmsData = await fetchTwitterData(brand.twitterHandle)

    const twAnalysis = analyzeTwitterData(tmsData)

    await prisma.brandData.create({
      data: {
        brandId,
        platform: 'twitter',
        rawData: JSON.stringify(tmsData),
        followerCount: twAnalysis.followers,
        postCount: twAnalysis.posts,
        engagementRate: twAnalysis.engagement,
        avgPostPerDay: twAnalysis.avgPostPerDay
      }
    })

    platformData.twitter = { ...twAnalysis, configured: true, dataAvailable: true }
  }

  // YouTube Analysis
  if (brand.youtubeHandle) {
    log(`  📺 Analyzing YouTube: ${brand.youtubeHandle}`)
    const scrapedData = await scrapeYouTubeChannel(brand.youtubeHandle)

    const ytAnalysis = {
      followers: scrapedData?.followers || 0,
      posts: 0,
      engagement: 0,
      avgPostPerDay: 0,
      hashtags: [],
      postTypes: [],
      postTimes: []
    }

    await prisma.brandData.create({
      data: {
        brandId,
        platform: 'youtube',
        rawData: '{}',
        scrapedData: JSON.stringify(scrapedData),
        followerCount: ytAnalysis.followers,
        postCount: 0,
        engagementRate: 0,
        avgPostPerDay: 0
      }
    })

    platformData.youtube = { ...ytAnalysis, configured: true, dataAvailable: scrapedData?.followers ? true : false }
  }

  // Facebook Analysis
  if (brand.facebookHandle) {
    log(`  👍 Analyzing Facebook: ${brand.facebookHandle}`)
    const tmsData = await fetchFacebookData(brand.facebookHandle)

    const fbAnalysis = analyzeFacebookData(tmsData)

    await prisma.brandData.create({
      data: {
        brandId,
        platform: 'facebook',
        rawData: JSON.stringify(tmsData),
        followerCount: fbAnalysis.followers,
        postCount: fbAnalysis.posts,
        engagementRate: fbAnalysis.engagement,
        avgPostPerDay: fbAnalysis.avgPostPerDay
      }
    })

    platformData.facebook = { ...fbAnalysis, configured: true, dataAvailable: true }
  }

  // Website Analysis
  if (brand.website) {
    log(`  🌐 Analyzing Website: ${brand.website}`)
    const scrapedData = await scrapeWebsite(brand.website)

    await prisma.brandData.create({
      data: {
        brandId,
        platform: 'website',
        rawData: '{}',
        scrapedData: JSON.stringify(scrapedData),
        followerCount: 0,
        postCount: 0,
        engagementRate: 0,
        avgPostPerDay: 0
      }
    })
  }

  return {
    brandId,
    brandName: brand.name,
    platforms: platformData
  }
}

function analyzeInstagramData(tmsData: any, instagramProfile: any) {
  const posts = tmsData.data || []

  // Prepare data sources for validation
  const dataSources: DataSource[] = []

  // TMS API data source
  const dateRange = extractDateRange(posts)
  dataSources.push({
    source: 'TMS_API',
    posts: posts.length,
    dataPoints: posts.length,
    dateRange,
    raw: tmsData
  })

  // Playwright/Scraper data source
  if (instagramProfile) {
    dataSources.push({
      source: 'PLAYWRIGHT',
      followers: instagramProfile.followers,
      posts: instagramProfile.posts,
      engagement: instagramProfile.engagement,
      raw: instagramProfile
    })
  }

  // Validate data quality and get merged/corrected data
  const dataQuality = validateDataQuality(dataSources)
  const { mergedData } = dataQuality

  // Log data quality issues
  if (dataQuality.confidence === 'LOW' || dataQuality.confidence === 'VERY_LOW') {
    logError(`⚠️ Instagram data quality ${dataQuality.confidence} (score: ${dataQuality.confidenceScore})`)
    dataQuality.issues.forEach(issue => logError(`  - ${issue}`))
  }

  // Extract hashtags from post content
  const hashtags = extractHashtags(posts)

  // Analyze post types
  const postTypes = analyzePostTypes(posts)

  // Analyze posting times
  const postTimes = analyzePostTimes(posts)

  // Calculate engagement - TMS API uses like_count, comment_count
  const totalEngagement = posts.reduce((sum: number, post: any) => {
    const likes = post.like_count || post.likes || 0
    const comments = post.comment_count || post.comments || 0
    return sum + likes + comments
  }, 0)

  const avgEngagementPerPost = posts.length > 0 ? totalEngagement / posts.length : 0

  // Use validated data
  let followers = mergedData.followers

  // Estimate followers if still not available from either source
  // Instagram typical engagement rate: 1-3% for mid-size accounts
  // So followers ≈ avg engagement / 0.02 (2%)
  if (followers === 0 && avgEngagementPerPost > 0) {
    followers = Math.round(avgEngagementPerPost / 0.02)
  }

  // Engagement rate: (avg engagement per post / followers) * 100
  const engagement = followers > 0 ? (avgEngagementPerPost / followers) * 100 : 0

  return {
    followers,
    posts: mergedData.posts,
    engagement: parseFloat(engagement.toFixed(2)),
    avgPostPerDay: mergedData.avgPostPerDay,
    hashtags,
    postTypes,
    postTimes,
    dataQuality, // Include data quality report
    rawPosts: posts.map((p: any) => ({
      text: p.title || p.description || p.caption || '',
      likes: p.like_count || p.likes || 0,
      comments: p.comment_count || p.comments || 0,
      engagement: (p.like_count || 0) + (p.comment_count || 0),
      published_at: p.published_at || p.timestamp || null
    }))
  }
}

function analyzeTikTokData(tmsData: any, tiktokProfile: any) {
  const posts = tmsData.data || []

  // Prepare data sources for validation
  const dataSources: DataSource[] = []

  // TMS API data source
  const dateRange = extractDateRange(posts)
  dataSources.push({
    source: 'TMS_API',
    posts: posts.length,
    dataPoints: posts.length,
    dateRange,
    raw: tmsData
  })

  // Playwright/Scraper data source
  if (tiktokProfile) {
    dataSources.push({
      source: 'PLAYWRIGHT',
      followers: tiktokProfile.followers,
      posts: tiktokProfile.posts,
      engagement: tiktokProfile.engagement,
      raw: tiktokProfile
    })
  }

  // Validate data quality and get merged/corrected data
  const dataQuality = validateDataQuality(dataSources)
  const { mergedData } = dataQuality

  // Log data quality issues
  if (dataQuality.confidence === 'LOW' || dataQuality.confidence === 'VERY_LOW') {
    logError(`⚠️ TikTok data quality ${dataQuality.confidence} (score: ${dataQuality.confidenceScore})`)
    dataQuality.issues.forEach(issue => logError(`  - ${issue}`))
  }

  const hashtags = extractHashtags(posts)
  const postTypes = analyzePostTypes(posts)
  const postTimes = analyzePostTimes(posts)

  const totalEngagement = posts.reduce((sum: number, post: any) => {
    const likes = post.like_count || post.likes || 0
    const comments = post.comment_count || post.comments || 0
    const shares = post.share_count || post.shares || 0
    return sum + likes + comments + shares
  }, 0)

  const avgEngagementPerPost = posts.length > 0 ? totalEngagement / posts.length : 0

  // Use validated data
  let followers = mergedData.followers

  // Estimate followers if still not available - TikTok typical engagement rate: 5-10%
  if (followers === 0 && avgEngagementPerPost > 0) {
    followers = Math.round(avgEngagementPerPost / 0.07) // 7% avg
  }

  const engagement = followers > 0 ? (avgEngagementPerPost / followers) * 100 : 0

  return {
    followers,
    posts: mergedData.posts,
    engagement: parseFloat(engagement.toFixed(2)),
    avgPostPerDay: mergedData.avgPostPerDay,
    hashtags,
    postTypes,
    postTimes,
    dataQuality, // Include data quality report
    rawPosts: posts.map((p: any) => ({
      text: p.title || p.description || p.caption || '',
      likes: p.like_count || p.likes || 0,
      comments: p.comment_count || p.comments || 0,
      shares: p.share_count || p.shares || 0,
      engagement: (p.like_count || 0) + (p.comment_count || 0) + (p.share_count || 0),
      published_at: p.published_at || p.timestamp || null
    }))
  }
}

function analyzeTwitterData(tmsData: any) {
  const posts = tmsData.data || []

  const hashtags = extractHashtags(posts)
  const postTypes = analyzePostTypes(posts)
  const postTimes = analyzePostTimes(posts)

  // Estimate followers from engagement patterns
  const avgEngagement = posts.reduce((sum: number, post: any) => {
    return sum + (post.retweets || 0) + (post.likes || 0)
  }, 0) / (posts.length || 1)

  const estimatedFollowers = Math.round(avgEngagement * 50) // Rough estimate

  const totalEngagement = posts.reduce((sum: number, post: any) => {
    return sum + (post.retweets || 0) + (post.likes || 0) + (post.replies || 0)
  }, 0)

  const engagement = estimatedFollowers > 0 ? (totalEngagement / (estimatedFollowers * posts.length)) * 100 : 0
  const avgPostPerDay = posts.length / 30

  return {
    followers: estimatedFollowers,
    posts: posts.length,
    engagement: parseFloat(engagement.toFixed(2)),
    avgPostPerDay: parseFloat(avgPostPerDay.toFixed(2)),
    hashtags,
    postTypes,
    postTimes,
    rawPosts: posts
  }
}

function analyzeFacebookData(tmsData: any) {
  const posts = tmsData.data || []

  const hashtags = extractHashtags(posts)
  const postTypes = analyzePostTypes(posts)
  const postTimes = analyzePostTimes(posts)

  const totalEngagement = posts.reduce((sum: number, post: any) => {
    return sum + (post.likes || 0) + (post.comments || 0) + (post.shares || 0)
  }, 0)

  const estimatedFollowers = Math.round((totalEngagement / posts.length) * 100) || 1000

  const engagement = estimatedFollowers > 0 ? (totalEngagement / (estimatedFollowers * posts.length)) * 100 : 0
  const avgPostPerDay = posts.length / 30

  return {
    followers: estimatedFollowers,
    posts: posts.length,
    engagement: parseFloat(engagement.toFixed(2)),
    avgPostPerDay: parseFloat(avgPostPerDay.toFixed(2)),
    hashtags,
    postTypes,
    postTimes,
    rawPosts: posts
  }
}

function extractHashtags(posts: any[]): string[] {
  const hashtagMap = new Map<string, number>()

  posts.forEach(post => {
    // TMS API uses 'title' and 'description' for post content
    const text = post.title || post.description || post.text || post.caption || post.content || ''
    const matches = text.match(/#[\w]+/g) || []

    matches.forEach((tag: string) => {
      const count = hashtagMap.get(tag) || 0
      hashtagMap.set(tag, count + 1)
    })
  })

  return Array.from(hashtagMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([tag]) => tag)
}

function calculateAvgPostPerDay(posts: any[]): number {
  if (posts.length === 0) return 0

  // Parse dates and find date range
  const dates = posts
    .map(p => {
      const dateStr = p.published_at || p.timestamp || p.created_at
      if (!dateStr) return null
      return new Date(dateStr)
    })
    .filter(d => d && !isNaN(d.getTime())) as Date[]

  if (dates.length === 0) return 0

  // Find earliest and latest dates
  const sortedDates = dates.sort((a, b) => a.getTime() - b.getTime())
  const earliest = sortedDates[0]
  const latest = sortedDates[sortedDates.length - 1]

  // Calculate days between
  const daysDiff = Math.ceil((latest.getTime() - earliest.getTime()) / (1000 * 60 * 60 * 24))

  // Avoid division by zero
  if (daysDiff === 0) return posts.length

  return posts.length / daysDiff
}

function analyzePostTypes(posts: any[]) {
  const types = new Map<string, { count: number; totalEngagement: number }>()

  posts.forEach(post => {
    let type = 'text'
    if (post.media_type === 'photo' || post.image) type = 'image'
    if (post.media_type === 'video' || post.video) type = 'video'
    if (post.media_type === 'carousel') type = 'carousel'

    // TMS API field names: like_count, comment_count
    const engagement = (post.like_count || post.likes || 0) +
                      (post.comment_count || post.comments || 0) +
                      (post.shares || 0) +
                      (post.retweets || 0)

    const current = types.get(type) || { count: 0, totalEngagement: 0 }
    types.set(type, {
      count: current.count + 1,
      totalEngagement: current.totalEngagement + engagement
    })
  })

  return Array.from(types.entries()).map(([type, data]) => ({
    type,
    count: data.count,
    avgEngagement: data.count > 0 ? parseFloat((data.totalEngagement / data.count).toFixed(2)) : 0
  }))
}

function analyzePostTimes(posts: any[]) {
  const times = new Array(24).fill(0)

  posts.forEach(post => {
    // TMS API uses published_at
    const dateStr = post.published_at || post.created_at || post.timestamp || post.date
    if (dateStr) {
      const date = new Date(dateStr)
      if (!isNaN(date.getTime())) {
        const hour = date.getHours()
        times[hour]++
      }
    }
  })

  return times.map((count, hour) => ({ hour, count }))
}

async function generateComparativeAnalysis(brandData: BrandAnalysisData[], focusBrandName: string) {
  // 1. Audience Comparison - Include ALL configured platforms
  const audienceComparison = brandData.map(brand => ({
    brand: brand.brandName,
    platforms: Object.entries(brand.platforms).map(([platform, data]) => ({
      platform,
      followers: data.followers,
      configured: data.configured || true,
      dataAvailable: data.dataAvailable || false
    }))
  }))

  // 2. Post Channel Data (Pie chart data) - Include ALL configured platforms
  const postChannelData = brandData.map(brand => ({
    brand: brand.brandName,
    channels: Object.entries(brand.platforms).map(([platform, data]) => ({
      platform,
      avgPostPerDay: data.avgPostPerDay,
      totalPosts: data.posts,
      configured: data.configured || true,
      dataAvailable: data.dataAvailable || false
    }))
  }))

  // 3. Hashtag Analysis
  const hashtagAnalysis = brandData.map(brand => ({
    brand: brand.brandName,
    topHashtags: Object.values(brand.platforms).flatMap(p => p.hashtags).slice(0, 15)
  }))

  // 4. Post Type & Engagement - Aggregate by type across all platforms
  const postTypeEngagement = brandData.map(brand => {
    const allPostTypes = Object.entries(brand.platforms).flatMap(([platform, p]) =>
      p.postTypes.map(pt => ({ ...pt, platform }))
    )

    // Aggregate by type (combining data from all platforms)
    const typeMap = new Map<string, { count: number; totalEngagement: number; platforms: Set<string> }>()

    allPostTypes.forEach(pt => {
      const key = pt.type
      const current = typeMap.get(key) || { count: 0, totalEngagement: 0, platforms: new Set() }
      typeMap.set(key, {
        count: current.count + pt.count,
        totalEngagement: current.totalEngagement + (pt.avgEngagement * pt.count),
        platforms: current.platforms.add(pt.platform)
      })
    })

    return {
      brand: brand.brandName,
      postTypes: Array.from(typeMap.entries()).map(([type, data]) => ({
        type: type.charAt(0).toUpperCase() + type.slice(1), // Capitalize first letter
        count: data.count,
        avgEngagement: data.count > 0 ? parseFloat((data.totalEngagement / data.count).toFixed(2)) : 0,
        platforms: Array.from(data.platforms).join(', ') // Show which platforms
      }))
    }
  })

  // 5. Post Timing Data
  const postTimingData = {
    focusBrand: brandData.find(b => b.brandName === focusBrandName),
    competitors: brandData.filter(b => b.brandName !== focusBrandName)
  }

  // 6. Brand Equity (composite score)
  const brandEquityData = brandData.map(brand => {
    const platforms = Object.values(brand.platforms)
    const platformCount = platforms.length

    const totalFollowers = platforms.reduce((sum, p) => sum + p.followers, 0)

    // Calculate weighted average engagement (by followers)
    const totalFollowersForAvg = platforms.reduce((sum, p: any) => sum + p.followers, 0)
    const avgEngagement = totalFollowersForAvg > 0
      ? platforms.reduce((sum, p: any) => sum + (p.engagement * p.followers), 0) / totalFollowersForAvg
      : platforms.reduce((sum, p: any) => sum + p.engagement, 0) / platformCount

    const contentVelocity = platforms.reduce((sum, p) => sum + p.avgPostPerDay, 0)

    // Composite score (weighted) - normalized scale
    // Reach score: normalize followers to 0-100 scale (assuming 500K as high)
    const reachScore = Math.min((totalFollowers / 500000) * 100, 100)
    // Engagement score: already in percentage (0-100)
    const engagementScore = Math.min(avgEngagement * 10, 100) // multiply by 10 to scale up small percentages
    // Content score: normalize velocity (assuming 2/day as good)
    const contentScore = Math.min((contentVelocity / 2) * 100, 100)

    const equityScore = (reachScore * 0.4) + (engagementScore * 0.4) + (contentScore * 0.2)

    return {
      brand: brand.brandName,
      totalFollowers,
      avgEngagement: parseFloat(avgEngagement.toFixed(2)),
      contentVelocity: parseFloat(contentVelocity.toFixed(2)),
      equityScore: parseFloat(equityScore.toFixed(1))
    }
  })

  // Additional Metrics
  const additionalMetrics = {
    totalBrandsAnalyzed: brandData.length,
    totalPlatforms: brandData.reduce((sum, b) => sum + Object.keys(b.platforms).length, 0),
    analysisDate: new Date().toISOString(),
    dataRange: '30 days'
  }

  return {
    audienceComparison,
    postChannelData,
    hashtagAnalysis,
    postTypeEngagement,
    postTimingData,
    brandEquityData,
    additionalMetrics
  }
}

/**
 * Generate keyword clustering analysis for all brands
 */
async function generateKeywordClustering(brandData: BrandAnalysisData[]) {
  const keywordAnalyses: any[] = []

  brandData.forEach(brand => {
    Object.entries(brand.platforms).forEach(([platform, data]) => {
      if (data.rawPosts && data.rawPosts.length > 0) {
        log(`  🔤 Analyzing keywords for ${brand.brandName} on ${platform}`)

        const analysis = analyzePostsByKeywords(
          data.rawPosts,
          brand.brandName,
          platform,
          40 // Last 30-40 posts
        )

        if (analysis.clusters.length > 0) {
          keywordAnalyses.push(analysis)
        }
      }
    })
  })

  return keywordAnalyses
}
