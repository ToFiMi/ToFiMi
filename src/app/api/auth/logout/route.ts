// app/api/auth/logout/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
    const res = NextResponse.redirect(new URL('/', process.env.NEXTAUTH_URL || 'http://localhost:3000'))

    // Zmaž auth_token cookie
    res.cookies.set({
        name: 'auth_token',
        value: '',
        path: '/',
        maxAge: 0,
    })

    return res
}
