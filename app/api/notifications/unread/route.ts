import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const count = await prisma.analysisSession.count({
      where: {
        userId: (session.user as any).id,
        status: 'completed',
        notificationRead: false
      }
    })

    return NextResponse.json({ count })
  } catch (error) {
    console.error('Error fetching unread notifications:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
