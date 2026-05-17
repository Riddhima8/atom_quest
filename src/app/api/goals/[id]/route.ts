import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    // In Next.js 15, params must be awaited
    const resolvedParams = await params;
    const goalId = resolvedParams.id;
    
    const body = await request.json()
    const { status, target, weightage, title } = body

    const existingGoal = await prisma.goal.findUnique({
      where: { id: goalId },
      include: { owner: true }
    })

    if (!existingGoal) {
      return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
    }

    // Authorization & State Machine
    // Employee can edit their own draft goals and submit them
    const isOwner = existingGoal.ownerId === session.id
    const isManager = existingGoal.owner.managerId === session.id

    if (!isOwner && !isManager && session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    let updateData: any = {}
    
    // Edit fields (if allowed)
    if (existingGoal.status === 'DRAFT' || existingGoal.status === 'RETURNED' || isManager) {
      if (target !== undefined) updateData.target = target.toString()
      if (weightage !== undefined) {
        const weight = parseInt(weightage, 10)
        if (!isNaN(weight) && weight >= 10) {
          updateData.weightage = weight
        }
      }
      if (title !== undefined && existingGoal.sharedFromId === null) {
        // Only allow title edit if not a shared goal
        updateData.title = title
      }
    }

    // Status transitions
    if (status) {
      if (isOwner && (existingGoal.status === 'DRAFT' || existingGoal.status === 'RETURNED') && status === 'PENDING') {
        updateData.status = 'PENDING'
      } else if (isManager && existingGoal.status === 'PENDING' && (status === 'APPROVED' || status === 'RETURNED')) {
        updateData.status = status
      } else if (session.role === 'ADMIN') {
        updateData.status = status // Admin can force status change
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid updates provided' }, { status: 400 })
    }

    const updatedGoal = await prisma.goal.update({
      where: { id: goalId },
      data: updateData
    })

    // Log audit
    await prisma.auditLog.create({
      data: {
        action: 'UPDATED_GOAL',
        details: `Updated fields: ${Object.keys(updateData).join(', ')}. New Status: ${updatedGoal.status}`,
        userId: session.id,
        goalId: updatedGoal.id
      }
    })

    return NextResponse.json(updatedGoal)
  } catch (error) {
    console.error('API Goal PUT Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    
    // In Next.js 15, params must be awaited
    const resolvedParams = await params;
    const goalId = resolvedParams.id;

    const existingGoal = await prisma.goal.findUnique({
      where: { id: goalId }
    })

    if (!existingGoal) return NextResponse.json({ error: 'Goal not found' }, { status: 404 })
    if (existingGoal.ownerId !== session.id && session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    
    // Can only delete if not approved
    if (existingGoal.status === 'APPROVED' && session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Cannot delete approved goals' }, { status: 400 })
    }

    // Need to delete checkins and audit logs first to prevent foreign key errors
    await prisma.checkIn.deleteMany({ where: { goalId } })
    await prisma.auditLog.deleteMany({ where: { goalId } })

    await prisma.goal.delete({ where: { id: goalId } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API Goal DELETE Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
