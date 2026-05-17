import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { encrypt } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: 'Missing username or password' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { username },
    })

    if (!user || user.password !== password) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)
    const session = await encrypt({ id: user.id, username: user.username, role: user.role })

    const cookieStore = await cookies()
    cookieStore.set('session', session, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      expires: expires,
      sameSite: 'lax',
      path: '/',
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
