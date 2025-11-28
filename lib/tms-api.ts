import axios from 'axios'

const TMS_BASE_URL = process.env.TMS_API_BASE_URL || 'https://app01.tmsdev.space/api/v2/dmonitor'

export interface TMSResponse {
  data: any[]
  metadata?: any
}

/**
 * Build boolean search query for brand name
 * This expands the search to include variations and related terms
 * Example: "Le Minerale" becomes "Le Minerale" OR "LeMinerale" OR "@le_mineraleid"
 */
export function buildBooleanQuery(brandName: string, socialHandle?: string): string {
  const terms: string[] = []

  // Add exact brand name
  terms.push(`"${brandName}"`)

  // Add version without spaces
  const noSpaces = brandName.replace(/\s+/g, '')
  if (noSpaces !== brandName) {
    terms.push(`"${noSpaces}"`)
  }

  // Add hashtag version
  const hashtagVersion = '#' + brandName.replace(/\s+/g, '').toLowerCase()
  terms.push(hashtagVersion)

  // Add social handle if provided
  if (socialHandle) {
    terms.push(`@${socialHandle}`)
    terms.push(`"${socialHandle}"`)
  }

  // Join with OR operator
  return terms.join(' OR ')
}

export async function fetchTwitterData(query: string): Promise<TMSResponse> {
  try {
    const response = await axios.get(`${TMS_BASE_URL}/twitter`, {
      params: { q: query },
      timeout: 30000
    })
    return response.data
  } catch (error) {
    console.error('Error fetching Twitter data:', error)
    return { data: [] }
  }
}

export async function fetchInstagramData(query: string): Promise<TMSResponse> {
  try {
    const response = await axios.get(`${TMS_BASE_URL}/igr`, {
      params: { q: query },
      timeout: 30000
    })
    // TMS API returns { igr: [...] } not { data: [...] }
    const apiData = response.data
    return {
      data: apiData.igr || [],
      metadata: {
        totalResults: apiData.totalResults,
        status: apiData.status
      }
    }
  } catch (error) {
    console.error('Error fetching Instagram data:', error)
    return { data: [] }
  }
}

export async function fetchTikTokData(query: string): Promise<TMSResponse> {
  try {
    const response = await axios.get(`${TMS_BASE_URL}/tiktok`, {
      params: { q: query },
      timeout: 30000
    })
    // TMS API returns { tiktok: [...] } not { data: [...] }
    const apiData = response.data
    return {
      data: apiData.tiktok || [],
      metadata: {
        totalResults: apiData.totalResults,
        status: apiData.status
      }
    }
  } catch (error) {
    console.error('Error fetching TikTok data:', error)
    return { data: [] }
  }
}

export async function fetchFacebookData(query: string): Promise<TMSResponse> {
  try {
    const response = await axios.get(`${TMS_BASE_URL}/facebook`, {
      params: { q: query },
      timeout: 30000
    })
    return response.data
  } catch (error) {
    console.error('Error fetching Facebook data:', error)
    return { data: [] }
  }
}

export async function fetchNewsData(query: string): Promise<TMSResponse> {
  try {
    const response = await axios.get(`${TMS_BASE_URL}/news`, {
      params: { q: query },
      timeout: 30000
    })
    return response.data
  } catch (error) {
    console.error('Error fetching News data:', error)
    return { data: [] }
  }
}
