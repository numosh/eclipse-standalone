/**
 * Author Profiler Service
 *
 * Extracts users from Earn Voice analysis, fetches their profiles,
 * retrieves their recent posts, and prepares data for AI categorization.
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export interface AuthorProfileData {
  username: string
  displayName: string
  platform: string
  followers: number
  following: number
  totalPosts: number
  verified: boolean
  bio?: string
  location?: string
  website?: string
  profileUrl?: string
  recentPosts: AuthorPostData[]
}

export interface AuthorPostData {
  platform: string
  postId: string
  text: string
  publishedAt: Date
  likes: number
  comments: number
  shares: number
  engagement: number
  mediaType?: string
  hashtags?: string[]
  mentions?: string[]
}

/**
 * Extract authors from Earn Voice analysis
 * Returns list of users who mentioned the brand (excluding the brand itself)
 */
export async function extractAuthorsFromEarnVoice(
  voiceAnalysis: any,
  brandName: string
): Promise<Array<{ username: string; platform: string; mentions: number; followers: number }>> {
  if (!voiceAnalysis || !voiceAnalysis.earnVoice) {
    console.log('⚠️ No earn voice data available')
    return []
  }

  const earnVoice = voiceAnalysis.earnVoice
  const topMentioners = earnVoice.topMentioners || []

  console.log(`📋 Found ${topMentioners.length} top mentioners for ${brandName}`)

  return topMentioners.map((mentioner: any) => ({
    username: mentioner.username,
    platform: mentioner.platform || 'unknown',
    mentions: mentioner.mentions || 0,
    followers: mentioner.followers || 0
  }))
}

/**
 * Fetch author profile from TMS API
 * Supports Instagram, TikTok, Twitter platforms
 */
export async function fetchAuthorProfile(
  username: string,
  platform: string
): Promise<AuthorProfileData | null> {
  try {
    console.log(`🔍 Fetching profile for ${username} on ${platform}...`)

    const baseUrl = process.env.TMS_API_URL || 'https://api.tms.com'
    const apiKey = process.env.TMS_API_KEY

    if (!apiKey) {
      console.error('❌ TMS API key not configured')
      return null
    }

    let endpoint = ''
    switch (platform.toLowerCase()) {
      case 'instagram':
        endpoint = `/instagram/profile/${username}`
        break
      case 'tiktok':
        endpoint = `/tiktok/profile/${username}`
        break
      case 'twitter':
        endpoint = `/twitter/profile/${username}`
        break
      default:
        console.warn(`⚠️ Unsupported platform: ${platform}`)
        return null
    }

    const response = await fetch(`${baseUrl}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      console.error(`❌ Failed to fetch profile: ${response.status}`)
      return null
    }

    const data = await response.json()

    // Normalize response based on platform
    const profile = normalizeProfileData(data, platform)
    console.log(`✅ Profile fetched: @${username} (${profile.followers} followers)`)

    return profile
  } catch (error) {
    console.error(`❌ Error fetching profile for ${username}:`, error)
    return null
  }
}

/**
 * Fetch recent posts for an author (limit: 10)
 */
export async function fetchAuthorPosts(
  username: string,
  platform: string,
  limit: number = 10
): Promise<AuthorPostData[]> {
  try {
    console.log(`📰 Fetching last ${limit} posts for @${username} on ${platform}...`)

    const baseUrl = process.env.TMS_API_URL || 'https://api.tms.com'
    const apiKey = process.env.TMS_API_KEY

    if (!apiKey) {
      console.error('❌ TMS API key not configured')
      return []
    }

    let endpoint = ''
    switch (platform.toLowerCase()) {
      case 'instagram':
        endpoint = `/instagram/posts/${username}?limit=${limit}`
        break
      case 'tiktok':
        endpoint = `/tiktok/posts/${username}?limit=${limit}`
        break
      case 'twitter':
        endpoint = `/twitter/posts/${username}?limit=${limit}`
        break
      default:
        console.warn(`⚠️ Unsupported platform: ${platform}`)
        return []
    }

    const response = await fetch(`${baseUrl}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      console.error(`❌ Failed to fetch posts: ${response.status}`)
      return []
    }

    const data = await response.json()
    const posts = data.data || data.posts || []

    // Normalize posts based on platform
    const normalizedPosts = posts.slice(0, limit).map((post: any) =>
      normalizePostData(post, platform)
    )

    console.log(`✅ Fetched ${normalizedPosts.length} posts for @${username}`)

    return normalizedPosts
  } catch (error) {
    console.error(`❌ Error fetching posts for ${username}:`, error)
    return []
  }
}

/**
 * Normalize profile data from different platforms
 */
