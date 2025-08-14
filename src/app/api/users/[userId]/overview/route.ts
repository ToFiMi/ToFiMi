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
        // Verify the user belongs to the same school and get user_school ID
        const userSchool = await db.collection('user_school').findOne({
            user_id: new ObjectId(userId),
            school_id: new ObjectId(school_id),
            role: { $ne: 'inactive' }
        })

        if (!userSchool) {
            return new NextResponse('User not found in your school', { status: 404 })
        }

        // The registration table uses user_school._id as user_id, not users._id
        const userSchoolId = userSchool._id.toString()

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

        // Get user's registrations (using user_school._id as user_id)
        const registrations = await db.collection('registrations')
            .find({ 
                user_id: new ObjectId(userSchoolId),
                school_id: new ObjectId(school_id)
            })
            .toArray()

        // Get user's homework submissions (only for regular users)
        const homeworks = userSchool.role === 'user' 
            ? await db.collection('homeworks')
                .find({ user_id: new ObjectId(userSchoolId) })
                .toArray()
            : []


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
            const eventHasPassed = new Date() > new Date(event.endDate)

            // Default attendance logic: if registered and going, and event has passed, default to attended
            let defaultAttended = null
            if (registration?.going && eventHasPassed) {
                defaultAttended = registration.attended !== undefined ? registration.attended : true
            } else if (registration?.going) {
                defaultAttended = registration.attended !== undefined ? registration.attended : null
            } else {
                defaultAttended = false
            }

            return {
                _id: eventId,
                title: event.title,
                startDate: event.startDate,
                endDate: event.endDate,
                description: event.description,
                grade: event.grade,
                registrationId: registration?._id?.toString() || null,
                attendance: {
                    registered: !!registration,
                    going: registration?.going || false,
                    attended: defaultAttended,
                    attendanceMarkedBy: registration?.attendance_marked_by?.toString() || null,
                    attendanceMarkedAt: registration?.attendance_marked_at || null,
                    registrationDate: registration?.created || null
                },
                homework: userSchool.role === 'user' ? {
                    submitted: !!homework,
                    content: homework?.content || null,
                    status: homework?.status || null,
                    submissionDate: homework?.created || null,
                    lastUpdate: homework?.updated || null
                } : {
                    submitted: false,
                    content: null,
                    status: null,
                    submissionDate: null,
                    lastUpdate: null
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
                attendedEvents: registrations.filter(r => {
                    // Count as attended if explicitly marked as attended, or if going and event passed (default logic)
                    if (r.attended === true) return true
                    if (r.attended === false) return false
                    // Default: if going and event has passed, count as attended
                    const event = events.find(e => e._id.toString() === r.event_id.toString())
                    if (r.going && event && new Date() > new Date(event.endDate)) return true
                    return false
                }).length,
                submittedHomeworks: homeworks.length,
                approvedHomeworks: homeworks.filter(h => h.status === 'approved').length
            }
        })
    } catch (error) {
        console.error('Error fetching user overview:', error)
        return new NextResponse('Internal server error', { status: 500 })
    }
}