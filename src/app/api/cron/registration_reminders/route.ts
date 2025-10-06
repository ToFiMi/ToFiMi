import { NextResponse } from 'next/server'
import dayjs from 'dayjs'
import { connectToDatabase } from '@/lib/mongo'
import webpush from 'web-push'
import { ObjectId } from 'mongodb'

export async function GET() {
    const db = await connectToDatabase()

    function ensureVapid() {
        const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        const privateKey = process.env.NEXT_PUBLIC_VAPID_PRIVATE_KEY
        if (!publicKey || !privateKey) throw new Error('Missing VAPID keys')
        webpush.setVapidDetails('mailto:admin@example.com', publicKey, privateKey)
    }

    ensureVapid()

    // Check for events at 5, 4, 3, 2, and 1 days before the event
    const daysToCheck = [5, 4, 3, 2, 1]
    let totalNotificationsSent = 0

    for (const daysAhead of daysToCheck) {
        const targetDate = dayjs().add(daysAhead, 'day').startOf('day').toDate()

        const events = await db.collection('events').find({
            startDate: {
                $gte: targetDate,
                $lt: dayjs(targetDate).endOf('day').toDate()
            }
        }).toArray()

        for (const event of events) {
            // Get all user_ids who have registered for this event with going: true
            const registeredUserIds = await db.collection('registrations').distinct('user_id', {
                event_id: event._id,
                going: true
            })

            // Get all users from user_school who match the event's school
            const eligibleUsers = await db.collection('user_school').aggregate([
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
                        user_id: '$user._id'
                    }
                }
            ]).toArray()

            // Filter out users who have already registered
            const registeredSet = new Set(registeredUserIds.map((id: ObjectId) => id.toString()))
            const nonRegisteredUsers = eligibleUsers.filter(
                u => !registeredSet.has(u.user_id.toString())
            )

            const nonRegisteredUserIds = nonRegisteredUsers.map(u => u.user_id)

            if (nonRegisteredUserIds.length === 0) continue

            // Get push subscriptions for non-registered users
            const pushSubs = await db.collection('push_subscriptions').find({
                user_id: { $in: nonRegisteredUserIds }
            }).toArray()

            const payload = JSON.stringify({
                title: 'Nezabudni sa registrovať',
                body: `Ešte si sa neprihlásil na víkend ${event.title} (o ${daysAhead} ${daysAhead === 1 ? 'deň' : daysAhead < 5 ? 'dni' : 'dní'})`,
            })

            for (const sub of pushSubs) {
                try {
                    // @ts-ignore
                    await webpush.sendNotification(sub, payload)
                    totalNotificationsSent++
                } catch (e: any) {
                    console.warn('Push notification error:', e.message)
                }
            }
        }
    }

    return NextResponse.json({ status: 'ok', notifications_sent: totalNotificationsSent })
}
