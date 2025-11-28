/**
 * Instagram Follower Scraper
 * Uses multiple methods to get accurate follower counts:
 * 1. Instagram Internal API (via fetch with user-agent)
 * 2. Meta tags from public profile
 * 3. JSON-LD structured data
 * 4. Cache mechanism to avoid rate limits
 */

import axios from 'axios'
import * as cheerio from 'cheerio'
import { prisma } from './db'

interface InstagramProfile {
  username: string
  fullName: string
  followers: number
  following: number
  posts: number
  biography: string
  isVerified: boolean
  profilePicUrl: string
  scrapedAt: Date
}

// Cache duration: 6 hours
const CACHE_DURATION_MS = 6 * 60 * 60 * 1000

/**
 * Method 1: Instagram Internal API (Best - Most Accurate)
 * Uses the same API Instagram's frontend uses
 */
async function scrapeViaInternalAPI(username: string): Promise<InstagramProfile | null> {
  try {
    console.log(`🔍 Attempting Instagram Internal API for @${username}...`)

    const response = await axios.get(`https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'X-IG-App-ID': '936619743392459', // Instagram web app ID
        'X-ASBD-ID': '129477',
        'X-IG-WWW-Claim': '0',
        'X-Requested-With': 'XMLHttpRequest',
        'Referer': `https://www.instagram.com/${username}/`,
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
      },
      timeout: 10000
    })

    if (response.data?.data?.user) {
      const user = response.data.data.user
      const profile: InstagramProfile = {
        username: user.username,
        fullName: user.full_name || '',
        followers: user.edge_followed_by?.count || 0,
        following: user.edge_follow?.count || 0,
        posts: user.edge_owner_to_timeline_media?.count || 0,
        biography: user.biography || '',
        isVerified: user.is_verified || false,
        profilePicUrl: user.profile_pic_url_hd || user.profile_pic_url || '',
        scrapedAt: new Date()
      }

      console.log(`✅ Internal API success: ${profile.followers.toLocaleString()} followers`)
      return profile
    }
  } catch (error: any) {
    console.log(`⚠️ Internal API failed: ${error.message}`)
  }

  return null
}

/**
 * Method 2: Public Page Scraping with Meta Tags
 * Scrapes Instagram's public profile page for JSON-LD data
 */
