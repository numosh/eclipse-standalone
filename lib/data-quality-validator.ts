/**
 * Data Quality Validator
 * Validates and cross-references data from multiple sources (TMS API + Playwright)
 * Provides data quality scores and confidence levels for analysis
 */

export interface DataSource {
  source: 'TMS_API' | 'PLAYWRIGHT' | 'SCRAPER'
  followers?: number
  posts?: number
  postCount?: number
  engagement?: number
  dataPoints?: number // How many posts were analyzed
  dateRange?: { oldest: Date; newest: Date }
  raw?: any
}

export interface DataQualityReport {
  confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'VERY_LOW'
  confidenceScore: number // 0-100
  issues: string[]
  recommendations: string[]
  mergedData: {
    followers: number
    posts: number
    avgPostPerDay: number
    engagement: number
    dataPointsAnalyzed: number
    estimatedTotalPosts?: number
  }
  sources: {
    TMS_API: Partial<DataSource>
    PLAYWRIGHT: Partial<DataSource>
  }
}

/**
 * Calculate confidence score based on data consistency and completeness
 */
function calculateConfidenceScore(sources: DataSource[]): number {
  let score = 0
  const weights = {
    hasMultipleSources: 20, // Do we have data from multiple sources?
    followerConsistency: 25, // Do follower counts match?
    postCountConsistency: 25, // Do post counts match?
    sufficientDataPoints: 20, // Do we have enough posts to analyze?
    hasDateRange: 10 // Do we have time-based data?
  }

  // Check if we have multiple sources
  if (sources.length >= 2) {
    score += weights.hasMultipleSources
  }

  // Check follower consistency (within 10% variance is acceptable)
  const followers = sources.filter(s => s.followers && s.followers > 0)
  if (followers.length >= 2) {
    const [f1, f2] = followers.map(s => s.followers!)
    const variance = Math.abs(f1 - f2) / Math.max(f1, f2)
    if (variance < 0.1) score += weights.followerConsistency
    else if (variance < 0.3) score += weights.followerConsistency * 0.5
  } else if (followers.length === 1) {
    score += weights.followerConsistency * 0.3 // Only one source, lower confidence
  }

  // Check post count consistency
  const postCounts = sources.filter(s => (s.posts || s.postCount) && (s.posts || s.postCount)! > 0)
  if (postCounts.length >= 2) {
    const [p1, p2] = postCounts.map(s => s.posts || s.postCount!)
    const variance = Math.abs(p1 - p2) / Math.max(p1, p2)
    if (variance < 0.1) score += weights.postCountConsistency
    else if (variance < 0.3) score += weights.postCountConsistency * 0.5
  }

  // Check if we have sufficient data points (at least 20 posts for reliable analysis)
  const dataPoints = Math.max(...sources.map(s => s.dataPoints || 0))
  if (dataPoints >= 50) score += weights.sufficientDataPoints
  else if (dataPoints >= 20) score += weights.sufficientDataPoints * 0.7
  else if (dataPoints >= 10) score += weights.sufficientDataPoints * 0.4

  // Check if we have date range for time-based analysis
  const hasDateRange = sources.some(s => s.dateRange)
  if (hasDateRange) score += weights.hasDateRange

  return Math.min(100, Math.max(0, score))
}

/**
 * Merge data from multiple sources, preferring more reliable sources
 */
function mergeDataSources(sources: DataSource[]): DataQualityReport['mergedData'] {
  const tmsSource = sources.find(s => s.source === 'TMS_API')
  const playwrightSource = sources.find(s => s.source === 'PLAYWRIGHT')
  const scraperSource = sources.find(s => s.source === 'SCRAPER')

  // Prefer Playwright/Scraper for follower counts (more accurate)
  const followers = playwrightSource?.followers
    || scraperSource?.followers
    || tmsSource?.followers
    || 0

  // Prefer Playwright for total post count (more complete)
  const estimatedTotalPosts = playwrightSource?.posts
    || playwrightSource?.postCount
    || scraperSource?.posts
    || scraperSource?.postCount
    || undefined

  // Use TMS API for actual analyzed posts (these are the posts we have content for)
  const dataPointsAnalyzed = tmsSource?.dataPoints || 0

  // Use TMS API for post count if we only have TMS data
  const posts = estimatedTotalPosts || dataPointsAnalyzed

  // Calculate avgPostPerDay more accurately
  let avgPostPerDay = 0
  if (tmsSource?.dateRange) {
    const daysDiff = Math.max(1, Math.ceil(
      (tmsSource.dateRange.newest.getTime() - tmsSource.dateRange.oldest.getTime()) / (1000 * 60 * 60 * 24)
    ))
    avgPostPerDay = dataPointsAnalyzed / daysDiff
  } else if (estimatedTotalPosts) {
    // Rough estimate: assume account is 2 years old
    avgPostPerDay = estimatedTotalPosts / 730
  }

  // Prefer Playwright/Scraper engagement if available
  const engagement = playwrightSource?.engagement
    || scraperSource?.engagement
    || tmsSource?.engagement
    || 0

  return {
    followers,
    posts,
    avgPostPerDay: parseFloat(avgPostPerDay.toFixed(2)),
    engagement,
    dataPointsAnalyzed,
    estimatedTotalPosts
  }
}

/**
 * Identify data quality issues
 */
