// /api/schools/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongo'
import { ObjectId } from 'mongodb'
import { getAuthContext } from '@/lib/auth-context'

export async function GET(req: NextRequest) {
    const db = await connectToDatabase()
    const auth = await getAuthContext(req)

    if (!auth) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    if (auth.isAdmin) {
        const schools = await db.collection('schools').find({}).toArray()
        return NextResponse.json(schools)
    }

    if (!auth.schoolId) {
        return new NextResponse('Access denied', { status: 403 })
    }

    const school = await db.collection('schools').findOne({ _id: new ObjectId(auth.schoolId) })
    return NextResponse.json(school)
}

export async function POST(req: NextRequest) {
    const db = await connectToDatabase()
    const auth = await getAuthContext(req)

    if (!auth || !auth.isAdmin) {
        return new NextResponse('Access denied', { status: 403 })
    }

    const { name, slug, groups } = await req.json()

    if (!name || !slug || typeof groups !== 'number' || groups < 1) {
        return new NextResponse('Missing or invalid data', { status: 400 })
    }

    const existing = await db.collection('schools').findOne({ slug })
    if (existing) {
        return new NextResponse('School with this slug already exists', { status: 400 })
    }

    const now = new Date()
    const result = await db.collection('schools').insertOne({
        name,
        slug,
        created: now,
        updated: now,
    })

    const groupInserts = Array.from({ length: groups }).map((_, index) => ({
        school_id: result.insertedId,
        name: `Skupina ${index + 1}`,
        animators: [],
        created: now,
        updated: now,
    }))

    await db.collection('groups').insertMany(groupInserts)

    return NextResponse.json({ success: true, insertedId: result.insertedId })
}
