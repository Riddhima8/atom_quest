import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const checkIns = await prisma.checkIn.findMany({
      include: {
        goal: { include: { owner: { select: { username: true } } } }
      }
    })

    // Convert to CSV
    const header = 'Goal ID,Title,Owner,Quarter,Target,UoM,Status,Achievement,Manager Comment\n'
    const rows = checkIns.map((c: any) => 
      `"${c.goalId}","${c.goal.title}","${c.goal.owner.username}","${c.quarter}","${c.goal.target}","${c.goal.uom}","${c.status}","${c.achievementValue || ''}","${c.managerComment || ''}"`
    ).join('\n')

    const csvData = header + rows

    return new NextResponse(csvData, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="achievements_export.csv"'
      }
    })
  } catch (error) {
    console.error('API Export GET Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
