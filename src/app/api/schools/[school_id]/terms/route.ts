// /api/schools/[school_id]/terms/route.ts
import { NextRequest } from 'next/server'
import { connectToDatabase } from '@/lib/mongo'
import { ObjectId } from 'mongodb'

export async function GET(req: NextRequest, { params }: { params: { school_id: string } }) {
    const db = await connectToDatabase()
    const schoolId = params.school_id

    const terms = await db.collection('terms')
        .find({ school_id: new ObjectId(schoolId) })
        .sort({ startDate: 1 })
        .toArray()

    return Response.json(terms)
}

export async function POST(req: NextRequest, { params }: { params: { school_id: string } }) {
    const db = await connectToDatabase()
    const isAdmin = req.headers.get('x-is-admin') === 'true'

    if (!isAdmin) {
        return new Response('Access denied', { status: 403 })
    }

    const schoolId = params.school_id
    const { title, description, startDate, endDate, grade } = await req.json()

    if (!title || !startDate || !endDate || grade == null) {
        return new Response('Missing required fields', { status: 400 })
    }

    const now = new Date()

    const result = await db.collection('terms').insertOne({
        school_id: new ObjectId(schoolId),
        title,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        grade,
        createdAt: now,
        modifiedAt: now,
    })

    return Response.json({ success: true, insertedId: result.insertedId })
}
