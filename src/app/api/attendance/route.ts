import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongo'
import { ObjectId } from 'mongodb'
import { requireAuth } from '@/lib/auth-helpers'

export async function PUT(req: NextRequest) {
    const authResult = await requireAuth(req, ['leader', 'animator', 'ADMIN'])
    if (authResult instanceof NextResponse) return authResult
    
    const { auth } = authResult
    if (!auth.schoolId && !auth.isAdmin) {
        return new NextResponse('School ID required', { status: 400 })
    }

    try {
        const { registrationId, attended } = await req.json()

        if (!registrationId || typeof attended !== 'boolean') {
            return new NextResponse('Missing required fields', { status: 400 })
        }

        if (!ObjectId.isValid(registrationId)) {
            return new NextResponse('Invalid registration ID', { status: 400 })
        }

        const db = await connectToDatabase()

        // Verify registration belongs to the same school (admins can access all schools)
        const registrationQuery: any = { _id: new ObjectId(registrationId) }
        if (!auth.isAdmin) {
            registrationQuery.school_id = new ObjectId(auth.schoolId)
        }
        
        const registration = await db.collection('registrations').findOne(registrationQuery)

        if (!registration) {
            return new NextResponse('Registration not found', { status: 404 })
        }

        // Update attendance
        const result = await db.collection('registrations').updateOne(
            { _id: new ObjectId(registrationId) },
            {
                $set: {
                    attended,
                    attendance_marked_by: new ObjectId(auth.userSchoolId),
                    attendance_marked_at: new Date(),
                    updated: new Date()
                }
            }
        )

        if (result.matchedCount === 0) {
            return new NextResponse('Registration not found', { status: 404 })
        }

        return NextResponse.json({ success: true, attended })
    } catch (error) {
        console.error('Error updating attendance:', error)
        return new NextResponse('Internal server error', { status: 500 })
    }
}

// Batch update attendance for multiple users
export async function POST(req: NextRequest) {
    const authResult = await requireAuth(req, ['leader', 'animator', 'ADMIN'])
    if (authResult instanceof NextResponse) return authResult
    
    const { auth } = authResult
    if (!auth.schoolId && !auth.isAdmin) {
        return new NextResponse('School ID required', { status: 400 })
    }

    try {
        const { eventId, markAsAttended } = await req.json()

        if (!eventId || typeof markAsAttended !== 'boolean') {
            return new NextResponse('Missing required fields', { status: 400 })
        }

        if (!ObjectId.isValid(eventId)) {
            return new NextResponse('Invalid event ID', { status: 400 })
        }

        const db = await connectToDatabase()

        // Check if event exists and belongs to school (admins can access all schools)
        const eventQuery: any = { _id: new ObjectId(eventId) }
        if (!auth.isAdmin) {
            eventQuery.school_id = new ObjectId(auth.schoolId)
        }
        
        const event = await db.collection('events').findOne(eventQuery)

        if (!event) {
            return new NextResponse('Event not found', { status: 404 })
        }

        // Update attendance for all registered users who are going to this event
        const updateQuery: any = {
            event_id: new ObjectId(eventId),
            going: true,
            attended: { $exists: false } // Only update if not already marked
        }
        
        if (!auth.isAdmin) {
            updateQuery.school_id = new ObjectId(auth.schoolId)
        }

        const result = await db.collection('registrations').updateMany(
            updateQuery,
            {
                $set: {
                    attended: markAsAttended,
                    attendance_marked_by: new ObjectId(auth.userSchoolId),
                    attendance_marked_at: new Date(),
                    updated: new Date()
                }
            }
        )

        return NextResponse.json({ 
            success: true, 
            updatedCount: result.modifiedCount,
            markAsAttended 
        })
    } catch (error) {
        console.error('Error batch updating attendance:', error)
        return new NextResponse('Internal server error', { status: 500 })
    }
}