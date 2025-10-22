// /api/events/[event_id]/route.ts
import { NextRequest } from 'next/server'
import { connectToDatabase } from '@/lib/mongo'
import { ObjectId } from 'mongodb'
import {getToken} from "next-auth/jwt";
import {cookies} from "next/headers";
import { requireAuth } from '@/lib/auth-helpers';

export async function PUT(req: NextRequest, { params }: { params: { event_id: string, school_id: string } }) {
    const db = await connectToDatabase()

    // Allow ADMIN, leader, and animator to update events
    const authResult = await requireAuth(req, ['ADMIN', 'leader', 'animator'])
    if (authResult instanceof Response) {
        return authResult
    }
    const { auth } = authResult

    const { event_id: eventId, school_id: schoolId } = await params

    // For leaders and animators, ensure they can only update events for their own school
    if (!auth.isAdmin) {
        const event = await db.collection('events').findOne({ _id: new ObjectId(eventId) })
        if (!event || event.school_id.toString() !== auth.schoolId) {
            return new Response('Forbidden - can only update events for your own school', { status: 403 })
        }
    }

    const { title, description, startDate, endDate, grade, meals, homeworkTypes, worksheet_id } = await req.json()

    if (!title || !startDate || !endDate || grade == null) {
        return new Response('Missing required fields', { status: 400 })
    }

    // Validate unique homework_type_ids
    if (homeworkTypes && homeworkTypes.length > 0) {
        const ids = homeworkTypes.map((hw: any) => hw.id)
        const duplicates = ids.filter((id: string, index: number) => ids.indexOf(id) !== index)
        if (duplicates.length > 0) {
            return new Response(
                `Duplicitné homework_type_id: ${[...new Set(duplicates)].join(', ')}. Každá domáca úloha musí mať unikátne ID.`,
                { status: 400 }
            )
        }
    }

    const updateData: any = {
        title,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        grade,
        meals: meals || [],
        homeworkTypes: (homeworkTypes || []).map((hw: any) => ({
            id: hw.id,
            name: hw.name,
            description: hw.description,
            required: hw.required || false,
            dueDate: hw.dueDate ? new Date(hw.dueDate) : undefined,
            worksheet_id: hw.worksheet_id ? new ObjectId(hw.worksheet_id) : undefined
        })),
        updated: new Date(),
    }

    if (worksheet_id) {
        updateData.worksheet_id = new ObjectId(worksheet_id)
    }

    const updateQuery = { $set: updateData }
    if (!worksheet_id) {
        updateQuery.$unset = { worksheet_id: "" }
    }

    const result = await db.collection('events').updateOne(
        { _id: new ObjectId(eventId) },
        updateQuery
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

    const { event_id: eventId } = await params

    await db.collection('events').deleteOne({ _id: new ObjectId(eventId) })

    return Response.json({ success: true })
}
