// /api/events/[event_id]/route.ts
import { NextRequest } from 'next/server'
import { connectToDatabase } from '@/lib/mongo'
import { ObjectId } from 'mongodb'
import {getToken} from "next-auth/jwt";
import {cookies} from "next/headers";

export async function PUT(req: NextRequest, { params }: { params: { event_id: string } }) {
    const db = await connectToDatabase()
    const token = await getToken({
        req: { cookies: await cookies() } as any,
        secret: process.env.NEXTAUTH_SECRET,
    })

   const  isAdmin = token?.isAdmin

    if (!isAdmin) {
        return new Response('Access denied', { status: 403 })
    }

    const eventId = params.event_id
    const { title, description, startDate, endDate, grade } = await req.json()

    await db.collection('events').updateOne(
        { _id: new ObjectId(eventId) },
        {
            $set: {
                title,
                description,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                grade,
                updated: new Date(),
            }
        }
    )

    return Response.json({ success: true })
}

export async function DELETE(req: NextRequest, { params }: { params: { event_id: string } }) {
    const db = await connectToDatabase()
    const token = await getToken({
        req: { cookies: await cookies() } as any,
        secret: process.env.NEXTAUTH_SECRET,
    })

    const  isAdmin = token?.isAdmin

    if (!isAdmin) {
        return new Response('Access denied', { status: 403 })
    }

    const eventId = params.event_id

    await db.collection('events').deleteOne({ _id: new ObjectId(eventId) })

    return Response.json({ success: true })
}
