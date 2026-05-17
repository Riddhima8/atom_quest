import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const secretKey = new TextEncoder().encode(
  process.env.JWT_SECRET || 'super-secret-key-for-atomquest-portal-dev'
)

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1d')
    .sign(secretKey)
}

export async function decrypt(input: string): Promise<any> {
  const { payload } = await jwtVerify(input, secretKey, {
    algorithms: ['HS256'],
  })
  return payload
}

export async function getSession() {
  const cookieStore = await cookies()
  const session = cookieStore.get('session')?.value
  if (!session) return null
  try {
    return await decrypt(session)
  } catch (error) {
    return null
  }
}
