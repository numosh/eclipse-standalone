import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { runAnalysis } from '@/lib/analysis-engine'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes timeout for Vercel

export async function POST(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    // Check for internal server token to allow background processing
    const internalToken = req.headers.get('x-internal-token')
    const isInternalCall = internalToken === process.env.INTERNAL_API_TOKEN

    console.log(`📥 Analysis request received for session: ${params.sessionId}`)
    console.log(`   Internal call: ${isInternalCall}`)

    // Only check session if not an internal call
    if (!isInternalCall) {
      const session = await getServerSession(authOptions)
      if (!session?.user) {
        console.log(`❌ Unauthorized request for session: ${params.sessionId}`)
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    console.log(`✅ Starting background analysis for session: ${params.sessionId}`)

    // Run analysis in background (non-blocking)
    // In production, you might want to use a queue system like BullMQ or AWS SQS
    runAnalysis(params.sessionId).catch(err => {
      console.error(`❌ Background analysis error for session ${params.sessionId}:`, err)
    })

    return NextResponse.json({
      message: 'Analysis started',
      sessionId: params.sessionId
    })
  } catch (error) {
    console.error('Error starting analysis:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
