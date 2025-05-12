import { cookies } from 'next/headers'
import { getToken } from 'next-auth/jwt'

export async function getAuthContextFromCookies() {

    const token = await getToken({ req: { cookies: await cookies() } as any, secret: process.env.NEXTAUTH_SECRET  })


    if (!token) {
        console.log("NO TOKEN")
        return null
    }

    return {
        userId: token.id as string,
        role: token.role as 'ADMIN' | 'USER' | 'LEADER' | 'ANIMATOR',
        isAdmin: token.role === 'ADMIN',
        schoolId: token.school_id as string | null,
    }
}
