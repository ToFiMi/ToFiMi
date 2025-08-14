import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { connectToDatabase } from '@/lib/mongo'
import { ObjectId } from 'mongodb'
import { getServerSession } from 'next-auth'
import { encode } from 'next-auth/jwt'

export async function POST(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return new NextResponse('Unauthorized', { status: 401 })

    if (token.isAdmin) {
        return new NextResponse('Admins cannot switch schools', { status: 403 })
    }

    const db = await connectToDatabase()
    
    try {
        const body = await req.json()
        const { school_id } = body

        if (!school_id) {
            return new NextResponse('Missing school_id', { status: 400 })
        }

        // Verify user has access to this school
        const userSchool = await db.collection('user_school').findOne({
            user_id: new ObjectId(token.id),
            school_id: new ObjectId(school_id),
            role: { $ne: 'inactive' } // Make sure user is not inactive
        })

        if (!userSchool) {
            return new NextResponse('Access to this school denied', { status: 403 })
        }

        // Get the school info to update the token
        const school = await db.collection('schools').findOne({
            _id: new ObjectId(school_id)
        })

        if (!school) {
            return new NextResponse('School not found', { status: 404 })
        }

        // Update the token with new school info
        const updatedToken = {
            ...token,
            school_id: school_id,
            role: userSchool.role
        }

        // Create new JWT token
        const newToken = await encode({
            token: updatedToken,
            secret: process.env.NEXTAUTH_SECRET!
        })

        // Create response and set the updated cookie
        const response = NextResponse.json({ success: true })
        
        // Set the updated token in the cookie
        const cookieName = process.env.NODE_ENV === 'production' 
            ? '__Secure-next-auth.session-token' 
            : 'next-auth.session-token'
            
        response.cookies.set(cookieName, newToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 30 * 24 * 60 * 60 // 30 days
        })

        return response
    } catch (error) {
        console.error('Error switching school:', error)
        return new NextResponse('Internal server error', { status: 500 })
    }
}