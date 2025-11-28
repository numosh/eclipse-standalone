/**
 * Comment Analysis Module
 * Analyzes sentiment, themes, and patterns in user comments
 */

import { generateAIInsights } from './ollama-api'
import { prisma } from './db'

export interface CommentData {
  commentId: string
  commentText: string
  commentAuthor: string
  likes: number
  replies: number
  publishedAt: Date
  platform: string
}

export interface CommentSentiment {
  sentiment: 'positive' | 'neutral' | 'negative'
  confidence: number
  reasoning?: string
}

export interface CommentTheme {
  theme: string
  count: number
  examples: string[]
}

export interface CommentAnalysisResult {
  totalComments: number
  sentimentBreakdown: {
    positive: number
    neutral: number
    negative: number
  }
  topThemes: CommentTheme[]
  topCommenters: Array<{
    username: string
    count: number
    followers?: number
  }>
  questionCount: number
  complaintCount: number
  praiseCount: number
  commonQuestions: string[]
  peakCommentHours: Array<{ hour: number; count: number }>
  avgCommentsPerPost: number
  mostLikedComments: Array<{
    text: string
    author: string
    likes: number
  }>
}

/**
 * Analyze sentiment of a single comment using AI
 */
export async function analyzeCommentSentiment(commentText: string): Promise<CommentSentiment> {
  try {
    const prompt = `Analyze the sentiment of this comment and classify it as positive, neutral, or negative.

Comment: "${commentText}"

Respond in JSON format:
{
  "sentiment": "positive" | "neutral" | "negative",
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation"
}`

    const response = await generateAIInsights(prompt)

    // Try to parse JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0])
      return {
        sentiment: result.sentiment,
        confidence: result.confidence || 0.5,
        reasoning: result.reasoning
      }
    }

    // Fallback: keyword-based sentiment analysis
    return analyzeCommentSentimentKeywords(commentText)
  } catch (error) {
    console.error('Error analyzing sentiment with AI:', error)
    return analyzeCommentSentimentKeywords(commentText)
  }
}

/**
 * Fallback keyword-based sentiment analysis
 */
export function analyzeCommentSentimentKeywords(text: string): CommentSentiment {
  const lowerText = text.toLowerCase()

  const positiveKeywords = ['love', 'great', 'amazing', 'awesome', 'excellent', 'wonderful', 'fantastic', 'perfect', 'best', 'beautiful', 'good', 'nice', 'thanks', 'thank you', '❤️', '😍', '🔥', '👍', '💯']
  const negativeKeywords = ['hate', 'bad', 'terrible', 'awful', 'worst', 'horrible', 'disappointing', 'poor', 'sucks', 'disappointed', 'useless', 'waste', 'scam', 'fake', '👎', '😡', '😢']

  let positiveScore = 0
  let negativeScore = 0

  positiveKeywords.forEach(keyword => {
    if (lowerText.includes(keyword)) positiveScore++
  })

  negativeKeywords.forEach(keyword => {
    if (lowerText.includes(keyword)) negativeScore++
  })

  if (positiveScore > negativeScore) {
    return { sentiment: 'positive', confidence: Math.min(positiveScore / 3, 1) }
  } else if (negativeScore > positiveScore) {
    return { sentiment: 'negative', confidence: Math.min(negativeScore / 3, 1) }
  } else {
    return { sentiment: 'neutral', confidence: 0.5 }
  }
}

/**
 * Classify comment type (question, complaint, praise)
 */
export function classifyCommentType(commentText: string): {
  isQuestion: boolean
  isComplaint: boolean
  isPraise: boolean
} {
  const lowerText = commentText.toLowerCase()

  // Question detection
  const isQuestion = lowerText.includes('?') ||
    lowerText.startsWith('how ') ||
    lowerText.startsWith('what ') ||
    lowerText.startsWith('when ') ||
    lowerText.startsWith('where ') ||
    lowerText.startsWith('why ') ||
    lowerText.startsWith('can ') ||
    lowerText.startsWith('is ') ||
    lowerText.startsWith('do ')

  // Complaint detection
  const complaintKeywords = ['complaint', 'disappointed', 'refund', 'return', 'not working', 'broken', 'issue', 'problem', 'bad', 'worst', 'terrible']
  const isComplaint = complaintKeywords.some(keyword => lowerText.includes(keyword))

  // Praise detection
  const praiseKeywords = ['love', 'amazing', 'great', 'excellent', 'perfect', 'wonderful', 'best', 'thank you', 'thanks']
  const isPraise = praiseKeywords.some(keyword => lowerText.includes(keyword))

  return { isQuestion, isComplaint, isPraise }
}

/**
 * Extract main themes from comments using AI
 */
