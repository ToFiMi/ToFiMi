import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongo'
import { ObjectId } from 'mongodb'
import { requireAuth } from '@/lib/auth-helpers'

// Manually mark user as attended (creates registration if needed)
export async function POST(req: NextRequest) {
    const authResult = await requireAuth(req, ['leader', 'animator', 'ADMIN'])
    if (authResult instanceof NextResponse) return authResult

    const { auth } = authResult
    if (!auth.schoolId && !auth.isAdmin) {
        return new NextResponse('School ID required', { status: 400 })
    }

    try {
        const { userId, eventId, attended } = await req.json()

        if (!userId || !eventId || typeof attended !== 'boolean') {
            return new NextResponse('Missing required fields', { status: 400 })
        }

        if (!ObjectId.isValid(userId) || !ObjectId.isValid(eventId)) {
            return new NextResponse('Invalid user or event ID', { status: 400 })
        }

        const db = await connectToDatabase()

        // Verify event belongs to the same school (admins can access all schools)
        const eventQuery: any = { _id: new ObjectId(eventId) }
        if (!auth.isAdmin) {
            eventQuery.school_id = new ObjectId(auth.schoolId)
        }

        const event = await db.collection('events').findOne(eventQuery)

        if (!event) {
            return new NextResponse('Event not found', { status: 404 })
        }

        // Verify user belongs to the same school (admins can access all schools)
        const userSchoolQuery: any = { user_id: new ObjectId(userId) }
        if (!auth.isAdmin) {
            userSchoolQuery.school_id = new ObjectId(auth.schoolId)
        }

        const userSchool = await db.collection('user_school').findOne(userSchoolQuery)

        if (!userSchool) {
            return new NextResponse('User not found in school', { status: 404 })
        }

        // IMPORTANT: Use user_school._id as user_id in registrations (not user._id)
        const userSchoolId = userSchool._id

        // Check if registration exists
        const existingRegistration = await db.collection('registrations').findOne({
            user_id: userSchoolId,
            event_id: new ObjectId(eventId)
        })

        if (existingRegistration) {
            // Update existing registration
            await db.collection('registrations').updateOne(
                { _id: existingRegistration._id },
                {
                    $set: {
                        attended,
                        attendance_marked_by: new ObjectId(auth.userSchoolId),
                        attendance_marked_at: new Date(),
                        updated: new Date()
                    }
                }
            )
        } else {
            // Create new registration with manual attendance
            await db.collection('registrations').insertOne({
                user_id: userSchoolId, // Use user_school._id, not user._id
                event_id: new ObjectId(eventId),
                school_id: new ObjectId(event.school_id),
                going: true,
                manually_registered: true, // Flag to indicate this was created by admin/leader
                attended,
                attendance_marked_by: new ObjectId(auth.userSchoolId),
                attendance_marked_at: new Date(),
                meals: [], // No meal selections for manual registration
                allergies: [],
                created: new Date(),
                updated: new Date()
            })
        }

        return NextResponse.json({ success: true, attended })
    } catch (error) {
        console.error('Error manually marking attendance:', error)
        return new NextResponse('Internal server error', { status: 500 })
    }
}