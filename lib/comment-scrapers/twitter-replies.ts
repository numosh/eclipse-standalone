/**
 * Twitter/X Reply Scraper
 * Scrapes replies from Twitter/X posts
 */

import axios from 'axios'
import * as cheerio from 'cheerio'

export interface TwitterReply {
  commentId: string
  commentText: string
  commentAuthor: string
  commentAuthorId?: string
  likes: number
  replies: number
  retweets: number
  authorFollowers?: number
  authorVerified: boolean
  authorBio?: string
  publishedAt: Date
}

export interface TwitterPostReplies {
  postId: string
  postUrl: string
  postAuthor: string
  replies: TwitterReply[]
  totalReplies: number
}

/**
 * Scrape replies from a Twitter/X post
 * @param tweetUrl Full URL to the tweet
 * @param maxReplies Maximum number of replies to scrape (default 50)
 */
export async function scrapeTwitterPostReplies(
  tweetUrl: string,
  maxReplies: number = 50
): Promise<TwitterPostReplies | null> {
  try {
    console.log(`📝 Scraping Twitter replies from: ${tweetUrl}`)

    // Extract tweet ID from URL
    const tweetIdMatch = tweetUrl.match(/status\/(\d+)/)
    if (!tweetIdMatch) {
      console.error('❌ Invalid Twitter post URL')
      return null
    }

    const postId = tweetIdMatch[1]

    // Method 1: Try Twitter embedded data
    const embeddedReplies = await scrapeViaEmbeddedData(tweetUrl, postId, maxReplies)
    if (embeddedReplies) {
      return embeddedReplies
    }

    // Method 2: Try Twitter syndication API
    const syndicationReplies = await scrapeViaSyndicationAPI(postId, maxReplies)
    if (syndicationReplies) {
      return syndicationReplies
    }

    console.log('❌ All methods failed to scrape Twitter replies')
    return null
  } catch (error) {
    console.error('Error scraping Twitter replies:', error)
    return null
  }
}

/**
 * Method 1: Scrape from embedded page data
 */
async function scrapeViaEmbeddedData(
  tweetUrl: string,
  postId: string,
  maxReplies: number
): Promise<TwitterPostReplies | null> {
  try {
    console.log('🔍 Attempting Twitter embedded data extraction...')

    const response = await axios.get(tweetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      timeout: 15000
    })

    const html = response.data
    const $ = cheerio.load(html)

    // Twitter heavily relies on React and JavaScript for rendering
    // Most data is loaded dynamically, making it difficult to extract from static HTML

    // Try to find embedded JSON data
    const scripts = $('script').toArray()
    for (const script of scripts) {
      const scriptContent = $(script).html() || ''

      // Look for window.__INITIAL_STATE__ or similar
      if (scriptContent.includes('__INITIAL_STATE__')) {
        const match = scriptContent.match(/__INITIAL_STATE__\s*=\s*({.+?});/)
        if (match) {
          const data = JSON.parse(match[1])
          // Process data if found
          console.log('📊 Found initial state data')
        }
      }
    }

    console.log('⚠️ Embedded data method failed - Twitter requires API access or browser automation')
    return null
  } catch (error: any) {
    console.log(`⚠️ Embedded data error: ${error.message}`)
    return null
  }
}

/**
 * Method 2: Twitter Syndication API (publicly accessible)
 */
async function scrapeViaSyndicationAPI(postId: string, maxReplies: number): Promise<TwitterPostReplies | null> {
  try {
    console.log('🔍 Attempting Twitter Syndication API...')

    // Twitter's syndication API endpoint
    const response = await axios.get(`https://cdn.syndication.twimg.com/tweet-result?id=${postId}&lang=en`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
      timeout: 10000
    })

    const data = response.data

    if (data && data.id_str) {
      // This API gives us tweet data but not replies
      // We'd need Twitter API v2 for actual reply access

      console.log('✅ Got tweet data, but replies require Twitter API v2')

      return {
        postId: data.id_str,
        postUrl: `https://twitter.com/${data.user.screen_name}/status/${data.id_str}`,
        postAuthor: data.user.screen_name,
        replies: [],
        totalReplies: data.reply_count || 0
      }
    }

    console.log('⚠️ Syndication API method limited')
    return null
  } catch (error: any) {
    console.log(`⚠️ Syndication API error: ${error.message}`)
    return null
  }
}

/**
 * Scrape replies from multiple Twitter posts
 */
export async function scrapeTwitterPostsReplies(
  tweetUrls: string[],
  maxRepliesPerPost: number = 50
): Promise<TwitterPostReplies[]> {
  const results: TwitterPostReplies[] = []

  console.log(`\n📝 Batch scraping replies from ${tweetUrls.length} Twitter posts...`)

  // Process in batches to avoid rate limits
  const batchSize = 3
  for (let i = 0; i < tweetUrls.length; i += batchSize) {
    const batch = tweetUrls.slice(i, i + batchSize)

    const batchResults = await Promise.all(
      batch.map(url => scrapeTwitterPostReplies(url, maxRepliesPerPost))
    )

    batchResults.forEach(result => {
      if (result) {
        results.push(result)
      }
    })

    // Delay between batches
    if (i + batchSize < tweetUrls.length) {
      console.log('⏳ Waiting 3 seconds before next batch...')
      await new Promise(resolve => setTimeout(resolve, 3000))
    }
  }

  console.log(`✅ Successfully scraped replies from ${results.length}/${tweetUrls.length} posts`)
  return results
}