function normalizeProfileData(data: any, platform: string): AuthorProfileData {
  switch (platform.toLowerCase()) {
    case 'instagram':
      return {
        username: data.username || data.user?.username || '',
        displayName: data.full_name || data.user?.full_name || data.username || '',
        platform: 'instagram',
        followers: data.followers || data.follower_count || 0,
        following: data.following || data.following_count || 0,
        totalPosts: data.posts || data.media_count || 0,
        verified: data.is_verified || data.verified || false,
        bio: data.biography || data.bio || '',
        location: data.location || '',
        website: data.website || data.external_url || '',
        profileUrl: `https://instagram.com/${data.username}`,
        recentPosts: []
      }

    case 'tiktok':
      return {
        username: data.username || data.uniqueId || '',
        displayName: data.nickname || data.displayName || data.username || '',
        platform: 'tiktok',
        followers: data.followerCount || data.fans || 0,
        following: data.followingCount || data.following || 0,
        totalPosts: data.videoCount || data.videos || 0,
        verified: data.verified || false,
        bio: data.signature || data.bio || '',
        location: '',
        website: '',
        profileUrl: `https://tiktok.com/@${data.username}`,
        recentPosts: []
      }

    case 'twitter':
      return {
        username: data.username || data.screen_name || '',
        displayName: data.name || data.displayName || data.username || '',
        platform: 'twitter',
        followers: data.followers_count || data.followers || 0,
        following: data.following_count || data.friends_count || 0,
        totalPosts: data.statuses_count || data.tweets || 0,
        verified: data.verified || false,
        bio: data.description || data.bio || '',
        location: data.location || '',
        website: data.url || '',
        profileUrl: `https://twitter.com/${data.username}`,
        recentPosts: []
      }

    default:
      throw new Error(`Unsupported platform: ${platform}`)
  }
}

/**
 * Normalize post data from different platforms
 */
function normalizePostData(post: any, platform: string): AuthorPostData {
  switch (platform.toLowerCase()) {
    case 'instagram':
      return {
        platform: 'instagram',
        postId: post.id || post.pk || '',
        text: post.caption?.text || post.caption || '',
        publishedAt: new Date(post.taken_at * 1000 || post.timestamp || Date.now()),
        likes: post.like_count || 0,
        comments: post.comment_count || 0,
        shares: 0, // Instagram doesn't expose shares
        engagement: (post.like_count || 0) + (post.comment_count || 0),
        mediaType: post.media_type === 1 ? 'photo' : post.media_type === 2 ? 'video' : 'carousel',
        hashtags: extractHashtagsFromText(post.caption?.text || post.caption || ''),
        mentions: extractMentionsFromText(post.caption?.text || post.caption || '')
      }

    case 'tiktok':
      return {
        platform: 'tiktok',
        postId: post.id || post.video?.id || '',
        text: post.desc || post.description || '',
        publishedAt: new Date(post.createTime * 1000 || post.timestamp || Date.now()),
        likes: post.stats?.diggCount || post.like_count || 0,
        comments: post.stats?.commentCount || post.comment_count || 0,
        shares: post.stats?.shareCount || post.share_count || 0,
        engagement: (post.stats?.diggCount || 0) + (post.stats?.commentCount || 0) + (post.stats?.shareCount || 0),
        mediaType: 'video',
        hashtags: post.challenges?.map((c: any) => c.title) || extractHashtagsFromText(post.desc || ''),
        mentions: extractMentionsFromText(post.desc || '')
      }

    case 'twitter':
      return {
        platform: 'twitter',
        postId: post.id_str || post.id || '',
        text: post.full_text || post.text || '',
        publishedAt: new Date(post.created_at || Date.now()),
        likes: post.favorite_count || post.likes || 0,
        comments: post.reply_count || post.replies || 0,
        shares: post.retweet_count || post.retweets || 0,
        engagement: (post.favorite_count || 0) + (post.reply_count || 0) + (post.retweet_count || 0),
        mediaType: post.entities?.media?.[0]?.type || 'text',
        hashtags: post.entities?.hashtags?.map((h: any) => h.text) || extractHashtagsFromText(post.full_text || post.text || ''),
        mentions: post.entities?.user_mentions?.map((m: any) => m.screen_name) || extractMentionsFromText(post.full_text || post.text || '')
      }

    default:
      throw new Error(`Unsupported platform: ${platform}`)
  }
}

/**
 * Extract hashtags from text
 */
function extractHashtagsFromText(text: string): string[] {
  const hashtagRegex = /#[\w\u0E00-\u0E7F]+/g
  const matches = text.match(hashtagRegex) || []
  return matches.map(tag => tag.slice(1)) // Remove # symbol
}

/**
 * Extract mentions from text
 */
function extractMentionsFromText(text: string): string[] {
  const mentionRegex = /@[\w\u0E00-\u0E7F]+/g
  const matches = text.match(mentionRegex) || []
  return matches.map(mention => mention.slice(1)) // Remove @ symbol
}

