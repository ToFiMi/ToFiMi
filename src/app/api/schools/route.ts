// /api/schools/route.ts
import { NextRequest } from 'next/server'
import { connectToDatabase } from '@/lib/mongo'
import { ObjectId } from 'mongodb'

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

export async function POST(req: NextRequest) {
    const db = await connectToDatabase()
    const isAdmin = req.headers.get('x-is-admin') === 'true'

    if (!isAdmin) {
        return new Response('Access denied', { status: 403 })
    }

    const { name, slug } = await req.json()

    if (!name || !slug) {
        return new Response('Missing name or slug', { status: 400 })
    }

    const existing = await db.collection('schools').findOne({ slug })

    if (existing) {
        return new Response('School with this slug already exists', { status: 400 })
    }

    const now = new Date()

    const result = await db.collection('schools').insertOne({
        name,
        slug,
        createdAt: now,
        modifiedAt: now,
    })

    return Response.json({ success: true, insertedId: result.insertedId })
}