/**
 * Note: For production use with Twitter, you should use Twitter API v2:
 *
 * 1. Get Twitter API access at https://developer.twitter.com
 * 2. Use the official Twitter API v2 endpoints:
 *    - GET /2/tweets/:id - Get tweet details
 *    - GET /2/tweets/search/recent - Search for replies
 *    - Use query: "conversation_id:{tweet_id}" to get all replies
 *
 * Example implementation with Twitter API v2:
 */

export interface TwitterAPIConfig {
  bearerToken: string
}

/**
 * Scrape Twitter replies using official API v2
 * This requires a Twitter Developer account and Bearer Token
 */
export async function scrapeTwitterRepliesWithAPI(
  tweetId: string,
  config: TwitterAPIConfig,
  maxReplies: number = 50
): Promise<TwitterPostReplies | null> {
  try {
    console.log(`📝 Fetching Twitter replies via API v2 for tweet ${tweetId}...`)

    // Step 1: Get the original tweet to get conversation_id
    const tweetResponse = await axios.get(`https://api.twitter.com/2/tweets/${tweetId}`, {
      headers: {
        'Authorization': `Bearer ${config.bearerToken}`,
      },
      params: {
        'tweet.fields': 'conversation_id,author_id,created_at,public_metrics',
        'expansions': 'author_id',
        'user.fields': 'username,verified,public_metrics'
      }
    })

    const tweet = tweetResponse.data.data
    const conversationId = tweet.conversation_id

    // Step 2: Search for all replies in this conversation
    const repliesResponse = await axios.get('https://api.twitter.com/2/tweets/search/recent', {
      headers: {
        'Authorization': `Bearer ${config.bearerToken}`,
      },
      params: {
        'query': `conversation_id:${conversationId}`,
        'max_results': Math.min(maxReplies, 100),
        'tweet.fields': 'created_at,public_metrics,author_id',
        'expansions': 'author_id',
        'user.fields': 'username,verified,public_metrics,description'
      }
    })

    const replies: TwitterReply[] = []
    const users = new Map()

    // Map users for quick lookup
    if (repliesResponse.data.includes?.users) {
      for (const user of repliesResponse.data.includes.users) {
        users.set(user.id, user)
      }
    }

    // Process replies
    if (repliesResponse.data.data) {
      for (const reply of repliesResponse.data.data) {
        // Skip the original tweet
        if (reply.id === tweetId) continue

        const author = users.get(reply.author_id)

        replies.push({
          commentId: reply.id,
          commentText: reply.text,
          commentAuthor: author?.username || 'unknown',
          commentAuthorId: reply.author_id,
          likes: reply.public_metrics?.like_count || 0,
          replies: reply.public_metrics?.reply_count || 0,
          retweets: reply.public_metrics?.retweet_count || 0,
          authorFollowers: author?.public_metrics?.followers_count,
          authorVerified: author?.verified || false,
          authorBio: author?.description,
          publishedAt: new Date(reply.created_at)
        })
      }
    }

    const originalAuthor = users.get(tweet.author_id)

    return {
      postId: tweetId,
      postUrl: `https://twitter.com/${originalAuthor?.username}/status/${tweetId}`,
      postAuthor: originalAuthor?.username || 'unknown',
      replies,
      totalReplies: tweet.public_metrics?.reply_count || 0
    }
  } catch (error: any) {
    console.error('Error fetching Twitter replies via API:', error.message)
    return null
  }
}

/**
 * Get recent tweets and their replies for a Twitter user (requires API access)
 */
export async function scrapeTwitterUserReplies(
  username: string,
  config: TwitterAPIConfig,
  tweetCount: number = 10,
  maxRepliesPerTweet: number = 50
): Promise<TwitterPostReplies[]> {
  try {
    console.log(`\n📝 Fetching replies for @${username}'s recent ${tweetCount} tweets...`)

    // Step 1: Get user ID
    const userResponse = await axios.get(`https://api.twitter.com/2/users/by/username/${username}`, {
      headers: {
        'Authorization': `Bearer ${config.bearerToken}`,
      }
    })

    const userId = userResponse.data.data.id

    // Step 2: Get user's recent tweets
    const tweetsResponse = await axios.get(`https://api.twitter.com/2/users/${userId}/tweets`, {
      headers: {
        'Authorization': `Bearer ${config.bearerToken}`,
      },
      params: {
        'max_results': Math.min(tweetCount, 100),
        'tweet.fields': 'conversation_id,created_at,public_metrics'
      }
    })

    const tweets = tweetsResponse.data.data || []

    // Step 3: Get replies for each tweet
    const results: TwitterPostReplies[] = []

    for (const tweet of tweets) {
      const replies = await scrapeTwitterRepliesWithAPI(tweet.id, config, maxRepliesPerTweet)
      if (replies) {
        results.push(replies)
      }

      // Rate limit delay
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    console.log(`✅ Successfully fetched replies for ${results.length} tweets`)
    return results
  } catch (error) {
    console.error('Error fetching user tweets:', error)
    return []
  }
}
