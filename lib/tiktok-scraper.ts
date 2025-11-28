/**
 * TikTok Follower Scraper
 * Uses multiple methods to get accurate follower counts (same approach as Instagram)
 */

import axios from 'axios'
import * as cheerio from 'cheerio'
import { prisma } from './db'

interface TikTokProfile {
  username: string
  displayName: string
  followers: number
  following: number
  likes: number
  videos: number
  bio: string
  isVerified: boolean
  avatarUrl: string
  scrapedAt: Date
}

// Cache duration: 6 hours
const CACHE_DURATION_MS = 6 * 60 * 60 * 1000

/**
 * Method 1: TikTok Web API (Best - Most Accurate)
 */
async function scrapeViaTikTokAPI(username: string): Promise<TikTokProfile | null> {
  try {
    console.log(`🔍 Attempting TikTok Web API for @${username}...`)

    // TikTok web API endpoint
    const response = await axios.get(`https://www.tiktok.com/@${username}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
      },
      timeout: 15000
    })

    const html = response.data
    const $ = cheerio.load(html)

    // Method 1a: Extract from __UNIVERSAL_DATA_FOR_REHYDRATION__ (TikTok's main data object)
    const scripts = $('script').toArray()
    for (const script of scripts) {
      const scriptContent = $(script).html() || ''

      if (scriptContent.includes('__UNIVERSAL_DATA_FOR_REHYDRATION__')) {
        try {
          const match = scriptContent.match(/__UNIVERSAL_DATA_FOR_REHYDRATION__\s*=\s*({.+?});/)
          if (match) {
            const data = JSON.parse(match[1])
            const userDetail = data?.__DEFAULT_SCOPE__?.['webapp.user-detail']?.userInfo?.user

            if (userDetail) {
              const profile: TikTokProfile = {
                username: userDetail.uniqueId || username,
                displayName: userDetail.nickname || '',
                followers: parseInt(userDetail.followerCount) || 0,
                following: parseInt(userDetail.followingCount) || 0,
                likes: parseInt(userDetail.heartCount) || 0,
                videos: parseInt(userDetail.videoCount) || 0,
                bio: userDetail.signature || '',
                isVerified: userDetail.verified || false,
                avatarUrl: userDetail.avatarLarger || userDetail.avatarMedium || '',
                scrapedAt: new Date()
              }

              console.log(`✅ TikTok API success: ${profile.followers.toLocaleString()} followers`)
              return profile
            }
          }
        } catch (e) {
          console.log('⚠️ Failed to parse __UNIVERSAL_DATA_FOR_REHYDRATION__')
        }
      }

      // Method 1b: Extract from SIGI_STATE (alternative data structure)
      if (scriptContent.includes('SIGI_STATE')) {
        try {
          const match = scriptContent.match(/SIGI_STATE\s*=\s*({.+?});/)
          if (match) {
            const data = JSON.parse(match[1])
            const userModule = data?.UserModule?.users?.[Object.keys(data.UserModule?.users || {})[0]]

            if (userModule) {
              const profile: TikTokProfile = {
                username: userModule.uniqueId || username,
                displayName: userModule.nickname || '',
                followers: parseInt(userModule.followerCount) || 0,
                following: parseInt(userModule.followingCount) || 0,
                likes: parseInt(userModule.heartCount) || 0,
                videos: parseInt(userModule.videoCount) || 0,
                bio: userModule.signature || '',
                isVerified: userModule.verified || false,
                avatarUrl: userModule.avatarLarger || userModule.avatarMedium || '',
                scrapedAt: new Date()
              }

              console.log(`✅ SIGI_STATE success: ${profile.followers.toLocaleString()} followers`)
              return profile
            }
          }
        } catch (e) {
          console.log('⚠️ Failed to parse SIGI_STATE')
        }
      }
    }

    // Method 1c: Extract from meta tags
    const metaDescription = $('meta[name="description"]').attr('content') || ''
    const followersMatch = metaDescription.match(/([\d.]+[KMB]?)\s+Followers/i)
    const followingMatch = metaDescription.match(/([\d.]+[KMB]?)\s+Following/i)
    const likesMatch = metaDescription.match(/([\d.]+[KMB]?)\s+Likes/i)

    if (followersMatch) {
      const profile: TikTokProfile = {
        username,
        displayName: $('meta[property="og:title"]').attr('content')?.split('|')[0]?.trim() || '',
        followers: parseMetricString(followersMatch[1]),
        following: followingMatch ? parseMetricString(followingMatch[1]) : 0,
        likes: likesMatch ? parseMetricString(likesMatch[1]) : 0,
        videos: 0,
        bio: metaDescription || '',
        isVerified: false,
        avatarUrl: $('meta[property="og:image"]').attr('content') || '',
        scrapedAt: new Date()
      }

      console.log(`✅ Meta tags success: ${profile.followers.toLocaleString()} followers`)
      return profile
    }

  } catch (error: any) {
    console.log(`⚠️ TikTok API failed: ${error.message}`)
  }

  return null
}

/**
 * Method 2: TikTok Mobile API
 */
async function scrapeViaMobileAPI(username: string): Promise<TikTokProfile | null> {
  try {
    console.log(`🔍 Attempting TikTok Mobile API for @${username}...`)

    const response = await axios.get(`https://m.tiktok.com/api/user/detail/`, {
      params: {
        uniqueId: username
      },
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        'Accept': 'application/json',
        'Referer': `https://m.tiktok.com/@${username}`,
      },
      timeout: 10000
    })

    if (response.data?.userInfo?.user) {
      const user = response.data.userInfo.user
      const stats = response.data.userInfo.stats

      const profile: TikTokProfile = {
        username: user.uniqueId || username,
        displayName: user.nickname || '',
        followers: parseInt(stats?.followerCount) || 0,
        following: parseInt(stats?.followingCount) || 0,
        likes: parseInt(stats?.heartCount) || 0,
        videos: parseInt(stats?.videoCount) || 0,
        bio: user.signature || '',
        isVerified: user.verified || false,
        avatarUrl: user.avatarLarger || user.avatarMedium || '',
        scrapedAt: new Date()
      }

      console.log(`✅ Mobile API success: ${profile.followers.toLocaleString()} followers`)
      return profile
    }
  } catch (error: any) {
    console.log(`⚠️ Mobile API failed: ${error.message}`)
  }

  return null
}

