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
      // Get goals for employees reporting to this manager
      const employees = await prisma.user.findMany({
        where: { managerId: session.id },
        select: { id: true, username: true }
      })
      
      const employeeIds = employees.map((e: any) => e.id)
      
      const goals = await prisma.goal.findMany({
        where: { ownerId: { in: employeeIds } },
        include: { owner: { select: { username: true } } },
        orderBy: { createdAt: 'desc' }
      })
      return NextResponse.json(goals)
    }

    // Default: get own goals
    const goals = await prisma.goal.findMany({
      where: { ownerId: session.id },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(goals)
  } catch (error) {
    console.error('API Goals GET Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { title, description, thrustArea, uom, target, weightage } = body

    // Validations
    if (!title || !thrustArea || !uom || !target || weightage === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const weight = parseInt(weightage, 10)
    if (isNaN(weight) || weight < 10) {
      return NextResponse.json({ error: 'Minimum weightage is 10%' }, { status: 400 })
    }

    // Check total goals and current total weightage
    const currentGoals = await prisma.goal.findMany({
      where: { ownerId: session.id }
    })

    if (currentGoals.length >= 8) {
      return NextResponse.json({ error: 'Maximum 8 goals allowed' }, { status: 400 })
    }

    const totalWeight = currentGoals.reduce((sum: number, g: any) => sum + g.weightage, 0)
    if (totalWeight + weight > 100) {
      return NextResponse.json({ error: `Total weightage cannot exceed 100%. You have ${100 - totalWeight}% remaining.` }, { status: 400 })
    }

    const newGoal = await prisma.goal.create({
      data: {
        title,
        description: description || '',
        thrustArea,
        uom,
        target: target.toString(),
        weightage: weight,
        status: 'DRAFT',
        ownerId: session.id,
      }
    })

    // Log audit
    await prisma.auditLog.create({
      data: {
        action: 'CREATED_GOAL',
        details: `Goal created in DRAFT state.`,
        userId: session.id,
        goalId: newGoal.id
      }
    })

    return NextResponse.json(newGoal, { status: 201 })
  } catch (error) {
    console.error('API Goals POST Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
