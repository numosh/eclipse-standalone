/**
 * TikTok Comment Scraper
 * Scrapes comments from TikTok videos
 */

import axios from 'axios'
import * as cheerio from 'cheerio'

export interface TikTokComment {
  commentId: string
  commentText: string
  commentAuthor: string
  commentAuthorId?: string
  likes: number
  replies: number
  authorFollowers?: number
  authorVerified: boolean
  authorBio?: string
  publishedAt: Date
}

export interface TikTokVideoComments {
  videoId: string
  videoUrl: string
  videoAuthor: string
  comments: TikTokComment[]
  totalComments: number
}

/**
 * Scrape comments from a TikTok video
 * @param videoUrl Full URL to the TikTok video
 * @param maxComments Maximum number of comments to scrape (default 50)
 */
export async function scrapeTikTokVideoComments(
  videoUrl: string,
  maxComments: number = 50
): Promise<TikTokVideoComments | null> {
  try {
    console.log(`📝 Scraping TikTok comments from: ${videoUrl}`)

    // Extract video ID from URL
    const videoIdMatch = videoUrl.match(/\/video\/(\d+)/)
    if (!videoIdMatch) {
      console.error('❌ Invalid TikTok video URL')
      return null
    }

    const videoId = videoIdMatch[1]

    // Method 1: Try TikTok embedded data
    const embeddedComments = await scrapeViaEmbeddedData(videoUrl, videoId, maxComments)
    if (embeddedComments) {
      return embeddedComments
    }

    // Method 2: Try TikTok mobile API
    const apiComments = await scrapeViaMobileAPI(videoId, maxComments)
    if (apiComments) {
      return apiComments
    }

    console.log('❌ All methods failed to scrape TikTok comments')
    return null
  } catch (error) {
    console.error('Error scraping TikTok comments:', error)
    return null
  }
}

/**
 * Method 1: Scrape from embedded page data
 */
async function scrapeViaEmbeddedData(
  videoUrl: string,
  videoId: string,
  maxComments: number
): Promise<TikTokVideoComments | null> {
  try {
    console.log('🔍 Attempting TikTok embedded data extraction...')

    const response = await axios.get(videoUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      timeout: 15000
    })

    const html = response.data
    const $ = cheerio.load(html)

    // Find SIGI_STATE or __UNIVERSAL_DATA_FOR_REHYDRATION__
    const scripts = $('script').toArray()
    for (const script of scripts) {
      const scriptContent = $(script).html() || ''

      // Try __UNIVERSAL_DATA_FOR_REHYDRATION__
      if (scriptContent.includes('__UNIVERSAL_DATA_FOR_REHYDRATION__')) {
        const match = scriptContent.match(/__UNIVERSAL_DATA_FOR_REHYDRATION__\s*=\s*({.+?});/)
        if (match) {
          const data = JSON.parse(match[1])
          const videoDetail = data?.__DEFAULT_SCOPE__?.['webapp.video-detail']

          if (videoDetail?.itemInfo?.itemStruct) {
            const video = videoDetail.itemInfo.itemStruct
            const commentList = videoDetail.commentList || []

            const comments = extractTikTokComments(commentList, maxComments)

            return {
              videoId,
              videoUrl,
              videoAuthor: video.author.uniqueId,
              comments,
              totalComments: video.stats.commentCount || 0
            }
          }
        }
      }

      // Try SIGI_STATE
      if (scriptContent.includes('SIGI_STATE')) {
        const match = scriptContent.match(/SIGI_STATE\s*=\s*({.+?});/)
        if (match) {
          const data = JSON.parse(match[1])
          const itemModule = data?.ItemModule?.[videoId]

          if (itemModule) {
            const commentModule = data?.CommentModule || {}
            const comments = extractTikTokCommentsFromModule(commentModule, maxComments)

            return {
              videoId,
              videoUrl,
              videoAuthor: itemModule.author,
              comments,
              totalComments: itemModule.stats?.commentCount || 0
            }
          }
        }
      }
    }

    console.log('⚠️ Embedded data method failed')
    return null
  } catch (error: any) {
    console.log(`⚠️ Embedded data error: ${error.message}`)
    return null
  }
}

/**
 * Method 2: TikTok Mobile API
 */
async function scrapeViaMobileAPI(videoId: string, maxComments: number): Promise<TikTokVideoComments | null> {
  try {
    console.log('🔍 Attempting TikTok Mobile API...')

    // This would require TikTok's actual API endpoints which may require authentication
    // For now, we'll return null as a placeholder

    console.log('⚠️ Mobile API method not yet implemented')
    return null
  } catch (error: any) {
    console.log(`⚠️ Mobile API error: ${error.message}`)
    return null
  }
}

/**
 * Extract comments from TikTok comment list
 */
