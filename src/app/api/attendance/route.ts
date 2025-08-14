import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongo'
import { getToken } from 'next-auth/jwt'
import { ObjectId } from 'mongodb'

export async function PUT(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return new NextResponse('Unauthorized', { status: 401 })

    const role = token.role
    if (role !== 'leader' && role !== 'animator' && role !== 'ADMIN') {
        return new NextResponse('Forbidden - insufficient permissions', { status: 403 })
    }

    const school_id = token.school_id
    if (!school_id) {
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

        // Verify registration belongs to the same school
        const registration = await db.collection('registrations').findOne({
            _id: new ObjectId(registrationId),
            school_id: new ObjectId(school_id)
        })

        if (!registration) {
            return new NextResponse('Registration not found', { status: 404 })
        }

        // Update attendance
        const result = await db.collection('registrations').updateOne(
            { _id: new ObjectId(registrationId) },
            {
                $set: {
                    attended,
                    attendance_marked_by: new ObjectId(token.user_id),
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
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return new NextResponse('Unauthorized', { status: 401 })

    const role = token.role
    if (role !== 'leader' && role !== 'animator' && role !== 'ADMIN') {
        return new NextResponse('Forbidden - insufficient permissions', { status: 403 })
    }

    const school_id = token.school_id
    if (!school_id) {
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

        // Check if event exists and belongs to school
        const event = await db.collection('events').findOne({
            _id: new ObjectId(eventId),
            school_id: new ObjectId(school_id)
        })

        if (!event) {
            return new NextResponse('Event not found', { status: 404 })
        }

        // Update attendance for all registered users who are going to this event
        const result = await db.collection('registrations').updateMany(
            {
                event_id: new ObjectId(eventId),
                school_id: new ObjectId(school_id),
                going: true,
                attended: { $exists: false } // Only update if not already marked
            },
            {
                $set: {
                    attended: markAsAttended,
                    attendance_marked_by: new ObjectId(token.user_id),
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