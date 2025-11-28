import axios from 'axios'

const OLLAMA_URL = process.env.OLLAMA_API_URL || 'https://api.virtueai.id/api/generate'
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'glm4:latest'

export interface OllamaRequest {
  model: string
  prompt: string
  stream: boolean
  options?: {
    temperature?: number
    top_p?: number
    max_tokens?: number
  }
}

export interface OllamaResponse {
  response: string
  model: string
  created_at?: string
}

export async function generateAIInsights(prompt: string, temperature: number = 0.7): Promise<string> {
  try {
    console.log(`🤖 Calling AI API: ${OLLAMA_URL} with model: ${OLLAMA_MODEL}`)

    const response = await axios.post<OllamaResponse>(
      OLLAMA_URL,
      {
        model: OLLAMA_MODEL,
        prompt,
        stream: false,
        options: {
          temperature
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Cookie': 'Path=/'
        },
        timeout: 120000 // Increased to 120 seconds
      }
    )

    if (response.data && response.data.response) {
      console.log('✅ AI insights generated successfully')
      return response.data.response
    } else {
      console.error('❌ Empty response from AI API')
      return 'AI insights generation returned empty response.'
    }
  } catch (error: any) {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      console.error('❌ AI API request timed out')
      return 'AI insights generation timed out. The AI service may be slow or unavailable. Please check your OLLAMA_API_URL configuration.'
    } else if (error.response) {
      console.error('❌ AI API error response:', error.response.status, error.response.data)
      return `AI insights generation failed with status ${error.response.status}. Please verify your API configuration.`
    } else if (error.request) {
      console.error('❌ No response from AI API:', error.message)
      return 'AI insights generation failed. Unable to reach the AI service. Please check your network connection and OLLAMA_API_URL configuration.'
    } else {
      console.error('❌ Error generating AI insights:', error.message)
      return 'AI insights generation failed due to an unexpected error. Please try again.'
    }
  }
}

export function buildAnalysisPrompt(data: any): string {
  return `Sebagai brand analyst profesional, analisa data berikut dan berikan insights mendalam:

Data Brand:
${JSON.stringify(data, null, 2)}

Berikan analisis yang mencakup:
1. Perbandingan performa antar brand
2. Kekuatan dan kelemahan masing-masing brand
3. Trend engagement dan audience
4. Rekomendasi strategis untuk focus brand
5. Peluang dan ancaman kompetitif

Format output dalam bahasa Indonesia yang profesional dan actionable.`
}
