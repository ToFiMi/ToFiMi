import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongo'
import { ObjectId } from 'mongodb'

export async function GET(req: NextRequest, { params }: { params: { event_id: string } }) {
    const db = await connectToDatabase()
    const { event_id } = await params

    try {
        let event

        if (!event_id || event_id === 'next') {
            const now = new Date()
            const next_event = await db.collection('events')
                .find({ startDate: { $gte: now } })
                .sort({ startDate: 1 })
                .limit(1)
                .toArray()

            if (!next_event.length) return new NextResponse('No upcoming event', { status: 404 })
            event = next_event[0]
        } else {
            event = await db.collection('events').findOne({ _id: new ObjectId(event_id) })
            if (!event) return new NextResponse('Event not found', { status: 404 })
        }

        const result = await db.collection('registrations').aggregate([
            {
                $match: {
                    event_id: new ObjectId(event._id),
                    going: true
                }
            },
            {
                $lookup: {
                    from: 'user_school',
                    localField: 'user_id',
                    foreignField: '_id',
                    as: 'user_school'
                }
            },
            { $unwind: '$user_school' },
            {
                $lookup: {
                    from: 'users',
                    localField: 'user_school.user_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            { $unwind: '$user' },
            {
                $lookup: {
                    from: 'user_tags',
                    localField: 'user._id',
                    foreignField: 'user_id',
                    as: 'user_tags'
                }
            },
            {
                $lookup: {
                    from: 'tags',
                    localField: 'user_tags.tag_id',
                    foreignField: '_id',
                    as: 'tags'
                }
            },
            {
                $project: {
                    user_id: '$user._id',
                    email: '$user.email',
                    first_name: '$user.first_name',
                    last_name: '$user.last_name',
                    meals: 1,
                    allergies: {
                        $map: {
                            input: {
                                $filter: {
                                    input: '$tags',
                                    as: 'tag',
                                    cond: { $eq: ['$$tag.type', 'allergy'] }
                                }
                            },
                            as: 'a',
                            in: '$$a.name'
                        }
                    }
                }
            }
        ]).toArray()


        const nextEvent = await db.collection('events')
            .find({ startDate: { $gt: event.startDate } })
            .sort({ startDate: 1 })
            .limit(1)
            .toArray()


        const prevEvent = await db.collection('events')
            .find({ startDate: { $lt: event.startDate } })
            .sort({ startDate: -1 })
            .limit(1)
            .toArray()

        return NextResponse.json({
            event: {
                ...event,
                _id: event._id.toString(),
                school_id: event.school_id.toString()
            },
            registrations: result,
            next_event: nextEvent[0]
                ? {
                    _id: nextEvent[0]._id.toString(),
                    title: nextEvent[0].title,
                    startDate: nextEvent[0].startDate
                }
                : null,
            previous_event: prevEvent[0]
                ? {
                    _id: prevEvent[0]._id.toString(),
                    title: prevEvent[0].title,
                    startDate: prevEvent[0].startDate
                }
                : null
        })
    } catch (e) {
        console.error('❌ Error in admin event report:', e)
        return new NextResponse('Server error', { status: 500 })
    }
}
