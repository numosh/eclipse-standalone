import { chromium, Browser, Page } from 'playwright'

export interface ScrapedData {
  platform: string
  followers?: number
  following?: number
  posts?: number
  engagement?: number
  bio?: string
  verified?: boolean
  scrapedAt: string
}

let browser: Browser | null = null

async function getBrowser(): Promise<Browser> {
  if (!browser) {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
  }
  return browser
}

export async function scrapeInstagramProfile(handle: string): Promise<ScrapedData | null> {
  try {
    const browser = await getBrowser()
    const page = await browser.newPage()

    await page.goto(`https://www.instagram.com/${handle}/`, {
      waitUntil: 'networkidle',
      timeout: 30000
    })

    // Wait for profile data to load
    await page.waitForSelector('header section', { timeout: 10000 })

    const data = await page.evaluate(() => {
      const metaTag = document.querySelector('meta[property="og:description"]')
      const content = metaTag?.getAttribute('content') || ''

      // Parse "X Followers, Y Following, Z Posts"
      const followers = content.match(/(\d+(?:,\d+)*(?:\.\d+)?[KMB]?)\s+Followers/i)?.[1]
      const following = content.match(/(\d+(?:,\d+)*(?:\.\d+)?[KMB]?)\s+Following/i)?.[1]
      const posts = content.match(/(\d+(?:,\d+)*(?:\.\d+)?[KMB]?)\s+Posts/i)?.[1]

      return {
        followers: followers || '0',
        following: following || '0',
        posts: posts || '0'
      }
    })

    await page.close()

    return {
      platform: 'instagram',
      followers: parseMetricString(data.followers),
      following: parseMetricString(data.following),
      posts: parseMetricString(data.posts),
      scrapedAt: new Date().toISOString()
    }
  } catch (error) {
    console.error('Error scraping Instagram:', error)
    return null
  }
}

export async function scrapeTikTokProfile(handle: string): Promise<ScrapedData | null> {
  try {
    const browser = await getBrowser()
    const page = await browser.newPage()

    await page.goto(`https://www.tiktok.com/@${handle}`, {
      waitUntil: 'networkidle',
      timeout: 30000
    })

    await page.waitForTimeout(3000) // Wait for dynamic content

    const data = await page.evaluate(() => {
      const stats = document.querySelectorAll('[data-e2e="followers-count"], [data-e2e="following-count"]')
      return {
        followers: stats[0]?.textContent?.trim() || '0',
        following: stats[1]?.textContent?.trim() || '0'
      }
    })

    await page.close()

    return {
      platform: 'tiktok',
      followers: parseMetricString(data.followers),
      following: parseMetricString(data.following),
      scrapedAt: new Date().toISOString()
    }
  } catch (error) {
    console.error('Error scraping TikTok:', error)
    return null
  }
}

export async function scrapeYouTubeChannel(handle: string): Promise<ScrapedData | null> {
  try {
    const browser = await getBrowser()
    const page = await browser.newPage()

    // Try both @handle and /c/handle formats
    const url = handle.startsWith('@')
      ? `https://www.youtube.com/${handle}`
      : `https://www.youtube.com/@${handle}`

    await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: 30000
    })

    await page.waitForTimeout(2000)

    const data = await page.evaluate(() => {
      const subscriberElement = document.querySelector('#subscriber-count')
      return {
        subscribers: subscriberElement?.textContent?.trim() || '0'
      }
    })

    await page.close()

    return {
      platform: 'youtube',
      followers: parseMetricString(data.subscribers),
      scrapedAt: new Date().toISOString()
    }
  } catch (error) {
    console.error('Error scraping YouTube:', error)
    return null
  }
}

export async function scrapeWebsite(url: string): Promise<ScrapedData | null> {
  try {
    const browser = await getBrowser()
    const page = await browser.newPage()

    await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: 30000
    })

    const data = await page.evaluate(() => {
      const title = document.title
      const description = document.querySelector('meta[name="description"]')?.getAttribute('content') || ''
      const keywords = document.querySelector('meta[name="keywords"]')?.getAttribute('content') || ''

      return {
        title,
        description,
        keywords
      }
    })

    await page.close()

    return {
      platform: 'website',
      bio: JSON.stringify(data),
      scrapedAt: new Date().toISOString()
    }
  } catch (error) {
    console.error('Error scraping website:', error)
    return null
  }
}

function parseMetricString(str: string): number {
  if (!str) return 0

  const cleaned = str.replace(/,/g, '').trim().toUpperCase()

  if (cleaned.includes('K')) {
    return Math.round(parseFloat(cleaned.replace('K', '')) * 1000)
  }
  if (cleaned.includes('M')) {
    return Math.round(parseFloat(cleaned.replace('M', '')) * 1000000)
  }
  if (cleaned.includes('B')) {
    return Math.round(parseFloat(cleaned.replace('B', '')) * 1000000000)
  }

  return parseInt(cleaned) || 0
}

export async function closeBrowser() {
  if (browser) {
    await browser.close()
    browser = null
  }
}
