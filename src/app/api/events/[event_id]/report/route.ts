import {NextRequest} from 'next/server'
import { connectToDatabase } from '@/lib/mongo'
import { ObjectId} from 'mongodb'
import {Event} from "@/models/events"
import {Registration} from "@/models/registrations";


//@ts-ignore
export async function GET(req: NextRequest, { params }: { params: { event_id: string } }
) {
    const event_id = params.event_id


    try {
        const data = await getReport(event_id)
        return Response.json(data)
    } catch (err) {
        return new Response('Error: ' + err.message, { status: 500 })
    }

}



export async function getReport(event_id: string, school_id?: string) {
    const db = await connectToDatabase()

    let event

    if (!event_id || event_id === 'next') {
        const now = new Date()
        now.setHours(0, 0, 0, 0) // Start of today
        const query: any = { endDate: { $gte: now } }

        if (school_id) {
            query.school_id = new ObjectId(school_id)
        }

        console.log('Query for next event:', JSON.stringify(query))
        console.log('Current date (start of day):', now)

        const next_event = await db.collection('events')
            .find(query)
            .sort({ startDate: 1 })
            .limit(1)
            .toArray()

        console.log('Found events:', next_event.length)
        if (next_event.length > 0) {
            console.log('Event found:', next_event[0].title, 'End date:', next_event[0].endDate)
        }

         if (!next_event.length) return null
        event = next_event[0]
    } else {
        event = await db.collection('events').findOne({ _id: new ObjectId(event_id) })
        if (!event) throw new Error('Event not found')
    }

    const registrations = await db.collection<Registration>('registrations').aggregate([
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

    const [nextEvent] = await db.collection<Event>('events')
        .find({ startDate: { $gt: event.startDate } })
        .sort({ startDate: 1 })
        .limit(1)
        .toArray()

    const [previousEvent] = await db.collection<Event>('events')
        .find({ startDate: { $lt: event.startDate } })
        .sort({ startDate: -1 })
        .limit(1)
        .toArray()

    return {
        event: {
            ...event,
            _id: event._id.toString(),
            school_id: event.school_id.toString()
        },
        registrations,
        next_event: nextEvent
            ? {
                _id: nextEvent._id.toString(),
                title: nextEvent.title,
                startDate: nextEvent.startDate
            }
            : null,
        previous_event: previousEvent
            ? {
                _id: previousEvent._id.toString(),
                title: previousEvent.title,
                startDate: previousEvent.startDate
            }
            : null
    }
}
