import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongo'
import webpush, { PushSubscription } from 'web-push'
import { requireAuth } from '@/lib/auth-helpers'

function ensureVapid(email: string) {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    const privateKey = process.env.NEXT_PUBLIC_VAPID_PRIVATE_KEY

    if (!publicKey || !privateKey) {
        throw new Error('VAPID keys missing in .env')
    }

    webpush.setVapidDetails(`mailto:${email || 'admin@example.com'}`, publicKey, privateKey)
}

export async function POST(req: NextRequest) {
    const authResult = await requireAuth(req, ['ADMIN', 'leader'])
    if (authResult instanceof NextResponse) {
        return authResult
    }
    const { auth } = authResult

    const { content, subject } = await req.json()

    if (!subject || !content) {
        return NextResponse.json({ error: 'Missing subject or content' }, { status: 400 })
    }

    ensureVapid(auth.email)

    const db = await connectToDatabase()
    const subs = await db
        .collection<PushSubscription>('push_subscriptions')
        .find({})
        .toArray()

    const payload = JSON.stringify({
        title: subject,
        body: content,
    })

    const results = []

    for (const sub of subs) {
        try {
            await webpush.sendNotification(sub, payload)
            results.push({ endpoint: sub.endpoint, success: true })
        } catch (err: any) {
            results.push({ endpoint: sub.endpoint, error: err?.message || 'Unknown error' })
            console.warn('Push error:', err?.message)
        }
    }

    return NextResponse.json({ results })
}
