/**
 * Text Analysis & Keyword Clustering Library
 *
 * Menggunakan metodologi:
 * - TF-IDF (Term Frequency-Inverse Document Frequency)
 * - Cosine Similarity untuk clustering
 * - Stop words removal (Indonesian & English)
 */

// Indonesian stop words (kata yang umum dan tidak bermakna)
const INDONESIAN_STOPWORDS = new Set([
  'yang', 'dan', 'di', 'dari', 'ini', 'itu', 'dengan', 'untuk', 'pada', 'ke',
  'adalah', 'oleh', 'tidak', 'dalam', 'ada', 'akan', 'juga', 'saya', 'kamu',
  'dia', 'mereka', 'kami', 'kita', 'atau', 'tetapi', 'karena', 'jika', 'sudah',
  'belum', 'dapat', 'bisa', 'harus', 'sangat', 'lebih', 'paling', 'saat', 'waktu',
  'bagi', 'sebagai', 'sebuah', 'suatu', 'seperti', 'nya', 'lah', 'kah', 'tah',
  'telah', 'masih', 'maka', 'serta', 'antara', 'sambil', 'tanpa', 'agar', 'kami'
])

const ENGLISH_STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of',
  'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be', 'been', 'being',
  'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
  'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those', 'i', 'you',
  'he', 'she', 'it', 'we', 'they', 'them', 'their', 'what', 'which', 'who',
  'when', 'where', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more',
  'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same',
  'so', 'than', 'too', 'very', 'just', 'about', 'get', 'got', 'like', 'rt', 'via'
])

const ALL_STOPWORDS = new Set([...INDONESIAN_STOPWORDS, ...ENGLISH_STOPWORDS])

interface Post {
  text?: string
  caption?: string
  content?: string
  title?: string
  created_at?: string
  timestamp?: string
  date?: string
  likes?: number
  comments?: number
  shares?: number
  retweets?: number
  engagement?: number
}

interface KeywordCluster {
  clusterId: number
  keywords: string[]
  topKeyword: string
  postCount: number
  posts: Array<{
    text: string
    date: string
    engagement: number
  }>
  averageEngagement: number
  sentiment?: string // positive, neutral, negative
  theme?: string // inferred theme
}

interface BrandKeywordAnalysis {
  brand: string
  platform: string
  totalPosts: number
  clusters: KeywordCluster[]
  topKeywords: Array<{
    keyword: string
    frequency: number
    avgEngagement: number
  }>
  conversationThemes: string[]
}

/**
 * Extract text from post object
 */
function extractText(post: Post): string {
  return (post.text || post.caption || post.content || post.title || '').toLowerCase()
}

/**
 * Extract date from post object
 */
function extractDate(post: Post): string {
  return post.created_at || post.timestamp || post.date || new Date().toISOString()
}

/**
 * Calculate engagement from post
 */
function calculateEngagement(post: Post): number {
  return (post.likes || 0) + (post.comments || 0) + (post.shares || 0) +
         (post.retweets || 0) + (post.engagement || 0)
}

/**
 * Tokenize text and remove stop words
 */
