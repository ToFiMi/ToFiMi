import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { connectToDatabase } from '@/lib/mongo'

export async function GET(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const db = await connectToDatabase()
    const reminder = await db.collection('reminder_preferences').findOne({ user_id: token.id })

    return NextResponse.json({
        hour: reminder?.hour ?? null,
        minute: reminder?.minute ?? null,
    })
}

export async function POST(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { hour, minute } = await req.json()

    if (
        typeof hour !== 'number' || hour < 0 || hour > 23 ||
        typeof minute !== 'number' || minute < 0 || minute > 59
    ) {
        return NextResponse.json({ error: 'Invalid hour or minute' }, { status: 400 })
    }

    const db = await connectToDatabase()
    await db.collection('reminder_preferences').updateOne(
        { user_id: token.id },
        { $set: { hour, minute, updated: new Date() } },
        { upsert: true }
    )

    return NextResponse.json({ success: true })
}