async function scrapeViaPublicPage(username: string): Promise<InstagramProfile | null> {
  try {
    console.log(`🔍 Attempting public page scrape for @${username}...`)

    const response = await axios.get(`https://www.instagram.com/${username}/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Cache-Control': 'max-age=0',
      },
      timeout: 15000
    })

    const html = response.data
    const $ = cheerio.load(html)

    // Method 2a: Extract from meta tags
    const metaDescription = $('meta[property="og:description"]').attr('content') || ''

    // Parse "X Followers, Y Following, Z Posts"
    const followersMatch = metaDescription.match(/([\d,\.]+[KMB]?)\s+Followers/i)
    const followingMatch = metaDescription.match(/([\d,\.]+[KMB]?)\s+Following/i)
    const postsMatch = metaDescription.match(/([\d,\.]+[KMB]?)\s+Posts/i)

    if (followersMatch) {
      const profile: InstagramProfile = {
        username,
        fullName: $('meta[property="og:title"]').attr('content')?.replace(/\s*\(@.*?\)/, '') || '',
        followers: parseMetricString(followersMatch[1]),
        following: followingMatch ? parseMetricString(followingMatch[1]) : 0,
        posts: postsMatch ? parseMetricString(postsMatch[1]) : 0,
        biography: '',
        isVerified: false,
        profilePicUrl: $('meta[property="og:image"]').attr('content') || '',
        scrapedAt: new Date()
      }

      console.log(`✅ Public page success: ${profile.followers.toLocaleString()} followers`)
      return profile
    }

    // Method 2b: Extract from JSON-LD structured data
    const scriptTags: any = $('script[type="application/ld+json"]')
    scriptTags.each((_: number, element: any) => {
      try {
        const jsonData = JSON.parse($(element).html() || '{}')
        if (jsonData['@type'] === 'Person' && jsonData.interactionStatistic) {
          const followersStat = jsonData.interactionStatistic.find(
            (stat: any) => stat['@type'] === 'InteractionCounter' && stat.interactionType === 'http://schema.org/FollowAction'
          )
          if (followersStat) {
            const profile: InstagramProfile = {
              username,
              fullName: jsonData.name || '',
              followers: parseInt(followersStat.userInteractionCount) || 0,
              following: 0,
              posts: 0,
              biography: jsonData.description || '',
              isVerified: false,
              profilePicUrl: jsonData.image || '',
              scrapedAt: new Date()
            }
            console.log(`✅ JSON-LD success: ${profile.followers.toLocaleString()} followers`)
            return profile
          }
        }
      } catch (e) {
        // Continue to next script tag
      }
    })

    // Method 2c: Extract from embedded JavaScript (window._sharedData)
    const sharedDataMatch = html.match(/window\._sharedData\s*=\s*({.+?});/)
    if (sharedDataMatch) {
      const sharedData = JSON.parse(sharedDataMatch[1])
      const userProfile = sharedData?.entry_data?.ProfilePage?.[0]?.graphql?.user

      if (userProfile) {
        const profile: InstagramProfile = {
          username: userProfile.username,
          fullName: userProfile.full_name || '',
          followers: userProfile.edge_followed_by?.count || 0,
          following: userProfile.edge_follow?.count || 0,
          posts: userProfile.edge_owner_to_timeline_media?.count || 0,
          biography: userProfile.biography || '',
          isVerified: userProfile.is_verified || false,
          profilePicUrl: userProfile.profile_pic_url_hd || userProfile.profile_pic_url || '',
          scrapedAt: new Date()
        }

        console.log(`✅ Shared data success: ${profile.followers.toLocaleString()} followers`)
        return profile
      }
    }

  } catch (error: any) {
    console.log(`⚠️ Public page scrape failed: ${error.message}`)
  }

  return null
}

/**
 * Method 3: Alternative Instagram API Endpoint
 * Uses the GraphQL query endpoint
 */
async function scrapeViaGraphQL(username: string): Promise<InstagramProfile | null> {
  try {
    console.log(`🔍 Attempting GraphQL method for @${username}...`)

    // First, get user ID from username
    const response = await axios.get(`https://www.instagram.com/${username}/?__a=1&__d=dis`, {
      headers: {
        'User-Agent': 'Instagram 76.0.0.15.395 Android (24/7.0; 640dpi; 1440x2560; samsung; SM-G930F; herolte; samsungexynos8890; en_US; 138226743)',
        'Accept': '*/*',
        'Accept-Language': 'en-US',
        'X-IG-Capabilities': '3brTvw==',
        'X-IG-Connection-Type': 'WIFI',
        'X-IG-App-ID': '936619743392459',
      },
      timeout: 10000
    })

    if (response.data?.graphql?.user) {
      const user = response.data.graphql.user
      const profile: InstagramProfile = {
        username: user.username,
        fullName: user.full_name || '',
        followers: user.edge_followed_by?.count || 0,
        following: user.edge_follow?.count || 0,
        posts: user.edge_owner_to_timeline_media?.count || 0,
        biography: user.biography || '',
        isVerified: user.is_verified || false,
        profilePicUrl: user.profile_pic_url_hd || user.profile_pic_url || '',
        scrapedAt: new Date()
      }

      console.log(`✅ GraphQL success: ${profile.followers.toLocaleString()} followers`)
      return profile
    }
  } catch (error: any) {
    console.log(`⚠️ GraphQL method failed: ${error.message}`)
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
 * Get cached Instagram profile data from database
 */
async function getCachedProfile(username: string): Promise<InstagramProfile | null> {
  try {
    const cached = await prisma.instagramCache.findUnique({
      where: { username: username.toLowerCase() }
    })

    if (cached) {
      const age = Date.now() - cached.scrapedAt.getTime()
      if (age < CACHE_DURATION_MS) {
        console.log(`💾 Using cached data for @${username} (${Math.round(age / 1000 / 60)} minutes old)`)
        return {
          username: cached.username,
          fullName: cached.fullName || '',
          followers: cached.followers,
          following: cached.following,
          posts: cached.posts,
          biography: cached.biography || '',
          isVerified: cached.isVerified,
          profilePicUrl: cached.profilePicUrl || '',
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
 * Save Instagram profile data to cache
 */
async function cacheProfile(profile: InstagramProfile): Promise<void> {
  try {
    await prisma.instagramCache.upsert({
      where: { username: profile.username.toLowerCase() },
      create: {
        username: profile.username.toLowerCase(),
        fullName: profile.fullName,
        followers: profile.followers,
        following: profile.following,
        posts: profile.posts,
        biography: profile.biography,
        isVerified: profile.isVerified,
        profilePicUrl: profile.profilePicUrl,
        scrapedAt: profile.scrapedAt
      },
      update: {
        fullName: profile.fullName,
        followers: profile.followers,
        following: profile.following,
        posts: profile.posts,
        biography: profile.biography,
        isVerified: profile.isVerified,
        profilePicUrl: profile.profilePicUrl,
        scrapedAt: profile.scrapedAt
      }
    })
    console.log(`💾 Cached profile for @${profile.username}`)
  } catch (error) {
    console.log('⚠️ Cache write error:', error)
  }
}

/**
 * Main function: Get Instagram follower count with fallback methods
 * Returns accurate follower count using multiple scraping strategies
 */
export async function getInstagramFollowers(username: string): Promise<InstagramProfile | null> {
  if (!username) {
    console.log('❌ No username provided')
    return null
  }

  // Remove @ symbol if present
  username = username.replace(/^@/, '').trim()

  console.log(`\n📊 Fetching Instagram data for @${username}...`)

  // 1. Check cache first
  const cached = await getCachedProfile(username)
  if (cached) {
    return cached
  }

  // 2. Try multiple scraping methods in order of reliability
  const methods = [
    scrapeViaInternalAPI,
    scrapeViaGraphQL,
    scrapeViaPublicPage,
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
 * Batch get Instagram followers for multiple accounts
 * Uses parallel requests with rate limiting
 */
export async function getInstagramFollowersBatch(usernames: string[]): Promise<Map<string, InstagramProfile>> {
  const results = new Map<string, InstagramProfile>()

  console.log(`\n📊 Batch fetching ${usernames.length} Instagram profiles...`)

  // Process in batches of 3 to avoid rate limits
  const batchSize = 3
  for (let i = 0; i < usernames.length; i += batchSize) {
    const batch = usernames.slice(i, i + batchSize)

    const profiles = await Promise.all(
      batch.map(username => getInstagramFollowers(username))
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
