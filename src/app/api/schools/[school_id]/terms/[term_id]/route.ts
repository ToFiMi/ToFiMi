// /api/terms/[term_id]/route.ts
import { NextRequest } from 'next/server'
import { connectToDatabase } from '@/lib/mongo'
import { ObjectId } from 'mongodb'

export async function PUT(req: NextRequest, { params }: { params: { term_id: string } }) {
    const db = await connectToDatabase()
    const isAdmin = req.headers.get('x-is-admin') === 'true'

    if (!isAdmin) {
        return new Response('Access denied', { status: 403 })
    }

    const termId = params.term_id
    const { title, description, startDate, endDate, grade } = await req.json()

    await db.collection('terms').updateOne(
        { _id: new ObjectId(termId) },
        {
            $set: {
                title,
                description,
                startDate: new Date(startDate),
                endDate: new Date(endDate),
                grade,
                modifiedAt: new Date(),
            }
        }
    )

    return Response.json({ success: true })
}

export async function DELETE(req: NextRequest, { params }: { params: { term_id: string } }) {
    const db = await connectToDatabase()
    const isAdmin = req.headers.get('x-is-admin') === 'true'

    if (!isAdmin) {
        return new Response('Access denied', { status: 403 })
    }

    const termId = params.term_id

    await db.collection('terms').deleteOne({ _id: new ObjectId(termId) })

    return Response.json({ success: true })
}
