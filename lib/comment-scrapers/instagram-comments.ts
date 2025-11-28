/**
 * Instagram Comment Scraper
 * Scrapes comments from Instagram posts using multiple methods
 */

import axios from 'axios'
import * as cheerio from 'cheerio'

export interface InstagramComment {
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

export interface InstagramPostComments {
  postId: string
  postUrl: string
  postAuthor: string
  comments: InstagramComment[]
  totalComments: number
}

/**
 * Scrape comments from an Instagram post
 * @param postUrl Full URL to the Instagram post (e.g., https://www.instagram.com/p/ABC123/)
 * @param maxComments Maximum number of comments to scrape (default 50)
 */
export async function scrapeInstagramPostComments(
  postUrl: string,
  maxComments: number = 50
): Promise<InstagramPostComments | null> {
  try {
    console.log(`📝 Scraping Instagram comments from: ${postUrl}`)

    // Extract post ID from URL
    const postIdMatch = postUrl.match(/\/p\/([A-Za-z0-9_-]+)/)
    if (!postIdMatch) {
      console.error('❌ Invalid Instagram post URL')
      return null
    }

    const postId = postIdMatch[1]

    // Method 1: Try Instagram Internal API
    const apiComments = await scrapeViaInternalAPI(postId, maxComments)
    if (apiComments) {
      return {
        postId,
        postUrl,
        postAuthor: apiComments.postAuthor,
        comments: apiComments.comments,
        totalComments: apiComments.totalComments
      }
    }

    // Method 2: Try scraping from page HTML
    const htmlComments = await scrapeViaPageHTML(postUrl, maxComments)
    if (htmlComments) {
      return htmlComments
    }

    console.log('❌ All methods failed to scrape comments')
    return null
  } catch (error) {
    console.error('Error scraping Instagram comments:', error)
    return null
  }
}

/**
 * Method 1: Instagram Internal API
 */
async function scrapeViaInternalAPI(postId: string, maxComments: number) {
  try {
    console.log('🔍 Attempting Instagram Internal API...')

    const response = await axios.get(`https://www.instagram.com/p/${postId}/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'X-IG-App-ID': '936619743392459',
        'Referer': 'https://www.instagram.com/',
      },
      timeout: 15000
    })

    const html = response.data
    const $ = cheerio.load(html)

    // Find embedded JSON data
    const scripts = $('script').toArray()
    for (const script of scripts) {
      const scriptContent = $(script).html() || ''

      if (scriptContent.includes('window._sharedData')) {
        const match = scriptContent.match(/window\._sharedData\s*=\s*({.+?});/)
        if (match) {
          const sharedData = JSON.parse(match[1])
          const media = sharedData?.entry_data?.PostPage?.[0]?.graphql?.shortcode_media

          if (media) {
            const comments = extractCommentsFromMedia(media, maxComments)
            return {
              postAuthor: media.owner.username,
              comments,
              totalComments: media.edge_media_to_parent_comment?.count || 0
            }
          }
        }
      }
    }

    console.log('⚠️ Internal API method failed')
    return null
  } catch (error: any) {
    console.log(`⚠️ Internal API error: ${error.message}`)
    return null
  }
}

/**
 * Method 2: Scrape from page HTML
 */
async function scrapeViaPageHTML(postUrl: string, maxComments: number): Promise<InstagramPostComments | null> {
  try {
    console.log('🔍 Attempting page HTML scraping...')

    const response = await axios.get(postUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
      timeout: 15000
    })

    const html = response.data
    const $ = cheerio.load(html)

    // Extract from JSON-LD
    const scriptTags = $('script[type="application/ld+json"]')
    scriptTags.each((_: number, element: any) => {
      try {
        const jsonData = JSON.parse($(element).html() || '{}')
        if (jsonData['@type'] === 'SocialMediaPosting' && jsonData.commentCount) {
          // This gives us metadata but not actual comments
          console.log(`📊 Found ${jsonData.commentCount} comments on post`)
        }
      } catch (e) {
        // Continue
      }
    })

    // Instagram heavily uses React and dynamic loading, so comments are hard to get from static HTML
    // We'd need to use actual browser automation (Playwright/Puppeteer) for reliable comment scraping

    console.log('⚠️ Page HTML method limited - consider using browser automation')
    return null
  } catch (error: any) {
    console.log(`⚠️ Page HTML error: ${error.message}`)
    return null
  }
}

/**
 * Extract comments from Instagram media object
 */
function extractCommentsFromMedia(media: any, maxComments: number): InstagramComment[] {
  const comments: InstagramComment[] = []

  try {
    const commentEdges = media.edge_media_to_parent_comment?.edges || []

    for (const edge of commentEdges.slice(0, maxComments)) {
      const node = edge.node

      comments.push({
        commentId: node.id,
        commentText: node.text,
        commentAuthor: node.owner.username,
        commentAuthorId: node.owner.id,
        likes: node.edge_liked_by?.count || 0,
        replies: node.edge_threaded_comments?.count || 0,
        authorFollowers: undefined, // Not available in this API response
        authorVerified: node.owner.is_verified || false,
        authorBio: undefined,
        publishedAt: new Date(node.created_at * 1000)
      })

      // Also extract replies if available
      if (node.edge_threaded_comments?.edges) {
        for (const replyEdge of node.edge_threaded_comments.edges) {
          const reply = replyEdge.node

          comments.push({
            commentId: reply.id,
            commentText: reply.text,
            commentAuthor: reply.owner.username,
            commentAuthorId: reply.owner.id,
            likes: reply.edge_liked_by?.count || 0,
            replies: 0,
            authorFollowers: undefined,
            authorVerified: reply.owner.is_verified || false,
            authorBio: undefined,
            publishedAt: new Date(reply.created_at * 1000)
          })
        }
      }
    }
  } catch (error) {
    console.error('Error extracting comments:', error)
  }

  return comments
}

/**
 * Scrape comments from multiple Instagram posts
 */
export async function scrapeInstagramPostsComments(
  postUrls: string[],
  maxCommentsPerPost: number = 50
): Promise<InstagramPostComments[]> {
  const results: InstagramPostComments[] = []

  console.log(`\n📝 Batch scraping comments from ${postUrls.length} Instagram posts...`)

  // Process in batches to avoid rate limits
  const batchSize = 3
  for (let i = 0; i < postUrls.length; i += batchSize) {
    const batch = postUrls.slice(i, i + batchSize)

    const batchResults = await Promise.all(
      batch.map(url => scrapeInstagramPostComments(url, maxCommentsPerPost))
    )

    batchResults.forEach(result => {
      if (result) {
        results.push(result)
      }
    })

    // Delay between batches
    if (i + batchSize < postUrls.length) {
      console.log('⏳ Waiting 3 seconds before next batch...')
      await new Promise(resolve => setTimeout(resolve, 3000))
    }
  }

  console.log(`✅ Successfully scraped comments from ${results.length}/${postUrls.length} posts`)
  return results
}

/**
 * Get comments for a brand's recent posts
 */
export async function scrapeInstagramBrandComments(
  username: string,
  postCount: number = 10,
  maxCommentsPerPost: number = 50
): Promise<InstagramPostComments[]> {
  try {
    console.log(`\n📝 Scraping comments for @${username}'s recent ${postCount} posts...`)

    // First, get the brand's recent post URLs
    const postUrls = await getRecentPostUrls(username, postCount)

    if (postUrls.length === 0) {
      console.log('❌ No posts found')
      return []
    }

    // Then scrape comments from those posts
    return await scrapeInstagramPostsComments(postUrls, maxCommentsPerPost)
  } catch (error) {
    console.error('Error scraping brand comments:', error)
    return []
  }
}

/**
 * Get recent post URLs for a username
 * Since Instagram blocks scraping, we return empty array
 * The brand-comment-analyzer will use TMS API data to get post URLs instead
 */
async function getRecentPostUrls(username: string, count: number): Promise<string[]> {
  // Instagram blocks direct scraping - this function is deprecated
  // Post URLs should be obtained from TMS API data
  console.log(`⚠️  Instagram profile scraping is blocked - need to use TMS API or Playwright`)
  return []
}
