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
    const db = await connectToDatabase()

    if (!event_id || typeof content !== 'string') {
        return new Response('Missing or invalid data', { status: 400 })
    }

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

export async function PUT(req: NextRequest) {
    const token = await getToken({
        req: { cookies: await req.cookies } as any,
        secret: process.env.NEXTAUTH_SECRET
    })

    if (!token) {
        return new Response('Unauthorized', { status: 401 })
    }

    const db = await connectToDatabase()
    const role = token.role
    const allowToApprove = role === "animator" || role === "ADMIN" || role === "leader"

    const { status, homework_id }:{status:string, homework_id: string} = await req.json()

    if (!allowToApprove || typeof status !== "string" || !homework_id) {
        return new Response('Forbidden or invalid data', { status: 403 })
    }

    const result = await db.collection("homeworks").updateOne(
        { _id: new ObjectId(homework_id) },
        { $set: { status } }
    )

    return Response.json({
        success: result.modifiedCount > 0
    })
}
