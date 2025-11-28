import {
  fetchTwitterData,
  fetchInstagramData,
  fetchTikTokData,
  fetchNewsData
} from './tms-api'

interface UniverseKeywords {
  brandName: string
  universeKeywords: string[]
}

interface ShareOfVoiceData {
  brandName: string
  totalMentions: number
  universeConversations: number
  sharePercentage: number
  platforms: {
    platform: string
    mentions: number
  }[]
}

interface ShareOfVoiceAnalysis {
  totalUniverseConversations: number
  universeKeywords: string[]
  brandShares: ShareOfVoiceData[]
  overlaps: {
    brands: string[]
    count: number
  }[]
  vennData: {
    sets: string[]
    size: number
    label?: string
  }[]
}

/**
 * Generate universe keywords based on brand category
 * For water brands: air minum, mineral, air putih, etc.
 */
export function generateUniverseKeywords(brandName: string, category?: string): string[] {
  const lowerBrand = brandName.toLowerCase()

  // Determine category if not provided
  if (!category) {
    if (lowerBrand.includes('aqua') || lowerBrand.includes('mineral') ||
        lowerBrand.includes('crystalin') || lowerBrand.includes('vit')) {
      category = 'water'
    } else if (lowerBrand.includes('kopiko') || lowerBrand.includes('kopi') ||
               lowerBrand.includes('coffee')) {
      category = 'coffee'
    } else if (lowerBrand.includes('indomie') || lowerBrand.includes('mie')) {
      category = 'noodles'
    }
  }

  // Category-specific universe keywords
  const categoryKeywords: { [key: string]: string[] } = {
    water: [
      'air minum',
      'air mineral',
      'air putih',
      'minum air',
      'air kemasan',
      'mineral water',
      'drinking water',
      'botol air',
      'gallon air',
      'hidrasi',
      'dehidrasi',
      'kesehatan air'
    ],
    coffee: [
      'kopi',
      'coffee',
      'caffeine',
      'kafein',
      'ngopi',
      'kopi susu',
      'espresso',
      'americano',
      'cappuccino',
      'latte',
      'kopi hitam',
      'warung kopi'
    ],
    noodles: [
      'mie',
      'mie instan',
      'noodles',
      'instant noodles',
      'mie goreng',
      'mie kuah',
      'ramen',
      'bakmi',
      'mi goreng'
    ],
    beauty: [
      'skincare',
      'makeup',
      'kosmetik',
      'kecantikan',
      'perawatan wajah',
      'beauty',
      'serum',
      'moisturizer',
      'cleanser',
      'toner'
    ],
    tech: [
      'smartphone',
      'laptop',
      'gadget',
      'teknologi',
      'tech',
      'elektronik',
      'device',
      'handphone',
      'komputer'
    ]
  }

  // Return relevant keywords or default
  return categoryKeywords[category || 'water'] || categoryKeywords.water
}

/**
 * Fetch universe conversations from TMS API
 */
async function fetchUniverseConversations(keywords: string[]): Promise<any[]> {
  const allConversations: any[] = []

  // Search for each universe keyword
  for (const keyword of keywords) {
    try {
      console.log(`  🔍 Searching universe keyword: "${keyword}"`)

      const [instagramData, tiktokData, twitterData, newsData] = await Promise.all([
        fetchInstagramData(keyword).catch(() => ({ data: [] })),
        fetchTikTokData(keyword).catch(() => ({ data: [] })),
        fetchTwitterData(keyword).catch(() => ({ data: [] })),
        fetchNewsData(keyword).catch(() => ({ data: [] }))
      ])

      const conversations = [
        ...(instagramData.data || []).map((item: any) => ({
          ...item,
          platform: 'instagram',
          universeKeyword: keyword
        })),
        ...(tiktokData.data || []).map((item: any) => ({
          ...item,
          platform: 'tiktok',
          universeKeyword: keyword
        })),
        ...(twitterData.data || []).map((item: any) => ({
          ...item,
          platform: 'twitter',
          universeKeyword: keyword
        })),
        ...(newsData.data || []).map((item: any) => ({
          ...item,
          platform: 'news',
          universeKeyword: keyword
        }))
      ]

      allConversations.push(...conversations)
      console.log(`    Found ${conversations.length} conversations for "${keyword}"`)
    } catch (error) {
      console.error(`❌ Error fetching conversations for "${keyword}":`, error)
    }
  }

  // Remove duplicates based on content/id
  const uniqueConversations = allConversations.filter((conv, index, self) => {
    const id = conv.id || conv.url || conv.text
    return index === self.findIndex(c => (c.id || c.url || c.text) === id)
  })

  console.log(`  ✅ Total unique universe conversations: ${uniqueConversations.length}`)
  return uniqueConversations
}

