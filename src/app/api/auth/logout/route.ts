// app/api/auth/logout/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
    console.log("logout")

    const response = NextResponse.redirect(new URL('/', process.env.NEXTAUTH_URL || 'http://localhost:3050'))

    // ⛔ cookies() NIE JE použiteľné na .delete
    // ✅ toto funguje
    response.cookies.delete('auth_token')

    return response
}
