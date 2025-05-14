// /api/schools/[school_id]/events/route.ts
import { NextRequest } from 'next/server'
import { connectToDatabase } from '@/lib/mongo'
import { ObjectId } from 'mongodb'
import {getToken} from "next-auth/jwt";
import {cookies} from "next/headers";

export async function GET(req: NextRequest, { params }: { params: { school_id: string } }) {
    const db = await connectToDatabase()
    const schoolId = params.school_id

    const events = await db.collection('events')
        .find({ school_id: new ObjectId(schoolId) })
        .sort({ startDate: 1 })
        .toArray()

    return Response.json(events)
}

export async function POST(req: NextRequest, { params }: { params: { school_id: string } }) {
    const db = await connectToDatabase()
    const token = await getToken({
        req: { cookies: await cookies() } as any,
        secret: process.env.NEXTAUTH_SECRET,
    })

    const  isAdmin = token?.isAdmin


    if (!isAdmin) {
        return new Response('Access denied', { status: 403 })
    }

    const schoolId = params.school_id
    const { title, description, startDate, endDate, grade, meals } = await req.json()

    if (!title || !startDate || !endDate || grade == null) {
        return new Response('Missing required fields', { status: 400 })
    }

    const now = new Date()

    const result = await db.collection('events').insertOne({
        school_id: new ObjectId(schoolId),
        title,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        grade,
        meals: meals || [],
        created: now,
        updated: now,
    })

    return Response.json({ success: true, insertedId: result.insertedId })
}