export async function extractCommentThemes(comments: CommentData[]): Promise<CommentTheme[]> {
  try {
    if (comments.length === 0) return []

    // Sample comments for analysis (max 100 to avoid token limits)
    const sampleComments = comments.slice(0, 100).map(c => c.commentText).join('\n- ')

    const prompt = `Analyze these user comments and identify the top 5-10 recurring themes or topics.

Comments:
- ${sampleComments}

Respond in JSON format as an array of themes:
[
  { "theme": "Product Quality", "keywords": ["quality", "durable", "well-made"] },
  { "theme": "Customer Service", "keywords": ["support", "help", "response"] }
]`

    const response = await generateAIInsights(prompt)

    // Try to parse JSON from response
    const jsonMatch = response.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      const themes = JSON.parse(jsonMatch[0])

      // Count occurrences and find examples
      return themes.map((theme: any) => {
        const keywords = theme.keywords || []
        const matchingComments = comments.filter(c =>
          keywords.some((keyword: string) => c.commentText.toLowerCase().includes(keyword.toLowerCase()))
        )

        return {
          theme: theme.theme,
          count: matchingComments.length,
          examples: matchingComments.slice(0, 3).map(c => c.commentText)
        }
      }).filter((t: CommentTheme) => t.count > 0)
    }

    // Fallback: keyword-based theme extraction
    return extractThemesKeywords(comments)
  } catch (error) {
    console.error('Error extracting themes with AI:', error)
    return extractThemesKeywords(comments)
  }
}

/**
 * Fallback keyword-based theme extraction
 */
function extractThemesKeywords(comments: CommentData[]): CommentTheme[] {
  const themes: { [key: string]: { count: number; examples: string[] } } = {
    'Product Quality': { count: 0, examples: [] },
    'Price/Value': { count: 0, examples: [] },
    'Customer Service': { count: 0, examples: [] },
    'Shipping/Delivery': { count: 0, examples: [] },
    'Design/Aesthetics': { count: 0, examples: [] }
  }

  const themeKeywords: { [key: string]: string[] } = {
    'Product Quality': ['quality', 'durable', 'well-made', 'broke', 'broken', 'defective'],
    'Price/Value': ['price', 'expensive', 'cheap', 'worth', 'value', 'cost'],
    'Customer Service': ['support', 'service', 'help', 'response', 'customer service'],
    'Shipping/Delivery': ['shipping', 'delivery', 'arrived', 'late', 'fast shipping'],
    'Design/Aesthetics': ['design', 'look', 'beautiful', 'ugly', 'style', 'color']
  }

  comments.forEach(comment => {
    const lowerText = comment.commentText.toLowerCase()

    Object.entries(themeKeywords).forEach(([theme, keywords]) => {
      if (keywords.some(keyword => lowerText.includes(keyword))) {
        themes[theme].count++
        if (themes[theme].examples.length < 3) {
          themes[theme].examples.push(comment.commentText)
        }
      }
    })
  })

  return Object.entries(themes)
    .filter(([_, data]) => data.count > 0)
    .map(([theme, data]) => ({ theme, count: data.count, examples: data.examples }))
    .sort((a, b) => b.count - a.count)
}

/**
 * Analyze all comments and generate comprehensive analysis
 */