/**
 * Check if conversation mentions a brand
 */
function mentionsBrand(conversation: any, brandName: string): boolean {
  const text = (conversation.text || conversation.caption || conversation.title || '').toLowerCase()
  const brandLower = brandName.toLowerCase()

  // Check for brand name mentions (with word boundaries)
  const brandWords = brandLower.split(' ')
  return brandWords.every(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'i')
    return regex.test(text)
  })
}

/**
 * Analyze Share of Voice for all brands
 */
export async function analyzeShareOfVoice(
  brands: { name: string; category?: string }[],
  customKeywords?: string
): Promise<ShareOfVoiceAnalysis> {
  console.log('📊 Starting Share of Voice Analysis...')

  // Use custom keywords if provided, otherwise auto-generate
  let universeKeywords: string[]
  if (customKeywords && customKeywords.trim()) {
    universeKeywords = customKeywords.split(',').map(k => k.trim()).filter(k => k.length > 0)
    console.log(`🌐 Using custom universe keywords: ${universeKeywords.join(', ')}`)
  } else {
    universeKeywords = generateUniverseKeywords(brands[0].name, brands[0].category)
    console.log(`🌐 Auto-detected universe keywords: ${universeKeywords.join(', ')}`)
  }

  // Fetch all universe conversations
  const universeConversations = await fetchUniverseConversations(universeKeywords)

  // Analyze each brand's share
  const brandShares: ShareOfVoiceData[] = []

  for (const brand of brands) {
    console.log(`  📈 Analyzing share for: ${brand.name}`)

    // Filter conversations that mention this brand
    const brandMentions = universeConversations.filter(conv =>
      mentionsBrand(conv, brand.name)
    )

    // Count by platform
    const platformCounts: { [key: string]: number } = {}
    brandMentions.forEach(mention => {
      const platform = mention.platform || 'unknown'
      platformCounts[platform] = (platformCounts[platform] || 0) + 1
    })

    const platforms = Object.entries(platformCounts).map(([platform, mentions]) => ({
      platform,
      mentions
    }))

    const sharePercentage = universeConversations.length > 0
      ? (brandMentions.length / universeConversations.length) * 100
      : 0

    brandShares.push({
      brandName: brand.name,
      totalMentions: brandMentions.length,
      universeConversations: universeConversations.length,
      sharePercentage,
      platforms
    })

    console.log(`    ✅ ${brand.name}: ${brandMentions.length} mentions (${sharePercentage.toFixed(2)}% share)`)
  }

  // Calculate overlaps (conversations mentioning multiple brands)
  const overlaps = calculateOverlaps(universeConversations, brands.map(b => b.name))

  // Generate Venn diagram data
  const vennData = generateVennData(brandShares, overlaps, universeConversations.length)

  return {
    totalUniverseConversations: universeConversations.length,
    universeKeywords,
    brandShares,
    overlaps,
    vennData
  }
}

/**
 * Calculate brand overlap in conversations
 */