/**
 * Method 3: Alternative extraction from page HTML
 */
async function scrapeViaPageHTML(username: string): Promise<TikTokProfile | null> {
  try {
    console.log(`🔍 Attempting TikTok page HTML for @${username}...`)

    const response = await axios.get(`https://www.tiktok.com/@${username}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      timeout: 15000
    })

    const html = response.data
    const $ = cheerio.load(html)

    // Try to find data-e2e attributes (TikTok uses these for stats)
    const followersEl = $('[data-e2e="followers-count"]').first()
    const followingEl = $('[data-e2e="following-count"]').first()

    if (followersEl.length > 0) {
      const profile: TikTokProfile = {
        username,
        displayName: $('[data-e2e="user-title"]').first().text().trim() || '',
        followers: parseMetricString(followersEl.text().trim()),
        following: parseMetricString(followingEl.text().trim()),
        likes: 0,
        videos: 0,
        bio: $('[data-e2e="user-bio"]').first().text().trim() || '',
        isVerified: $('[data-e2e="user-verified"]').length > 0,
        avatarUrl: $('[data-e2e="user-avatar"]').find('img').attr('src') || '',
        scrapedAt: new Date()
      }

      console.log(`✅ Page HTML success: ${profile.followers.toLocaleString()} followers`)
      return profile
    }

  } catch (error: any) {
    console.log(`⚠️ Page HTML failed: ${error.message}`)
  }

  return null
}

/**
 * Parse metric strings like "1.5M", "234K", "1,234" to numbers
 */
function parseMetricString(str: string): number {
  if (!str) return 0

  const cleanStr = str.replace(/,/g, '').trim()
  const multipliers: { [key: string]: number } = {
    'K': 1000,
    'M': 1000000,
    'B': 1000000000
  }

  const match = cleanStr.match(/^([\d.]+)([KMB])?$/i)
  if (!match) return 0

  const num = parseFloat(match[1])
  const multiplier = match[2] ? multipliers[match[2].toUpperCase()] : 1

  return Math.round(num * multiplier)
}

/**
 * Get cached TikTok profile data from database
 */
async function getCachedProfile(username: string): Promise<TikTokProfile | null> {
  try {
    const cached = await prisma.tiktokCache.findUnique({
      where: { username: username.toLowerCase() }
    })

    if (cached) {
      const age = Date.now() - cached.scrapedAt.getTime()
      if (age < CACHE_DURATION_MS) {
        console.log(`💾 Using cached data for @${username} (${Math.round(age / 1000 / 60)} minutes old)`)
        return {
          username: cached.username,
          displayName: cached.displayName || '',
          followers: cached.followers,
          following: cached.following,
          likes: cached.likes,
          videos: cached.videos,
          bio: cached.bio || '',
          isVerified: cached.isVerified,
          avatarUrl: cached.avatarUrl || '',
          scrapedAt: cached.scrapedAt
        }
      } else {
        console.log(`🗑️ Cache expired for @${username} (${Math.round(age / 1000 / 60 / 60)} hours old)`)
      }
    }
  } catch (error) {
    console.log('⚠️ Cache read error:', error)
  }

  return null
}

/**
 * Save TikTok profile data to cache
 */
async function cacheProfile(profile: TikTokProfile): Promise<void> {
  try {
    await prisma.tiktokCache.upsert({
      where: { username: profile.username.toLowerCase() },
      create: {
        username: profile.username.toLowerCase(),
        displayName: profile.displayName,
        followers: profile.followers,
        following: profile.following,
        likes: profile.likes,
        videos: profile.videos,
        bio: profile.bio,
        isVerified: profile.isVerified,
        avatarUrl: profile.avatarUrl,
        scrapedAt: profile.scrapedAt
      },
      update: {
        displayName: profile.displayName,
        followers: profile.followers,
        following: profile.following,
        likes: profile.likes,
        videos: profile.videos,
        bio: profile.bio,
        isVerified: profile.isVerified,
        avatarUrl: profile.avatarUrl,
        scrapedAt: profile.scrapedAt
      }
    })
    console.log(`💾 Cached profile for @${profile.username}`)
  } catch (error) {
    console.log('⚠️ Cache write error:', error)
  }
}

/**
 * Main function: Get TikTok follower count with fallback methods
 */
export async function getTikTokFollowers(username: string): Promise<TikTokProfile | null> {
  if (!username) {
    console.log('❌ No username provided')
    return null
  }

  // Remove @ symbol if present
  username = username.replace(/^@/, '').trim()

  console.log(`\n📊 Fetching TikTok data for @${username}...`)

  // 1. Check cache first
  const cached = await getCachedProfile(username)
  if (cached) {
    return cached
  }

  // 2. Try multiple scraping methods in order of reliability
  const methods = [
    scrapeViaTikTokAPI,
    scrapeViaMobileAPI,
    scrapeViaPageHTML,
  ]

  for (const method of methods) {
    const profile = await method(username)
    if (profile && profile.followers > 0) {
      // Cache successful result
      await cacheProfile(profile)
      return profile
    }

    // Rate limit delay between methods
    await new Promise(resolve => setTimeout(resolve, 2000))
  }

  console.log(`❌ All methods failed for @${username}`)
  return null
}

/**
 * Batch get TikTok followers for multiple accounts
 */
export async function getTikTokFollowersBatch(usernames: string[]): Promise<Map<string, TikTokProfile>> {
  const results = new Map<string, TikTokProfile>()

  console.log(`\n📊 Batch fetching ${usernames.length} TikTok profiles...`)

  // Process in batches of 3 to avoid rate limits
  const batchSize = 3
  for (let i = 0; i < usernames.length; i += batchSize) {
    const batch = usernames.slice(i, i + batchSize)

    const profiles = await Promise.all(
      batch.map(username => getTikTokFollowers(username))
    )

    profiles.forEach((profile, idx) => {
      if (profile) {
        results.set(batch[idx], profile)
      }
    })

    // Delay between batches
    if (i + batchSize < usernames.length) {
      console.log('⏳ Waiting 3 seconds before next batch...')
      await new Promise(resolve => setTimeout(resolve, 3000))
    }
  }

  console.log(`✅ Successfully fetched ${results.size}/${usernames.length} profiles`)
  return results
}
