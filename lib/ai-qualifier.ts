/**
 * AI Qualifier Agent
 * Re-checks and enhances AI-generated insights
 * - Removes excessive markdown formatting
 * - Improves structure and readability
 * - Adds more detailed strategic recommendations
 */

import { generateAIInsights } from './ollama-api'

/**
 * Clean up markdown formatting from AI output
 */
function cleanMarkdown(text: string): string {
  return text
    // Remove excessive ## headers
    .replace(/#{2,}\s*/g, '')
    // Remove excessive ** bold markers
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    // Remove excessive * italic markers
    .replace(/\*([^*]+)\*/g, '$1')
    // Clean up multiple newlines
    .replace(/\n{3,}/g, '\n\n')
    // Trim whitespace
    .trim()
}

/**
 * Structure AI insights with proper formatting
 */
function structureInsights(rawText: string): string {
  const cleaned = cleanMarkdown(rawText)

  // Split into sections
  const lines = cleaned.split('\n').filter(line => line.trim() !== '')

  let structured = ''
  let currentSection = ''

  for (const line of lines) {
    const trimmed = line.trim()

    // Detect section headers (lines that are questions or end with colon)
    if (trimmed.endsWith(':') || trimmed.endsWith('?')) {
      if (currentSection) {
        structured += '\n\n'
      }
      structured += `📌 ${trimmed}\n`
      currentSection = trimmed
    }
    // Detect bullet points or numbered lists
    else if (trimmed.match(/^[-•\d]+[\.\)]\s+/)) {
      structured += `   ${trimmed}\n`
    }
    // Regular paragraphs
    else {
      structured += `${trimmed}\n`
    }
  }

  return structured.trim()
}

/**
 * Qualify and enhance keyword insights
 */
export async function qualifyKeywordInsights(
  rawInsights: string,
  keywordData: any[]
): Promise<string> {
  // If AI generation failed, return error message as-is
  if (rawInsights.includes('failed') || rawInsights.includes('timed out')) {
    return rawInsights
  }

  // First, structure the existing insights
  const structured = structureInsights(rawInsights)

  // Extract brand names from keyword data
  const brands = keywordData.map((b: any) => b.brand).join(', ')

  // Create enhancement prompt
  const enhancementPrompt = `Anda adalah AI Analyst yang profesional. Berikut adalah analisa keyword yang sudah dibuat:

${structured}

Data brand yang dianalisa: ${brands}

Tugas Anda:
1. Perbaiki struktur dan penulisan agar lebih profesional dan mudah dibaca
2. Hapus semua markdown formatting seperti ** dan ##
3. Gunakan format yang clean dan terstruktur dengan emoji 📌 untuk section headers
4. Pastikan setiap insight memiliki penjelasan yang jelas dan actionable
5. JANGAN terlalu panjang, maksimal 400 kata
6. Fokus pada insights yang paling penting dan actionable

Output harus dalam Bahasa Indonesia yang profesional, tanpa markdown formatting.`

  try {
    const enhanced = await generateAIInsights(enhancementPrompt, 0.3) // Lower temperature for consistency
    return structureInsights(enhanced)
  } catch (error) {
    console.error('Error qualifying keyword insights:', error)
    return structured // Return structured version if enhancement fails
  }
}

/**
 * Qualify and enhance strategic insights with detailed recommendations
 */
