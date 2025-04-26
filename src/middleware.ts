import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const PUBLIC_PATHS = ['/login', '/register', '/api/public']

export async function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl
    console.log(pathname)
    if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
        return NextResponse.next()
    }

    const token = req.cookies.get('auth_token')?.value
    console.log("midleware:",token)
    if (!token) {
        return NextResponse.redirect(new URL('/login', req.url))
    }

    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET)
        const { payload } = await jwtVerify(token, secret)

        const isAdmin = payload.isAdmin === true
        const schoolId = payload.school_id ?? null

        const res = NextResponse.next()
        res.headers.set('x-user-id', payload.user_id as string)
        res.headers.set('x-is-admin', String(isAdmin))
        if (!isAdmin && schoolId) {
            res.headers.set('x-school-id', schoolId as string)
        }

        return res
    } catch (err) {
        console.error('Invalid token:', JSON.stringify(err, null, 2))
        return NextResponse.redirect(new URL('/login', req.url))
    }
}

export const config = {
    matcher: ['/((?!_next|favicon.ico).*)'], // apply to all routes except static
}