export async function analyzeComments(
  comments: CommentData[],
  postCount: number
): Promise<CommentAnalysisResult> {
  console.log(`\n📊 Analyzing ${comments.length} comments...`)

  if (comments.length === 0) {
    return {
      totalComments: 0,
      sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 },
      topThemes: [],
      topCommenters: [],
      questionCount: 0,
      complaintCount: 0,
      praiseCount: 0,
      commonQuestions: [],
      peakCommentHours: [],
      avgCommentsPerPost: 0,
      mostLikedComments: []
    }
  }

  // 1. Sentiment analysis
  console.log('  💭 Analyzing sentiment...')
  let positiveCount = 0
  let neutralCount = 0
  let negativeCount = 0

  for (const comment of comments) {
    const sentiment = analyzeCommentSentimentKeywords(comment.commentText)
    if (sentiment.sentiment === 'positive') positiveCount++
    else if (sentiment.sentiment === 'negative') negativeCount++
    else neutralCount++
  }

  // 2. Theme extraction
  console.log('  🏷️  Extracting themes...')
  const topThemes = await extractCommentThemes(comments)

  // 3. Top commenters
  const commenterMap = new Map<string, number>()
  comments.forEach(c => {
    commenterMap.set(c.commentAuthor, (commenterMap.get(c.commentAuthor) || 0) + 1)
  })

  const topCommenters = Array.from(commenterMap.entries())
    .map(([username, count]) => ({ username, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  // 4. Comment classification
  let questionCount = 0
  let complaintCount = 0
  let praiseCount = 0
  const questions: string[] = []

  comments.forEach(comment => {
    const classification = classifyCommentType(comment.commentText)
    if (classification.isQuestion) {
      questionCount++
      if (questions.length < 10) {
        questions.push(comment.commentText)
      }
    }
    if (classification.isComplaint) complaintCount++
    if (classification.isPraise) praiseCount++
  })

  // 5. Peak comment hours
  const hourCounts = new Array(24).fill(0)
  comments.forEach(comment => {
    const hour = comment.publishedAt.getHours()
    hourCounts[hour]++
  })

  const peakCommentHours = hourCounts
    .map((count, hour) => ({ hour, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // 6. Most liked comments
  const mostLikedComments = comments
    .sort((a, b) => b.likes - a.likes)
    .slice(0, 10)
    .map(c => ({
      text: c.commentText,
      author: c.commentAuthor,
      likes: c.likes
    }))

  console.log('  ✅ Analysis complete')

  return {
    totalComments: comments.length,
    sentimentBreakdown: {
      positive: positiveCount,
      neutral: neutralCount,
      negative: negativeCount
    },
    topThemes,
    topCommenters,
    questionCount,
    complaintCount,
    praiseCount,
    commonQuestions: questions,
    peakCommentHours,
    avgCommentsPerPost: postCount > 0 ? comments.length / postCount : 0,
    mostLikedComments
  }
}

/**
 * Generate AI summary and recommendations based on comment analysis
 */
export async function generateCommentInsights(
  analysis: CommentAnalysisResult,
  brandName: string
): Promise<{ summary: string; recommendations: string }> {
  try {
    const prompt = `Based on this comment analysis for ${brandName}, provide insights and recommendations.

Analysis:
- Total comments: ${analysis.totalComments}
- Sentiment: ${analysis.sentimentBreakdown.positive} positive, ${analysis.sentimentBreakdown.neutral} neutral, ${analysis.sentimentBreakdown.negative} negative
- Top themes: ${analysis.topThemes.map(t => t.theme).join(', ')}
- Questions: ${analysis.questionCount}, Complaints: ${analysis.complaintCount}, Praise: ${analysis.praiseCount}

Provide:
1. A brief summary of the overall sentiment and key patterns (2-3 sentences)
2. 3-5 actionable recommendations for ${brandName} based on these comments

Format as JSON:
{
  "summary": "...",
  "recommendations": "..."
}`

    const response = await generateAIInsights(prompt)

    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0])
      return {
        summary: result.summary || 'Analysis complete',
        recommendations: result.recommendations || 'Continue engaging with your audience'
      }
    }

    return {
      summary: `Analyzed ${analysis.totalComments} comments with ${Math.round((analysis.sentimentBreakdown.positive / analysis.totalComments) * 100)}% positive sentiment. Top themes include ${analysis.topThemes.slice(0, 3).map(t => t.theme).join(', ')}.`,
      recommendations: 'Continue monitoring comments and engaging with your audience. Address common questions and complaints promptly.'
    }
  } catch (error) {
    console.error('Error generating insights:', error)
    return {
      summary: 'Analysis complete',
      recommendations: 'Continue engaging with your audience'
    }
  }
}

/**
 * Save comment analysis results to database
 */
export async function saveCommentAnalysis(
  sessionId: string,
  analysis: CommentAnalysisResult,
  insights: { summary: string; recommendations: string }
): Promise<void> {
  try {
    await prisma.commentAnalysis.upsert({
      where: { sessionId },
      create: {
        sessionId,
        totalComments: analysis.totalComments,
        avgCommentsPerPost: analysis.avgCommentsPerPost,
        positiveCount: analysis.sentimentBreakdown.positive,
        neutralCount: analysis.sentimentBreakdown.neutral,
        negativeCount: analysis.sentimentBreakdown.negative,
        topCommenters: JSON.stringify(analysis.topCommenters),
        mostLikedComments: JSON.stringify(analysis.mostLikedComments),
        commentThemes: JSON.stringify(analysis.topThemes),
        questionCount: analysis.questionCount,
        complaintCount: analysis.complaintCount,
        praiseCount: analysis.praiseCount,
        commonQuestions: JSON.stringify(analysis.commonQuestions),
        peakCommentHours: JSON.stringify(analysis.peakCommentHours),
        aiSummary: insights.summary,
        aiRecommendations: insights.recommendations
      },
      update: {
        totalComments: analysis.totalComments,
        avgCommentsPerPost: analysis.avgCommentsPerPost,
        positiveCount: analysis.sentimentBreakdown.positive,
        neutralCount: analysis.sentimentBreakdown.neutral,
        negativeCount: analysis.sentimentBreakdown.negative,
        topCommenters: JSON.stringify(analysis.topCommenters),
        mostLikedComments: JSON.stringify(analysis.mostLikedComments),
        commentThemes: JSON.stringify(analysis.topThemes),
        questionCount: analysis.questionCount,
        complaintCount: analysis.complaintCount,
        praiseCount: analysis.praiseCount,
        commonQuestions: JSON.stringify(analysis.commonQuestions),
        peakCommentHours: JSON.stringify(analysis.peakCommentHours),
        aiSummary: insights.summary,
        aiRecommendations: insights.recommendations
      }
    })

    console.log('💾 Comment analysis saved to database')
  } catch (error) {
    console.error('Error saving comment analysis:', error)
  }
}
