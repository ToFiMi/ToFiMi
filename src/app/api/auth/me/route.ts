import { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

export async function GET(req: NextRequest) {
    try {
        const token = req.cookies.get('auth_token')?.value
        if (!token) {
            return new Response('Unauthorized', { status: 401 })
        }

        const payload = await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET))

        return Response.json({
            email: payload.payload.email,
            isAdmin: payload.payload.isAdmin,
            role: payload.payload.role || null,
        })
    } catch (error) {
        console.error(error)
        return new Response('Unauthorized', { status: 401 })
    }
}
