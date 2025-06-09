import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongo'
import webpush from 'web-push'

function ensureVapid() {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    const privateKey = process.env.NEXT_PUBLIC_VAPID_PRIVATE_KEY
    if (!publicKey || !privateKey) throw new Error('Missing VAPID keys')
    webpush.setVapidDetails('mailto:admin@example.com', publicKey, privateKey)
}

export async function GET() {
    const now = new Date()
    const hour = now.getHours()
    const minute = now.getMinutes()

    const db = await connectToDatabase()
    ensureVapid()

    const reminders = await db.collection('reminders').find({ hour, minute }).toArray()

    const pushSubs = await db
        .collection('push_subscriptions')
        .find({ user_id: { $in: reminders.map(r => r.user_id) } })
        .toArray()

    const payload = JSON.stringify({
        title: 'Denné zamyslenie ✨',
        body: 'Nezabudni si prečítať dnešné zamyslenie 🙏',
    })

    const results = []

    for (const sub of pushSubs) {
        try {
            // @ts-ignore
            await webpush.sendNotification(sub, payload)
            results.push({ user_id: sub.user_id, ok: true })
        } catch (e: any) {
            console.warn('Push error:', e.message)
            results.push({ user_id: sub.user_id, error: e.message })
        }
    }

    return NextResponse.json({ sent: results.length, results })
}
