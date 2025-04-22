// /api/schools/route.ts
import { NextRequest } from 'next/server'
import { connectToDatabase } from '@/lib/mongo'
import {ObjectId} from "mongodb";

export async function GET(req: NextRequest) {
    const db = await connectToDatabase()
    const isAdmin = req.headers.get('x-is-admin') === 'true'
    const schoolId = req.headers.get('x-school-id')

    if (isAdmin) {
        const schools = await db.collection('schools').find({}).toArray()
        return Response.json(schools)
    }

    if (!schoolId) {
        return new Response('Access denied', { status: 403 })
    }

    const school = await db.collection('schools').findOne({ _id: new ObjectId(schoolId) })
    return Response.json(school)
}
