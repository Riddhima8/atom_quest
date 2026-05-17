import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const asManager = searchParams.get('asManager') === 'true'

    if (asManager && (session.role === 'MANAGER' || session.role === 'ADMIN')) {
      const employees = await prisma.user.findMany({
        where: { managerId: session.id },
        select: { id: true }
      })
      
      const employeeIds = employees.map((e: any) => e.id)
      
      // Fetch APPROVED goals for team
      const goals = await prisma.goal.findMany({
        where: { ownerId: { in: employeeIds }, status: 'APPROVED' },
        include: { 
          owner: { select: { username: true } },
          checkIns: true 
        },
        orderBy: { createdAt: 'desc' }
      })
      return NextResponse.json(goals)
    }

    // Default: get own APPROVED goals and their checkins
    const goals = await prisma.goal.findMany({
      where: { ownerId: session.id, status: 'APPROVED' },
      include: { checkIns: true },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(goals)
  } catch (error) {
    console.error('API Check-ins GET Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { goalId, quarter, status, achievementValue, managerComment } = body

    if (!goalId || !quarter) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const goal = await prisma.goal.findUnique({ where: { id: goalId }, include: { owner: true } })
    if (!goal) return NextResponse.json({ error: 'Goal not found' }, { status: 404 })

    const isOwner = goal.ownerId === session.id
    const isManager = goal.owner.managerId === session.id

    if (!isOwner && !isManager && session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Upsert CheckIn for the specific quarter
    const existingCheckIn = await prisma.checkIn.findFirst({
      where: { goalId, quarter }
    })

    let updateData: any = {}
    
    // Employee can update status and achievement
    if (isOwner) {
      if (status) updateData.status = status
      if (achievementValue !== undefined) updateData.achievementValue = achievementValue
    }

    // Manager can update comment
    if (isManager || session.role === 'ADMIN') {
      if (managerComment !== undefined) updateData.managerComment = managerComment
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid updates provided' }, { status: 400 })
    }

    let checkIn;
    if (existingCheckIn) {
      checkIn = await prisma.checkIn.update({
        where: { id: existingCheckIn.id },
        data: updateData
      })
    } else {
      checkIn = await prisma.checkIn.create({
        data: {
          goalId,
          quarter,
          status: status || 'NOT_STARTED',
          achievementValue: achievementValue || '',
          managerComment: managerComment || '',
        }
      })
    }

    return NextResponse.json(checkIn)
  } catch (error) {
    console.error('API Check-ins POST Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
