/**
 * Author Scraper Service
 *
 * Fallback scraping when TMS API is not available or fails
 * Supports Instagram, TikTok, Twitter
 */

import * as cheerio from 'cheerio'
import { AuthorProfileData, AuthorPostData } from './author-profiler'

/**
 * Scrape Instagram profile (fallback)
 */
export async function scrapeInstagramProfile(username: string): Promise<AuthorProfileData | null> {
  try {
    console.log(`🔍 Scraping Instagram profile: @${username}...`)

    const url = `https://www.instagram.com/${username}/`
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })

    if (!response.ok) {
      console.error(`❌ Failed to fetch Instagram profile: ${response.status}`)
      return null
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    // Extract JSON data from script tags
    let profileData: any = null
    $('script[type="application/ld+json"]').each((_, element) => {
      try {
        const data = JSON.parse($(element).html() || '{}')
        if (data['@type'] === 'ProfilePage') {
          profileData = data
        }
      } catch (e) {
        // Continue to next script tag
      }
    })

    if (!profileData) {
      console.error('❌ Could not extract Instagram profile data')
      return null
    }

    const profile: AuthorProfileData = {
      username: username,
      displayName: profileData.name || username,
      platform: 'instagram',
      followers: parseInt(profileData.interactionStatistic?.find((s: any) => s.name === 'Follows')?.userInteractionCount || '0'),
      following: 0, // Not available in public scraping
      totalPosts: 0, // Not available in public scraping
      verified: false,
      bio: profileData.description || '',
      profileUrl: url,
      recentPosts: []
    }

    console.log(`✅ Scraped Instagram profile: @${username}`)
    return profile
  } catch (error) {
    console.error(`❌ Error scraping Instagram profile @${username}:`, error)
    return null
  }
}

/**
 * Scrape TikTok profile (fallback)
 */
export async function scrapeTikTokProfile(username: string): Promise<AuthorProfileData | null> {
  try {
    console.log(`🔍 Scraping TikTok profile: @${username}...`)

    const url = `https://www.tiktok.com/@${username}`
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })

    if (!response.ok) {
      console.error(`❌ Failed to fetch TikTok profile: ${response.status}`)
      return null
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    // Extract JSON data from __UNIVERSAL_DATA_FOR_REHYDRATION__
    let userData: any = null
    $('script').each((_, element) => {
      const scriptContent = $(element).html() || ''
      if (scriptContent.includes('__UNIVERSAL_DATA_FOR_REHYDRATION__')) {
        try {
          const match = scriptContent.match(/window\['__UNIVERSAL_DATA_FOR_REHYDRATION__'\]\s*=\s*({.+?});/)
          if (match) {
            const data = JSON.parse(match[1])
            userData = data.__DEFAULT_SCOPE__?.['webapp.user-detail']?.userInfo?.user
          }
        } catch (e) {
          // Continue
        }
      }
    })

    if (!userData) {
      console.error('❌ Could not extract TikTok profile data')
      return null
    }

    const profile: AuthorProfileData = {
      username: userData.uniqueId || username,
      displayName: userData.nickname || username,
      platform: 'tiktok',
      followers: userData.stats?.followerCount || 0,
      following: userData.stats?.followingCount || 0,
      totalPosts: userData.stats?.videoCount || 0,
      verified: userData.verified || false,
      bio: userData.signature || '',
      profileUrl: url,
      recentPosts: []
    }

    console.log(`✅ Scraped TikTok profile: @${username}`)
    return profile
  } catch (error) {
    console.error(`❌ Error scraping TikTok profile @${username}:`, error)
    return null
  }
}

/**
 * Scrape Twitter profile (fallback)
 */
export async function scrapeTwitterProfile(username: string): Promise<AuthorProfileData | null> {
  try {
    console.log(`🔍 Scraping Twitter profile: @${username}...`)

    // Note: Twitter/X requires authentication for most data
    // This is a basic fallback that may have limited success
    const url = `https://twitter.com/${username}`
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })

    if (!response.ok) {
      console.error(`❌ Failed to fetch Twitter profile: ${response.status}`)
      return null
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    // Twitter requires more complex extraction
    // This is a minimal fallback
    const profile: AuthorProfileData = {
      username: username,
      displayName: username,
      platform: 'twitter',
      followers: 0, // Requires authenticated API
      following: 0,
      totalPosts: 0,
      verified: false,
      bio: '',
      profileUrl: url,
      recentPosts: []
    }

    console.log(`⚠️ Twitter scraping limited - recommend using TMS API`)
    return profile
  } catch (error) {
    console.error(`❌ Error scraping Twitter profile @${username}:`, error)
    return null
  }
}

/**
 * Scrape author profile with fallback to TMS API
 */
export async function scrapeAuthorProfile(
  username: string,
  platform: string
): Promise<AuthorProfileData | null> {
  switch (platform.toLowerCase()) {
    case 'instagram':
      return await scrapeInstagramProfile(username)
    case 'tiktok':
      return await scrapeTikTokProfile(username)
    case 'twitter':
      return await scrapeTwitterProfile(username)
    default:
      console.error(`❌ Unsupported platform for scraping: ${platform}`)
      return null
  }
}

/**
 * Scrape recent posts (limited in public scraping)
 * Returns empty array as post scraping requires more complex methods
 */
export async function scrapeAuthorPosts(
  username: string,
  platform: string,
  limit: number = 10
): Promise<AuthorPostData[]> {
  console.log(`⚠️ Post scraping not fully implemented - recommend using TMS API for posts`)
  console.log(`   Platform: ${platform}, User: @${username}, Limit: ${limit}`)

  // Post scraping requires more advanced techniques:
  // - Instagram: Needs authentication or GraphQL endpoints
  // - TikTok: Needs to parse React component data
  // - Twitter: Requires authenticated API

  // For now, return empty array and rely on TMS API
  return []
}
