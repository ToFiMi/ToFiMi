import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongo'
import { getAuthContext } from '@/lib/auth-helpers'
import { ObjectId } from 'mongodb'
import { SignJWT } from 'jose'

export async function POST(req: NextRequest) {
    const auth = await getAuthContext(req)

    if (!auth) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    // Only ADMIN and leaders can impersonate
    if (!auth.isAdmin && auth.role !== 'leader') {
        return new NextResponse('Forbidden - only admins and leaders can impersonate users', { status: 403 })
    }

    const { targetUserId, targetUserSchoolId } = await req.json()

    if (!targetUserId || !targetUserSchoolId) {
        return new NextResponse('Missing targetUserId or targetUserSchoolId', { status: 400 })
    }

    try {
        const db = await connectToDatabase()

        // Fetch target user-school relationship first
        // targetUserSchoolId is the _id of the user_school document
        const userSchool = await db.collection('user_school').findOne({
            _id: new ObjectId(targetUserSchoolId)
        })

        if (!userSchool) {
            return new NextResponse('User-school relationship not found', { status: 404 })
        }

        // Now fetch the actual user data using the user_id from user_school
        const targetUser = await db.collection('users').findOne({
            _id: new ObjectId(userSchool.user_id)
        })

        if (!targetUser) {
            return new NextResponse('Target user not found', { status: 404 })
        }

        // Leaders can only impersonate users in their school
        if (auth.role === 'leader' && auth.schoolId !== userSchool.school_id.toString()) {
            return new NextResponse('Leaders can only impersonate users in their own school', { status: 403 })
        }

        // Create impersonation token
        const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET)
        const token = await new SignJWT({
            id: targetUser._id.toString(),
            user_id: targetUserSchoolId,
            school_id: userSchool.school_id.toString(),
            email: targetUser.email,
            role: userSchool.role,
            isAdmin: false,
            isActive: userSchool.role !== 'inactive',
            isImpersonating: true,
            originalAdminId: auth.userId,
            impersonatedUserId: targetUser._id.toString()
        })
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('8h')
            .sign(secret)

        // Log impersonation event
        await db.collection('audit_log').insertOne({
            event: 'user_impersonation_started',
            adminId: new ObjectId(auth.userId),
            adminEmail: auth.email,
            targetUserId: new ObjectId(targetUser._id),
            targetEmail: targetUser.email,
            targetUserSchoolId: new ObjectId(targetUserSchoolId),
            timestamp: new Date()
        })

        // Generate impersonation URL
        const baseUrl = process.env.NEXTAUTH_URL || req.nextUrl.origin
        const impersonateUrl = `${baseUrl}/impersonate?token=${token}`

        return NextResponse.json({
            success: true,
            impersonateUrl,
            targetUser: {
                id: targetUser._id.toString(),
                email: targetUser.email,
                name: `${targetUser.first_name} ${targetUser.last_name}`
            }
        })

    } catch (error) {
        console.error('Error creating impersonation token:', error)
        return new NextResponse('Internal server error', { status: 500 })
    }
}