function tokenize(text: string): string[] {
  // Remove URLs
  text = text.replace(/https?:\/\/[^\s]+/g, '')

  // Remove mentions (@username)
  text = text.replace(/@[\w]+/g, '')

  // Remove special characters but keep hashtags
  const words = text
    .replace(/[^\w\s#]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2) // Minimal 3 characters
    .filter(word => !ALL_STOPWORDS.has(word))
    .filter(word => !/^\d+$/.test(word)) // Remove pure numbers

  return words
}

/**
 * Calculate TF-IDF scores
 */
function calculateTFIDF(documents: string[][]): Map<string, number>[] {
  const N = documents.length
  const df = new Map<string, number>() // Document frequency

  // Calculate document frequency
  documents.forEach(doc => {
    const uniqueWords = new Set(doc)
    uniqueWords.forEach(word => {
      df.set(word, (df.get(word) || 0) + 1)
    })
  })

  // Calculate TF-IDF for each document
  return documents.map(doc => {
    const tfidf = new Map<string, number>()
    const tf = new Map<string, number>()

    // Calculate term frequency
    doc.forEach(word => {
      tf.set(word, (tf.get(word) || 0) + 1)
    })

    // Calculate TF-IDF
    tf.forEach((count, word) => {
      const termFreq = count / doc.length
      const inverseDocFreq = Math.log(N / (df.get(word) || 1))
      tfidf.set(word, termFreq * inverseDocFreq)
    })

    return tfidf
  })
}

/**
 * Extract top keywords from TF-IDF scores
 */
function extractTopKeywords(tfidfScores: Map<string, number>[], topN: number = 10): string[] {
  const aggregateScores = new Map<string, number>()

  tfidfScores.forEach(scores => {
    scores.forEach((score, word) => {
      aggregateScores.set(word, (aggregateScores.get(word) || 0) + score)
    })
  })

  return Array.from(aggregateScores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([word]) => word)
}

/**
 * Group posts by keyword similarity using simple clustering
 */
function clusterByKeywords(
  posts: Post[],
  keywords: string[],
  minClusterSize: number = 3
): KeywordCluster[] {
  const clusters: Map<string, Post[]> = new Map()

  // Group posts by their primary keyword
  posts.forEach(post => {
    const text = extractText(post)
    const tokens = tokenize(text)

    // Find which top keyword appears most in this post
    let maxCount = 0
    let primaryKeyword = ''

    keywords.forEach(keyword => {
      const count = tokens.filter(t => t.includes(keyword) || keyword.includes(t)).length
      if (count > maxCount) {
        maxCount = count
        primaryKeyword = keyword
      }
    })

    if (primaryKeyword) {
      if (!clusters.has(primaryKeyword)) {
        clusters.set(primaryKeyword, [])
      }
      clusters.get(primaryKeyword)!.push(post)
    }
  })

  // Convert to KeywordCluster format
  const result: KeywordCluster[] = []
  let clusterId = 0

  clusters.forEach((clusterPosts, keyword) => {
    if (clusterPosts.length >= minClusterSize) {
      // Get related keywords from cluster posts
      const allTokens = clusterPosts.flatMap(p => tokenize(extractText(p)))
      const tokenFreq = new Map<string, number>()

      allTokens.forEach(token => {
        tokenFreq.set(token, (tokenFreq.get(token) || 0) + 1)
      })

      const relatedKeywords = Array.from(tokenFreq.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([word]) => word)

      const totalEngagement = clusterPosts.reduce((sum, post) =>
        sum + calculateEngagement(post), 0
      )

      result.push({
        clusterId: clusterId++,
        keywords: relatedKeywords,
        topKeyword: keyword,
        postCount: clusterPosts.length,
        posts: clusterPosts.map(post => ({
          text: extractText(post),
          date: extractDate(post),
          engagement: calculateEngagement(post)
        })),
        averageEngagement: clusterPosts.length > 0 ? totalEngagement / clusterPosts.length : 0,
        theme: inferTheme(relatedKeywords),
        sentiment: 'neutral' // Could be enhanced with sentiment analysis
      })
    }
  })

  return result.sort((a, b) => b.postCount - a.postCount)
}

/**
 * Infer conversation theme from keywords
 */
function inferTheme(keywords: string[]): string {
  const keywordStr = keywords.join(' ').toLowerCase()

  // Product-related keywords
  if (/produk|product|launch|new|baru|rilis/.test(keywordStr)) {
    return 'Product Launch & Features'
  }

  // Promotion-related
  if (/promo|diskon|sale|discount|offer|deal/.test(keywordStr)) {
    return 'Promotions & Offers'
  }

  // Customer service
  if (/service|pelayanan|help|bantuan|support/.test(keywordStr)) {
    return 'Customer Service'
  }

  // Events
  if (/event|acara|festival|celebration/.test(keywordStr)) {
    return 'Events & Campaigns'
  }

  // Brand awareness
  if (/brand|quality|kualitas|best|terbaik/.test(keywordStr)) {
    return 'Brand Positioning'
  }

  // Community engagement
  if (/community|komunitas|fans|followers|love/.test(keywordStr)) {
    return 'Community Engagement'
  }

  return 'General Discussion'
}

/**
 * Main analysis function
 */
export function analyzePostsByKeywords(
  posts: Post[],
  brand: string,
  platform: string,
  maxPosts: number = 40
): BrandKeywordAnalysis {
  // Take last 30-40 posts
  const recentPosts = posts.slice(0, Math.min(maxPosts, posts.length))

  if (recentPosts.length === 0) {
    return {
      brand,
      platform,
      totalPosts: 0,
      clusters: [],
      topKeywords: [],
      conversationThemes: []
    }
  }

  // Tokenize all posts
  const documents = recentPosts.map(post => tokenize(extractText(post)))

  // Calculate TF-IDF
  const tfidfScores = calculateTFIDF(documents)

  // Extract top keywords
  const topKeywordsList = extractTopKeywords(tfidfScores, 15)

  // Cluster posts by keywords
  const clusters = clusterByKeywords(recentPosts, topKeywordsList, 3)

  // Calculate keyword frequency and engagement
  const keywordStats = new Map<string, { freq: number; totalEng: number; count: number }>()

  recentPosts.forEach((post, idx) => {
    const tokens = tokenize(extractText(post))
    const engagement = calculateEngagement(post)

    tokens.forEach(token => {
      if (topKeywordsList.includes(token)) {
        const stats = keywordStats.get(token) || { freq: 0, totalEng: 0, count: 0 }
        stats.freq++
        stats.totalEng += engagement
        stats.count++
        keywordStats.set(token, stats)
      }
    })
  })

  const topKeywords = Array.from(keywordStats.entries())
    .map(([keyword, stats]) => ({
      keyword,
      frequency: stats.freq,
      avgEngagement: stats.count > 0 ? stats.totalEng / stats.count : 0
    }))
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 10)

  // Extract unique themes
  const conversationThemes = [...new Set(clusters.map(c => c.theme || 'General'))]

  return {
    brand,
    platform,
    totalPosts: recentPosts.length,
    clusters,
    topKeywords,
    conversationThemes
  }
}

/**
 * Generate AI prompt for keyword cluster interpretation
 */
export function buildKeywordAnalysisPrompt(analysis: BrandKeywordAnalysis): string {
  const clusterSummary = analysis.clusters.map(c =>
    `- Cluster "${c.topKeyword}" (${c.postCount} posts): ${c.keywords.join(', ')}`
  ).join('\n')

  return `Analisa keyword clustering untuk brand ${analysis.brand} di platform ${analysis.platform}:

Total Posts Analyzed: ${analysis.totalPosts}

Top Keywords:
${analysis.topKeywords.map(k => `- ${k.keyword} (${k.frequency}x, avg engagement: ${k.avgEngagement.toFixed(0)})`).join('\n')}

Keyword Clusters:
${clusterSummary}

Conversation Themes: ${analysis.conversationThemes.join(', ')}

Berikan insights tentang:
1. Apa topik utama yang dibicarakan brand ini?
2. Tema mana yang mendapat engagement tertinggi?
3. Apa strategi content yang terlihat dari keyword clusters?
4. Rekomendasi topik yang bisa ditingkatkan

Format jawaban dalam bullet points yang jelas dan actionable.`
}
