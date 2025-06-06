import { NextRequest } from 'next/server'
import { connectToDatabase } from '@/lib/mongo'
import { getToken } from 'next-auth/jwt'
import { ObjectId } from 'mongodb'

export async function POST(req: NextRequest) {
    const token = await getToken({
        req: { cookies: await req.cookies } as any,
        secret: process.env.NEXTAUTH_SECRET
    })

    if (!token) {
        return new Response('Unauthorized', { status: 401 })
    }

    const userId = token.user_id
    const { event_id, content } = await req.json()

    if (!event_id || typeof content !== 'string') {
        return new Response('Missing or invalid data', { status: 400 })
    }

    const db = await connectToDatabase()
    const now = new Date()

    const result = await db.collection('homeworks').updateOne(
        {
            event_id: new ObjectId(event_id),
            user_id: new ObjectId(userId)
        },
        {
            $set: {
                content,
                updated: now
            },
            $setOnInsert: {
                created: now
            }
        },
        { upsert: true }
    )

    return Response.json({
        success: true,
        upserted: result.upsertedCount > 0,
        modified: result.modifiedCount > 0
    })
}
