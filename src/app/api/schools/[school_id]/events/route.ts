// /api/schools/[school_id]/events/route.ts
import { NextRequest } from 'next/server'
import { connectToDatabase } from '@/lib/mongo'
import { ObjectId } from 'mongodb'
import {getToken} from "next-auth/jwt";
import {cookies} from "next/headers";
import { requireAuth } from '@/lib/auth-helpers';

export async function GET(req: NextRequest, { params }: { params: { school_id: string } }) {
    const db = await connectToDatabase()
    const { school_id: schoolId } = await params

    const events = await db.collection('events')
        .find({ school_id: new ObjectId(schoolId) })
        .sort({ startDate: 1 })
        .toArray()

    return Response.json(events)
}

export async function POST(req: NextRequest, { params }: { params: { school_id: string } }) {
    const db = await connectToDatabase()

    // Allow ADMIN, leader, and animator to create events
    const authResult = await requireAuth(req, ['ADMIN', 'leader', 'animator'])
    if (authResult instanceof Response) {
        return authResult
    }
    const { auth } = authResult

    const { school_id: schoolId } = await params

    // For leaders and animators, ensure they can only create events for their own school
    if (!auth.isAdmin && auth.schoolId !== schoolId) {
        return new Response('Forbidden - can only create events for your own school', { status: 403 })
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

    const now = new Date()

    const eventData: any = {
        school_id: new ObjectId(schoolId),
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
        created: now,
        updated: now,
    }

    if (worksheet_id) {
        eventData.worksheet_id = new ObjectId(worksheet_id)
    }

    const result = await db.collection('events').insertOne(eventData)

    return Response.json({ success: true, insertedId: result.insertedId })
}
