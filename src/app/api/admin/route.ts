import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')

    if (type === 'audit') {
      const logs = await prisma.auditLog.findMany({
        include: { user: { select: { username: true } }, goal: { select: { title: true } } },
        orderBy: { timestamp: 'desc' },
        take: 100
      })
      return NextResponse.json(logs)
    }

    if (type === 'completion') {
      const checkIns = await prisma.checkIn.findMany({
        include: {
          goal: { include: { owner: { select: { username: true, role: true } } } }
        }
      })

      // Aggregate data by Quarter
      const quarters = ['Q1', 'Q2', 'Q3', 'Q4']
      const completionRates = quarters.map(q => {
        const checkinsForQ = checkIns.filter((c: any) => c.quarter === q)
        const total = checkinsForQ.length
        const completed = checkinsForQ.filter((c: any) => c.status === 'COMPLETED').length
        return {
          quarter: q,
          total,
          completed,
          rate: total > 0 ? ((completed / total) * 100).toFixed(1) : '0.0'
        }
      })

      return NextResponse.json(completionRates)
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })

  } catch (error) {
    console.error('API Admin GET Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
