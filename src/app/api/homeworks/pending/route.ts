import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongo'
import { getToken } from 'next-auth/jwt'
import { ObjectId } from 'mongodb'

export async function GET(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return new NextResponse('Unauthorized', { status: 401 })

    const db = await connectToDatabase()

    try {
        const now = new Date()
        now.setHours(0, 0, 0, 0) // Start of today

        // Find events that have ended and user attended
        const attendedEvents = await db.collection('events').aggregate([
            // Match events that have ended
            {
                $match: {
                    endDate: { $lt: now },
                    school_id: new ObjectId(token.school_id as string)
                }
            },
            // Lookup user's registration
            {
                $lookup: {
                    from: 'registrations',
                    let: { eventId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$event_id', '$$eventId'] },
                                        { $eq: ['$user_id', new ObjectId(token.user_id as string)] },
                                        { $eq: ['$attended', true] } // Only attended events
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'registration'
                }
            },
            // Only keep events where user attended
            {
                $match: {
                    'registration.0': { $exists: true }
                }
            },
            // Filter events that have homework types defined
            {
                $match: {
                    homeworkTypes: { $exists: true, $ne: [] }
                }
            },
            // Lookup existing homework submissions
            {
                $lookup: {
                    from: 'homeworks',
                    let: { eventId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$event_id', '$$eventId'] },
                                        { $eq: ['$user_id', new ObjectId(token.user_id as string)] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'submitted_homeworks'
                }
            },
            // Sort by end date descending (most recent first)
            {
                $sort: { endDate: -1 }
            },
            // Limit to last 5 events
            {
                $limit: 5
            }
        ]).toArray()

        // Process each event to determine homework status
        const assignments = attendedEvents.map((event: any) => {
            const submittedHomeworksMap = new Map(
                event.submitted_homeworks.map((hw: any) => [hw.homework_type_id, hw])
            )

            const homework_types = event.homeworkTypes.map((hwType: any) => {
                const submitted = submittedHomeworksMap.has(hwType.id)
                const submission = submittedHomeworksMap.get(hwType.id)

                return {
                    id: hwType.id,
                    name: hwType.name,
                    description: hwType.description,
                    required: hwType.required,
                    dueDate: hwType.dueDate,
                    worksheet_id: hwType.worksheet_id?.toString(),
                    submitted,
                    status: submission?.status
                }
            })

            // Only include events that have at least one incomplete homework
            const hasIncompleteHomework = homework_types.some((hw: any) => !hw.submitted)

            return {
                event_id: event._id.toString(),
                event_title: event.title,
                event_end_date: event.endDate,
                homework_types,
                hasIncompleteHomework
            }
        })

        // Filter to only include events with incomplete homework
        const pendingAssignments = assignments.filter((a: any) => a.hasIncompleteHomework)

        return NextResponse.json(pendingAssignments)
    } catch (error) {
        console.error('Error fetching pending homeworks:', error)
        return new NextResponse('Internal server error', { status: 500 })
    }
}