export async function qualifyStrategicInsights(
  rawInsights: string,
  brandEquityData: any[],
  focusBrand: string
): Promise<string> {
  // If AI generation failed, return error message as-is
  if (rawInsights.includes('failed') || rawInsights.includes('timed out')) {
    return rawInsights
  }

  // First, structure the existing insights
  const structured = structureInsights(rawInsights)

  // Prepare brand performance summary WITH DATA QUALITY INFO
  const brandSummary = brandEquityData.map((b: any) => {
    // Extract data quality info if available
    let dataQualityNote = ''
    if (b.platforms) {
      const platforms = Object.entries(b.platforms).filter(([_, data]: any) => data?.dataQuality)
      if (platforms.length > 0) {
        const qualities = platforms.map(([platform, data]: any) => {
          const dq = data.dataQuality
          return `${platform}: ${dq.confidenceScore}% confidence (${dq.mergedData.dataPointsAnalyzed} posts analyzed)`
        })
        dataQualityNote = ` | Data Quality: ${qualities.join(', ')}`
      }
    }

    return `${b.brand}: Followers ${b.totalFollowers?.toLocaleString() || 'N/A'}, Engagement ${b.avgEngagement}%, Content Velocity ${b.contentVelocity}/day, Equity Score ${b.equityScore}${dataQualityNote}`
  }).join('\n')

  // Extract data quality warnings
  const dataQualityWarnings: string[] = []
  brandEquityData.forEach((b: any) => {
    if (b.platforms) {
      Object.entries(b.platforms).forEach(([platform, data]: any) => {
        if (data?.dataQuality) {
          const dq = data.dataQuality
          if (dq.confidence === 'LOW' || dq.confidence === 'VERY_LOW') {
            dataQualityWarnings.push(`⚠️ ${b.brand} (${platform}): Data quality ${dq.confidence} - ${dq.issues[0]}`)
          }
          // Add specific warning if data is incomplete
          if (dq.mergedData.dataPointsAnalyzed < 20) {
            dataQualityWarnings.push(`⚠️ ${b.brand} (${platform}): Hanya ${dq.mergedData.dataPointsAnalyzed} posts dianalisa - JANGAN membuat rekomendasi posting frequency yang spesifik`)
          }
        }
      })
    }
  })

  const dataQualitySection = dataQualityWarnings.length > 0
    ? `\nPERINGATAN DATA QUALITY (SANGAT PENTING!):\n${dataQualityWarnings.join('\n')}\n`
    : ''

  // Create detailed enhancement prompt
  const enhancementPrompt = `Anda adalah Senior Brand Strategist yang ahli dalam social media marketing dan brand analytics.

ANALISA AWAL:
${structured}

DATA BRAND:
${brandSummary}
${dataQualitySection}
FOCUS BRAND: ${focusBrand}

‼️ CRITICAL RULES - BACA DENGAN TELITI:
1. JANGAN PERNAH membuat rekomendasi posting frequency (berapa kali post per hari/minggu/bulan) jika data points < 20 posts
2. Jika data quality LOW/VERY_LOW, HARUS menulis disclaimer: "Rekomendasi ini berdasarkan data terbatas, perlu validasi lebih lanjut"
3. SELALU cek apakah Content Velocity yang tertera sudah akurat (based on actual date range, bukan estimasi)
4. Jika ada gap besar antara "posts analyzed" vs "total posts", WARN user bahwa analisis mungkin bias
5. Fokus pada insights yang BISA DIVERIFIKASI dari data yang ada, bukan asumsi

TUGAS ANDA:
Buat Strategic Recommendations yang SANGAT DETAIL dan ACTIONABLE untuk ${focusBrand}. Harus mencakup:

1. QUICK WINS (1-2 minggu)
   - 3-5 action items spesifik yang bisa langsung diimplementasi
   - Setiap action harus punya expected impact dan effort level

2. SHORT-TERM STRATEGY (1-3 bulan)
   - Platform strategy untuk setiap channel (Instagram, TikTok, etc)
   - Content type recommendations berdasarkan data engagement
   - Posting schedule optimization

3. MEDIUM-TERM INITIATIVES (3-6 bulan)
   - Audience growth strategy
   - Content pillar development
   - Collaboration & partnership opportunities

4. COMPETITIVE POSITIONING
   - Apa yang bisa dipelajari dari competitor terbaik
   - Differentiation strategy untuk ${focusBrand}
   - Gap analysis dan opportunity areas

5. KEY METRICS TO TRACK
   - 5-7 KPI yang harus dimonitor setiap minggu/bulan
   - Target yang realistis untuk 3 bulan kedepan

REQUIREMENTS:
- TIDAK boleh ada markdown formatting (** atau ##)
- Gunakan emoji untuk section markers (📌 untuk headers, ✅ untuk action items)
- Setiap recommendation harus SPESIFIK dan ACTIONABLE
- Sertakan angka/data/target yang konkret
- Maksimal 600 kata tapi padat informasi
- Bahasa Indonesia profesional

Langsung mulai dengan recommendations, tanpa intro panjang.`

  try {
    const enhanced = await generateAIInsights(enhancementPrompt, 0.4) // Slightly higher temp for creativity
    return structureInsights(enhanced)
  } catch (error) {
    console.error('Error qualifying strategic insights:', error)
    return structured // Return structured version if enhancement fails
  }
}

/**
 * Quick format function for immediate markdown cleanup
 */
export function quickCleanInsights(text: string): string {
  if (!text || text.includes('failed') || text.includes('timed out')) {
    return text
  }
  return structureInsights(text)
}
