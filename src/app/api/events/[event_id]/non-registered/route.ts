import {NextRequest} from 'next/server'
import { connectToDatabase } from '@/lib/mongo'
import { ObjectId} from 'mongodb'

//@ts-ignore
export async function GET(req: NextRequest, { params }: { params: { event_id: string } }
) {
    const event_id = params.event_id

    try {
        const db = await connectToDatabase()

        const event = await db.collection('events').findOne({ _id: new ObjectId(event_id) })
        if (!event) {
            return new Response('Event not found', { status: 404 })
        }

        // Get all users in the school with the same grade as the event
        const allUsers = await db.collection('user_school').aggregate([
            {
                $match: {
                    school_id: new ObjectId(event.school_id),
                    role: { $in: ['user', 'animator', 'leader'] }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'user_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            { $unwind: '$user' },

            {
                $project: {
                    _id: '$user._id',
                    first_name: '$user.first_name',
                    last_name: '$user.last_name',
                    email: '$user.email',
                    grade: '$user.grade'
                }
            }
        ]).toArray()

        // Get all users who have registered for this event
        const registeredUsers = await db.collection('registrations').aggregate([
            {
                $match: {
                    event_id: new ObjectId(event_id),
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
                $project: {
                    user_id: '$user_school.user_id'
                }
            }
        ]).toArray()

        const registeredUserIds = new Set(registeredUsers.map(r => r.user_id.toString()))

        // Filter out registered users
        const nonRegisteredUsers = allUsers.filter(
            user => !registeredUserIds.has(user._id.toString())
        )

        return Response.json({
            event: {
                _id: event._id.toString(),
                title: event.title,
                grade: event.grade
            },
            non_registered_users: nonRegisteredUsers,
            total_count: nonRegisteredUsers.length
        })
    } catch (err) {
        return new Response('Error: ' + err.message, { status: 500 })
    }
}