function extractTikTokComments(commentList: any[], maxComments: number): TikTokComment[] {
  const comments: TikTokComment[] = []

  try {
    for (const comment of commentList.slice(0, maxComments)) {
      comments.push({
        commentId: comment.cid,
        commentText: comment.text,
        commentAuthor: comment.user.uniqueId,
        commentAuthorId: comment.user.uid,
        likes: comment.digg_count || 0,
        replies: comment.reply_comment_total || 0,
        authorFollowers: undefined,
        authorVerified: comment.user.verified || false,
        authorBio: comment.user.signature,
        publishedAt: new Date(comment.create_time * 1000)
      })
    }
  } catch (error) {
    console.error('Error extracting TikTok comments:', error)
  }

  return comments
}

/**
 * Extract comments from SIGI_STATE CommentModule
 */
function extractTikTokCommentsFromModule(commentModule: any, maxComments: number): TikTokComment[] {
  const comments: TikTokComment[] = []

  try {
    const commentIds = Object.keys(commentModule).slice(0, maxComments)

    for (const commentId of commentIds) {
      const comment = commentModule[commentId]

      comments.push({
        commentId: comment.cid,
        commentText: comment.text,
        commentAuthor: comment.user?.uniqueId || 'unknown',
        commentAuthorId: comment.user?.uid,
        likes: comment.diggCount || 0,
        replies: comment.replyCommentTotal || 0,
        authorFollowers: undefined,
        authorVerified: comment.user?.verified || false,
        authorBio: comment.user?.signature,
        publishedAt: new Date(comment.createTime * 1000)
      })
    }
  } catch (error) {
    console.error('Error extracting comments from module:', error)
  }

  return comments
}

/**
 * Scrape comments from multiple TikTok videos
 */
export async function scrapeTikTokVideosComments(
  videoUrls: string[],
  maxCommentsPerVideo: number = 50
): Promise<TikTokVideoComments[]> {
  const results: TikTokVideoComments[] = []

  console.log(`\n📝 Batch scraping comments from ${videoUrls.length} TikTok videos...`)

  // Process in batches to avoid rate limits
  const batchSize = 3
  for (let i = 0; i < videoUrls.length; i += batchSize) {
    const batch = videoUrls.slice(i, i + batchSize)

    const batchResults = await Promise.all(
      batch.map(url => scrapeTikTokVideoComments(url, maxCommentsPerVideo))
    )

    batchResults.forEach(result => {
      if (result) {
        results.push(result)
      }
    })

    // Delay between batches
    if (i + batchSize < videoUrls.length) {
      console.log('⏳ Waiting 3 seconds before next batch...')
      await new Promise(resolve => setTimeout(resolve, 3000))
    }
  }

  console.log(`✅ Successfully scraped comments from ${results.length}/${videoUrls.length} videos`)
  return results
}

/**
 * Get comments for a TikTok user's recent videos
 */
export async function scrapeTikTokUserComments(
  username: string,
  videoCount: number = 10,
  maxCommentsPerVideo: number = 50
): Promise<TikTokVideoComments[]> {
  try {
    console.log(`\n📝 Scraping comments for @${username}'s recent ${videoCount} videos...`)

    // First, get the user's recent video URLs
    const videoUrls = await getRecentVideoUrls(username, videoCount)

    if (videoUrls.length === 0) {
      console.log('❌ No videos found')
      return []
    }

    // Then scrape comments from those videos
    return await scrapeTikTokVideosComments(videoUrls, maxCommentsPerVideo)
  } catch (error) {
    console.error('Error scraping user comments:', error)
    return []
  }
}

/**
 * Get recent video URLs for a TikTok username
 */
async function getRecentVideoUrls(username: string, count: number): Promise<string[]> {
  try {
    const response = await axios.get(`https://www.tiktok.com/@${username}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15',
      },
      timeout: 15000
    })

    const html = response.data
    const $ = cheerio.load(html)

    const videoUrls: string[] = []
    const scripts = $('script').toArray()

    for (const script of scripts) {
      const scriptContent = $(script).html() || ''

      if (scriptContent.includes('__UNIVERSAL_DATA_FOR_REHYDRATION__')) {
        const match = scriptContent.match(/__UNIVERSAL_DATA_FOR_REHYDRATION__\s*=\s*({.+?});/)
        if (match) {
          const data = JSON.parse(match[1])
          const userDetail = data?.__DEFAULT_SCOPE__?.['webapp.user-detail']

          if (userDetail?.itemList) {
            const videos = userDetail.itemList.slice(0, count)

            for (const video of videos) {
              videoUrls.push(`https://www.tiktok.com/@${username}/video/${video.id}`)
            }
          }
        }
      }

      if (scriptContent.includes('SIGI_STATE')) {
        const match = scriptContent.match(/SIGI_STATE\s*=\s*({.+?});/)
        if (match) {
          const data = JSON.parse(match[1])
          const itemModule = data?.ItemModule || {}

          const videoIds = Object.keys(itemModule).slice(0, count)
          for (const videoId of videoIds) {
            videoUrls.push(`https://www.tiktok.com/@${username}/video/${videoId}`)
          }
        }
      }
    }

    console.log(`📋 Found ${videoUrls.length} recent videos`)
    return videoUrls
  } catch (error) {
    console.error('Error getting recent videos:', error)
    return []
  }
}