function identifyIssues(
  sources: DataSource[],
  mergedData: DataQualityReport['mergedData']
): string[] {
  const issues: string[] = []

  // Check if we have data from only one source
  if (sources.length === 1) {
    issues.push(`Data hanya dari 1 sumber (${sources[0].source}). Rekomendasi: gunakan multiple sources untuk validasi.`)
  }

  // Check if follower counts are inconsistent
  const followers = sources.filter(s => s.followers && s.followers > 0)
  if (followers.length >= 2) {
    const [f1, f2] = followers.map(s => s.followers!)
    const variance = Math.abs(f1 - f2) / Math.max(f1, f2)
    if (variance > 0.3) {
      issues.push(`Follower count tidak konsisten antar sumber (variance ${(variance * 100).toFixed(1)}%). Data mungkin tidak akurat.`)
    }
  }

  // Check if we have insufficient data points
  if (mergedData.dataPointsAnalyzed < 10) {
    issues.push(`Hanya ${mergedData.dataPointsAnalyzed} posts yang dianalisa. Minimal 20 posts untuk analisis yang reliable.`)
  } else if (mergedData.dataPointsAnalyzed < 20) {
    issues.push(`Hanya ${mergedData.dataPointsAnalyzed} posts yang dianalisa. Rekomendasi minimal: 50 posts.`)
  }

  // Check if avgPostPerDay calculation is questionable
  const tmsSource = sources.find(s => s.source === 'TMS_API')
  if (!tmsSource?.dateRange && mergedData.avgPostPerDay > 0) {
    issues.push(`Posting frequency dihitung dari estimasi, bukan data aktual. Akurasi rendah.`)
  }

  // Check if post count is very low
  if (mergedData.posts < 5) {
    issues.push(`Total posts sangat rendah (${mergedData.posts}). Data brand mungkin baru atau scraping gagal.`)
  }

  // Check if there's a big discrepancy between analyzed posts and total posts
  if (mergedData.estimatedTotalPosts && mergedData.dataPointsAnalyzed) {
    const coverage = mergedData.dataPointsAnalyzed / mergedData.estimatedTotalPosts
    if (coverage < 0.1) {
      issues.push(`Hanya ${(coverage * 100).toFixed(1)}% dari total posts yang dianalisa (${mergedData.dataPointsAnalyzed}/${mergedData.estimatedTotalPosts}). Coverage rendah dapat menyebabkan bias.`)
    }
  }

  return issues
}

/**
 * Generate recommendations based on data quality
 */
function generateRecommendations(
  confidenceScore: number,
  issues: string[],
  mergedData: DataQualityReport['mergedData']
): string[] {
  const recs: string[] = []

  if (confidenceScore < 40) {
    recs.push('⚠️ Data quality SANGAT RENDAH. Rekomendasi AI harus dianggap tidak reliable.')
    recs.push('🔧 Action: Verifikasi manual atau gunakan data source tambahan.')
  } else if (confidenceScore < 60) {
    recs.push('⚠️ Data quality RENDAH. Gunakan rekomendasi AI dengan hati-hati.')
    recs.push('🔧 Action: Cross-check dengan data analytics platform langsung (Instagram Insights, TikTok Analytics).')
  } else if (confidenceScore < 80) {
    recs.push('✅ Data quality CUKUP. Rekomendasi AI dapat digunakan sebagai panduan awal.')
    recs.push('🔍 Perlu validasi untuk keputusan strategis penting.')
  } else {
    recs.push('✅ Data quality TINGGI. Rekomendasi AI reliable dan actionable.')
  }

  // Specific recommendations based on data points
  if (mergedData.dataPointsAnalyzed < 20) {
    recs.push('📊 Increase data collection period untuk mendapatkan lebih banyak posts (minimal 20-50 posts).')
  }

  if (!mergedData.estimatedTotalPosts) {
    recs.push('🔍 Enable Playwright scraping untuk mendapatkan follower dan total post count yang akurat.')
  }

  return recs
}

/**
 * Main validation function
 */
export function validateDataQuality(sources: DataSource[]): DataQualityReport {
  const confidenceScore = calculateConfidenceScore(sources)
  const mergedData = mergeDataSources(sources)
  const issues = identifyIssues(sources, mergedData)
  const recommendations = generateRecommendations(confidenceScore, issues, mergedData)

  let confidence: DataQualityReport['confidence']
  if (confidenceScore >= 80) confidence = 'HIGH'
  else if (confidenceScore >= 60) confidence = 'MEDIUM'
  else if (confidenceScore >= 40) confidence = 'LOW'
  else confidence = 'VERY_LOW'

  return {
    confidence,
    confidenceScore,
    issues,
    recommendations,
    mergedData,
    sources: {
      TMS_API: sources.find(s => s.source === 'TMS_API') || {},
      PLAYWRIGHT: sources.find(s => s.source === 'PLAYWRIGHT' || s.source === 'SCRAPER') || {}
    }
  }
}

/**
 * Helper to extract date range from posts
 */
export function extractDateRange(posts: any[]): { oldest: Date; newest: Date } | undefined {
  if (posts.length === 0) return undefined

  const dates = posts
    .map(p => {
      const dateStr = p.published_at || p.timestamp || p.created_at
      return dateStr ? new Date(dateStr) : null
    })
    .filter((d): d is Date => d !== null && !isNaN(d.getTime()))

  if (dates.length === 0) return undefined

  const sorted = dates.sort((a, b) => a.getTime() - b.getTime())
  return {
    oldest: sorted[0],
    newest: sorted[sorted.length - 1]
  }
}