function calculateOverlaps(
  conversations: any[],
  brandNames: string[]
): { brands: string[]; count: number }[] {
  const overlaps: { brands: string[]; count: number }[] = []

  // Check all combinations of brands
  for (let i = 0; i < brandNames.length; i++) {
    for (let j = i + 1; j < brandNames.length; j++) {
      const brand1 = brandNames[i]
      const brand2 = brandNames[j]

      const overlapCount = conversations.filter(conv =>
        mentionsBrand(conv, brand1) && mentionsBrand(conv, brand2)
      ).length

      if (overlapCount > 0) {
        overlaps.push({
          brands: [brand1, brand2],
          count: overlapCount
        })
      }
    }
  }

  // Check for 3+ brand overlaps if there are 3+ brands
  if (brandNames.length >= 3) {
    const allBrandsOverlap = conversations.filter(conv =>
      brandNames.every(brand => mentionsBrand(conv, brand))
    ).length

    if (allBrandsOverlap > 0) {
      overlaps.push({
        brands: brandNames,
        count: allBrandsOverlap
      })
    }
  }

  return overlaps
}

/**
 * Generate Venn diagram data format
 */
function generateVennData(
  brandShares: ShareOfVoiceData[],
  overlaps: { brands: string[]; count: number }[],
  totalUniverse: number
): any[] {
  const vennSets: any[] = []

  // Individual brand sets
  brandShares.forEach(brand => {
    vennSets.push({
      sets: [brand.brandName],
      size: brand.totalMentions,
      label: `${brand.brandName}\n${brand.sharePercentage.toFixed(1)}%`
    })
  })

  // Overlap sets
  overlaps.forEach(overlap => {
    vennSets.push({
      sets: overlap.brands,
      size: overlap.count,
      label: `${overlap.count} mentions`
    })
  })

  // Universe (conversations not mentioning any brand)
  const totalBrandMentions = brandShares.reduce((sum, b) => sum + b.totalMentions, 0)
  const overlapTotal = overlaps.reduce((sum, o) => sum + o.count, 0)
  const universeOnly = totalUniverse - totalBrandMentions + overlapTotal

  if (universeOnly > 0) {
    vennSets.push({
      sets: ['Universe'],
      size: universeOnly,
      label: `${universeOnly} other conversations`
    })
  }

  return vennSets
}

/**
 * Generate Share of Voice insights text
 */
export function generateShareOfVoiceInsights(analysis: ShareOfVoiceAnalysis): string {
  const insights: string[] = []

  insights.push(`## Share of Voice Analysis\n`)
  insights.push(`**Universe of Conversations:** ${analysis.totalUniverseConversations.toLocaleString()} conversations`)
  insights.push(`**Keywords Tracked:** ${analysis.universeKeywords.join(', ')}\n`)

  // Sort brands by share
  const sortedBrands = [...analysis.brandShares].sort((a, b) =>
    b.sharePercentage - a.sharePercentage
  )

  insights.push(`### Brand Share Rankings:\n`)
  sortedBrands.forEach((brand, index) => {
    const emoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '📊'
    insights.push(`${emoji} **${brand.brandName}**: ${brand.totalMentions.toLocaleString()} mentions (${brand.sharePercentage.toFixed(2)}%)`)

    const topPlatform = brand.platforms.sort((a, b) => b.mentions - a.mentions)[0]
    if (topPlatform) {
      insights.push(`   - Top Platform: ${topPlatform.platform} (${topPlatform.mentions} mentions)`)
    }
  })

  // Overlaps
  if (analysis.overlaps.length > 0) {
    insights.push(`\n### Brand Overlaps:\n`)
    analysis.overlaps.forEach(overlap => {
      insights.push(`🔗 ${overlap.brands.join(' + ')}: ${overlap.count} co-mentions`)
    })
  }

  // Key insights
  insights.push(`\n### Key Insights:\n`)
  const leader = sortedBrands[0]
  const totalCaptured = sortedBrands.reduce((sum, b) => sum + b.sharePercentage, 0)

  insights.push(`- **Market Leader:** ${leader.brandName} dominates with ${leader.sharePercentage.toFixed(1)}% share of voice`)
  insights.push(`- **Total Brand Capture:** ${totalCaptured.toFixed(1)}% of universe conversations mention tracked brands`)
  insights.push(`- **Opportunity Gap:** ${(100 - totalCaptured).toFixed(1)}% of conversations don't mention any tracked brand`)

  return insights.join('\n')
}
