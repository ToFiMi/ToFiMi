// app/api/subscribe/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongo'

export async function POST(req: NextRequest) {
    const sub = await req.json()
    const db = await connectToDatabase()

    if (!sub || !sub.endpoint) {
        return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 })
    }

    await db.collection('push_subscriptions').updateOne(
        { endpoint: sub.endpoint },
        { $set: sub, $setOnInsert: { createdAt: new Date() } },
        { upsert: true }
    )

    return NextResponse.json({ success: true })
}
