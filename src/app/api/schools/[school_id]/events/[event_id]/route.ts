// /api/events/[event_id]/route.ts
import { NextRequest } from 'next/server'
import { connectToDatabase } from '@/lib/mongo'
import { ObjectId } from 'mongodb'
import {getToken} from "next-auth/jwt";
import {cookies} from "next/headers";
import { requireAuth } from '@/lib/auth-helpers';

export async function PUT(req: NextRequest, { params }: { params: { event_id: string } }) {
    const db = await connectToDatabase()
    
    // Allow ADMIN, leader, and animator to update events
    const authResult = await requireAuth(req, ['ADMIN', 'leader', 'animator'])
    if (authResult instanceof Response) {
        return authResult
    }
    const { auth } = authResult

    const eventId = params.event_id
    const { title, description, startDate, endDate, grade, meals, homeworkTypes, worksheet_id } = await req.json()

    if (!title || !startDate || !endDate || grade == null) {
        return new Response('Missing required fields', { status: 400 })
    }

    const updateData: any = {
        title,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        grade,
        meals: meals || [],
        homeworkTypes: homeworkTypes || [],
        updated: new Date(),
    }

    if (worksheet_id) {
        updateData.worksheet_id = new ObjectId(worksheet_id)
    } else {
        updateData.$unset = { worksheet_id: "" }
    }

    const result = await db.collection('events').updateOne(
        { _id: new ObjectId(eventId) },
        worksheet_id ? { $set: updateData } : { $set: updateData, $unset: { worksheet_id: "" } }
    )

    return Response.json({ success: result.modifiedCount > 0 })
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