/**
 * Save author profile to database
 */
export async function saveAuthorProfile(
  sessionId: string,
  profile: AuthorProfileData,
  mentionCount: number = 0
): Promise<string> {
  try {
    console.log(`💾 Saving profile: @${profile.username} to database...`)

    const authorProfile = await prisma.authorProfile.create({
      data: {
        sessionId,
        username: profile.username,
        displayName: profile.displayName,
        platform: profile.platform,
        followers: profile.followers,
        following: profile.following,
        totalPosts: profile.totalPosts,
        verified: profile.verified,
        bio: profile.bio,
        location: profile.location,
        website: profile.website,
        profileUrl: profile.profileUrl,
        mentionCount,
        // Calculate metrics from posts
        avgLikes: profile.recentPosts.length > 0
          ? profile.recentPosts.reduce((sum, p) => sum + p.likes, 0) / profile.recentPosts.length
          : null,
        avgComments: profile.recentPosts.length > 0
          ? profile.recentPosts.reduce((sum, p) => sum + p.comments, 0) / profile.recentPosts.length
          : null,
        avgShares: profile.recentPosts.length > 0
          ? profile.recentPosts.reduce((sum, p) => sum + p.shares, 0) / profile.recentPosts.length
          : null,
        engagementRate: profile.followers > 0 && profile.recentPosts.length > 0
          ? (profile.recentPosts.reduce((sum, p) => sum + p.engagement, 0) / profile.recentPosts.length / profile.followers) * 100
          : null,
        postFrequency: calculatePostFrequency(profile.recentPosts)
      }
    })

    // Save posts
    if (profile.recentPosts.length > 0) {
      await prisma.authorPost.createMany({
        data: profile.recentPosts.map(post => ({
          authorId: authorProfile.id,
          platform: post.platform,
          postId: post.postId,
          text: post.text,
          publishedAt: post.publishedAt,
          likes: post.likes,
          comments: post.comments,
          shares: post.shares,
          engagement: post.engagement,
          mediaType: post.mediaType,
          hashtags: post.hashtags ? JSON.stringify(post.hashtags) : null,
          mentions: post.mentions ? JSON.stringify(post.mentions) : null
        }))
      })
    }

    console.log(`✅ Saved @${profile.username} with ${profile.recentPosts.length} posts`)

    return authorProfile.id
  } catch (error) {
    console.error(`❌ Error saving profile for @${profile.username}:`, error)
    throw error
  }
}

/**
 * Calculate post frequency (posts per week)
 */
function calculatePostFrequency(posts: AuthorPostData[]): number | null {
  if (posts.length === 0) return null

  const dates = posts.map(p => p.publishedAt.getTime()).sort((a, b) => a - b)
  const oldestPost = new Date(dates[0])
  const newestPost = new Date(dates[dates.length - 1])

  const daysDiff = (newestPost.getTime() - oldestPost.getTime()) / (1000 * 60 * 60 * 24)

  if (daysDiff === 0) return null

  const postsPerDay = posts.length / daysDiff
  const postsPerWeek = postsPerDay * 7

  return parseFloat(postsPerWeek.toFixed(2))
}

/**
 * Main function: Profile all authors from earn voice
 */
export async function profileAuthorsFromEarnVoice(
  sessionId: string,
  voiceAnalysis: any,
  brandName: string,
  limit: number = 20
): Promise<number> {
  try {
    console.log(`\n🎯 Starting author profiling for session ${sessionId}...`)

    // Extract authors from earn voice
    const authors = await extractAuthorsFromEarnVoice(voiceAnalysis, brandName)

    if (authors.length === 0) {
      console.log('⚠️ No authors found in earn voice data')
      return 0
    }

    // Sort by followers and limit
    const topAuthors = authors
      .sort((a, b) => b.followers - a.followers)
      .slice(0, limit)

    console.log(`📊 Processing top ${topAuthors.length} authors...`)

    let profiledCount = 0

    for (const author of topAuthors) {
      try {
        // Fetch profile
        const profile = await fetchAuthorProfile(author.username, author.platform)
        if (!profile) continue

        // Fetch recent posts (10 posts)
        const posts = await fetchAuthorPosts(author.username, author.platform, 10)
        profile.recentPosts = posts

        // Save to database
        await saveAuthorProfile(sessionId, profile, author.mentions)

        profiledCount++

        // Rate limiting: wait 1 second between requests
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (error) {
        console.error(`❌ Failed to profile @${author.username}:`, error)
        continue
      }
    }

    console.log(`\n✅ Author profiling complete: ${profiledCount}/${topAuthors.length} profiles saved`)

    return profiledCount
  } catch (error) {
    console.error('❌ Error in author profiling:', error)
    throw error
  }
}
