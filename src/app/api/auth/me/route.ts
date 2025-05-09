import { getToken } from 'next-auth/jwt'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

    if (!token) {
        return NextResponse.json({ role: null }, { status: 401 })
    }

    return NextResponse.json({
        user_id: token.id,
        role: token.role ?? "USER",
        school_id: token.school_id ?? null,
    })
}
