// middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

const PUBLIC_PATHS = ['/', '/api/public', '/favicon.ico']

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl
    if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
        return NextResponse.next()
    }

    // Získa token z cookies
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

    // Ak nie je token, redirect na login
    if (!token) {
        return NextResponse.redirect(new URL('/', req.url))
    }


    const res = NextResponse.next()
    res.headers.set('x-user-id', token.id as string)
    res.headers.set('x-role', token.role as string)
    if (token.school_id) {
        res.headers.set('x-school-id', token.school_id as string)
        res.headers.set('x-user-school-id', token.user_id as string)
    }

    return res
}

export const config = {
    matcher: ['/((?!_next|_static|favicon.ico).*)'],
}
