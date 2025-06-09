import { NextResponse } from 'next/server'
import dayjs from 'dayjs'
import { connectToDatabase } from '@/lib/mongo'
import webpush from 'web-push'

export async function GET() {
    const db = await connectToDatabase()

    function ensureVapid() {
        const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        const privateKey = process.env.NEXT_PUBLIC_VAPID_PRIVATE_KEY
        if (!publicKey || !privateKey) throw new Error('Missing VAPID keys')
        webpush.setVapidDetails('mailto:admin@example.com', publicKey, privateKey)
    }

    ensureVapid()

    const threeDaysLater = dayjs().add(3, 'day').startOf('day').toDate()

    const events = await db.collection('events').find({
        start: {
            $gte: threeDaysLater,
            $lt: dayjs(threeDaysLater).endOf('day').toDate()
        }
    }).toArray()

    for (const event of events) {
        const registrations = await db.collection('registrations').distinct('user_id', { event_id: event._id })

        const users = await db.collection('users').find({
            _id: { $nin: registrations }
        }).toArray()

        const payload = JSON.stringify({
            title: 'Nezabudni sa registrovať',
            body: `Ešte si sa neprihlásil na víkend ${event.title}`,
        })

        for (const user of users) {
            if (user.pushSubscription) {
                await webpush.sendNotification(user.pushSubscription, payload)
            }
        }
    }

    return NextResponse.json({ status: 'ok' })
}
