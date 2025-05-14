// app/api/tags/route.ts
import { connectToDatabase } from '@/lib/mongo'
import {NextRequest, NextResponse} from 'next/server'

export async function GET() {
    const db = await connectToDatabase()
    const tags = await db.collection('tags').find({ type: 'allergy' }).toArray()
    return NextResponse.json(tags)
}
export async function POST(req: NextRequest) {
    const { name } = await req.json()

    if (!name) {
        return new NextResponse('Missing tag name', { status: 400 })
    }

    const db = await connectToDatabase()
    const existing = await db.collection('tags').findOne({ name, type: 'allergy' })

    if (existing) return NextResponse.json(existing)

    const result = await db.collection('tags').insertOne({
        name,
        type: 'allergy',
        created: new Date()
    })

    const tag = await db.collection('tags').findOne({ _id: result.insertedId })
    return NextResponse.json(tag)
}
