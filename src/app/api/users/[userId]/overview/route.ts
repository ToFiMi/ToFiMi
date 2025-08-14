import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongo'
import { getToken } from 'next-auth/jwt'
import { ObjectId } from 'mongodb'

export async function GET(req: NextRequest, { params }: { params: { userId: string } }) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return new NextResponse('Unauthorized', { status: 401 })

    const role = token.role
    if (role !== 'leader' && role !== 'animator') {
        return new NextResponse('Forbidden - insufficient permissions', { status: 403 })
    }

    const school_id = token.school_id
    if (!school_id) {
        return new NextResponse('School ID required', { status: 400 })
    }

    const userId = params.userId
    if (!userId || !ObjectId.isValid(userId)) {
        return new NextResponse('Invalid user ID', { status: 400 })
    }

    const db = await connectToDatabase()

    try {
        // Verify the user belongs to the same school
        const userSchool = await db.collection('user_school').findOne({
            user_id: new ObjectId(userId),
            school_id: new ObjectId(school_id),
            role: { $ne: 'inactive' }
        })

        if (!userSchool) {
            return new NextResponse('User not found in your school', { status: 404 })
        }

        // Get user basic info
        const user = await db.collection('users').findOne(
            { _id: new ObjectId(userId) },
            { projection: { passwordHash: 0 } }
        )

        if (!user) {
            return new NextResponse('User not found', { status: 404 })
        }

        // Get all events for this school
        const events = await db.collection('events')
            .find({ school_id: new ObjectId(school_id) })
            .sort({ startDate: -1 })
            .toArray()

        // Get user's registrations
        const registrations = await db.collection('registrations')
            .find({ 
                user_id: new ObjectId(userId),
                school_id: new ObjectId(school_id)
            })
            .toArray()

        // Get user's homework submissions
        const homeworks = await db.collection('homeworks')
            .find({ user_id: new ObjectId(userId) })
            .toArray()


        // Create a map for quick lookup
        const registrationMap = new Map()
        registrations.forEach(reg => {
            registrationMap.set(reg.event_id.toString(), reg)
        })

        const homeworkMap = new Map()
        homeworks.forEach(hw => {
            homeworkMap.set(hw.event_id.toString(), hw)
        })

        // Combine event data with attendance and homework status
        const eventOverview = events.map(event => {
            const eventId = event._id.toString()
            const registration = registrationMap.get(eventId)
            const homework = homeworkMap.get(eventId)

            return {
                _id: eventId,
                title: event.title,
                startDate: event.startDate,
                endDate: event.endDate,
                description: event.description,
                grade: event.grade,
                attendance: {
                    registered: !!registration,
                    going: registration?.going || false,
                    registrationDate: registration?.created || null
                },
                homework: {
                    submitted: !!homework,
                    content: homework?.content || null,
                    status: homework?.status || null,
                    submissionDate: homework?.created || null,
                    lastUpdate: homework?.updated || null
                }
            }
        })

        return NextResponse.json({
            user: {
                _id: user._id,
                first_name: user.first_name,
                last_name: user.last_name,
                email: user.email,
                role: userSchool.role
            },
            events: eventOverview,
            stats: {
                totalEvents: events.length,
                registeredEvents: registrations.length,
                attendedEvents: registrations.filter(r => r.going).length,
                submittedHomeworks: homeworks.length,
                approvedHomeworks: homeworks.filter(h => h.status === 'approved').length
            }
        })
    } catch (error) {
        console.error('Error fetching user overview:', error)
        return new NextResponse('Internal server error', { status: 500 })
    }
}