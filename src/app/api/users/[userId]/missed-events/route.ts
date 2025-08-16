import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongo'
import { ObjectId } from 'mongodb'
import { requireAuth } from '@/lib/auth-helpers'

export async function GET(req: NextRequest, { params }: { params: { userId: string } }) {
    const authResult = await requireAuth(req)
    if (authResult instanceof NextResponse) return authResult
    
    const { auth } = authResult
    const db = await connectToDatabase()
    
    try {
        const userId = params.userId
        
        // Only allow users to see their own missed events, or admins/leaders/animators to see any user's
        if (auth.userId !== userId && !['ADMIN', 'leader', 'animator'].includes(auth.role)) {
            return new NextResponse('Forbidden', { status: 403 })
        }

        // Find events where user was registered but didn't attend
        const missedRegistrations = await db.collection('registrations').find({
            user_id: new ObjectId(userId),
            going: true,
            attended: false // explicitly marked as not attended
        }).toArray()

        if (missedRegistrations.length === 0) {
            return NextResponse.json([])
        }

        // Get event details and worksheets for missed events
        const eventIds = missedRegistrations.map(reg => reg.event_id)
        
        const eventsWithWorksheets = await db.collection('events').aggregate([
            { $match: { _id: { $in: eventIds } } },
            {
                $lookup: {
                    from: 'worksheets',
                    localField: '_id',
                    foreignField: 'event_id',
                    as: 'worksheet'
                }
            },
            {
                $lookup: {
                    from: 'worksheet_submissions',
                    let: { eventId: '$_id', userId: new ObjectId(userId) },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$event_id', '$$eventId'] },
                                        { $eq: ['$user_id', '$$userId'] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: 'submission'
                }
            },
            {
                $project: {
                    _id: 1,
                    title: 1,
                    description: 1,
                    startDate: 1,
                    endDate: 1,
                    worksheet: { $arrayElemAt: ['$worksheet', 0] },
                    hasSubmission: { $gt: [{ $size: '$submission' }, 0] },
                    submission: { $arrayElemAt: ['$submission', 0] }
                }
            }
        ]).toArray()

        return NextResponse.json(eventsWithWorksheets)
    } catch (error) {
        console.error('Error fetching missed events:', error)
        return new NextResponse('Internal server error', { status: 500 })
    }
}