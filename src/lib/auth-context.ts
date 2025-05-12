
import { getToken } from 'next-auth/jwt'
import { NextRequest } from 'next/server'

export async function getAuthContext(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

    if (!token) return null

    return {
        userId: token.id as string,
        role: token.role as 'ADMIN' | 'user' | 'leader' | 'animator',
        isAdmin: token.role === 'ADMIN',
        schoolId: token.school_id as string | null,
    }
}
