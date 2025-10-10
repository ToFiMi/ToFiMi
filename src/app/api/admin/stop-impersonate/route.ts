import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { connectToDatabase } from '@/lib/mongo'
import { ObjectId } from 'mongodb'
import { SignJWT } from 'jose'

export async function POST(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

    if (!token) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    if (!token.isImpersonating || !token.originalAdminId) {
        return new NextResponse('Not in impersonation mode', { status: 400 })
    }

    try {
        const db = await connectToDatabase()

        // Fetch original admin user data
        const adminUser = await db.collection('users').findOne({
            _id: new ObjectId(token.originalAdminId as string)
        })

        if (!adminUser) {
            return new NextResponse('Original admin user not found', { status: 404 })
        }

        // Get admin's school relationships
        const schools = await db.collection('user_school').aggregate([
            {
                $match: {
                    user_id: new ObjectId(adminUser._id),
                    role: { $ne: 'inactive' }
                }
            },
            {
                $lookup: {
                    from: 'schools',
                    localField: 'school_id',
                    foreignField: '_id',
                    as: 'school'
                }
            },
            { $unwind: '$school' },
            {
                $project: {
                    id: '$_id',
                    school_id: '$school._id',
                    school_name: '$school.name',
                    role: 1
                }
            }
        ]).toArray()

        // Create restoration token with admin credentials
        const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET)
        let restorationPayload: any = {
            id: adminUser._id.toString(),
            email: adminUser.email,
            isAdmin: adminUser.isAdmin,
            isActive: true,
            school_choices: schools.map(s => ({
                id: s.id.toString(),
                school_id: s.school_id.toString(),
                role: s.role,
                name: s.school_name
            }))
        }

        // If admin is associated with a school, include it
        if (adminUser.isAdmin) {
            restorationPayload.role = 'ADMIN'
        } else if (schools.length === 1) {
            restorationPayload.user_id = schools[0].id.toString()
            restorationPayload.school_id = schools[0].school_id.toString()
            restorationPayload.role = schools[0].role
        } else {
            restorationPayload.role = null
        }

        const restorationToken = await new SignJWT(restorationPayload)
            .setProtectedHeader({ alg: 'HS256' })
            .setIssuedAt()
            .setExpirationTime('1h')
            .sign(secret)

        // Log impersonation stop
        await db.collection('audit_log').insertOne({
            event: 'user_impersonation_stopped',
            adminId: new ObjectId(token.originalAdminId as string),
            adminEmail: adminUser.email,
            impersonatedUserId: new ObjectId(token.impersonatedUserId as string),
            timestamp: new Date()
        })

        // Generate restoration URL
        const baseUrl = process.env.NEXTAUTH_URL || req.nextUrl.origin
        const restoreUrl = `${baseUrl}/restore-session?token=${restorationToken}`

        return NextResponse.json({
            success: true,
            redirectUrl: restoreUrl
        })

    } catch (error) {
        console.error('Error stopping impersonation:', error)
        return new NextResponse('Internal server error', { status: 500 })
    }
}
