import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { connectToDatabase } from '@/lib/mongo'

export async function PUT(req: NextRequest, { params }: { params: { event_id: string } }) {
    const { event_id } = params
    const { instructions } = await req.json()

    if (!ObjectId.isValid(event_id)) {
        return NextResponse.json({ error: 'Neplatné event ID' }, { status: 400 })
    }

    const db = await connectToDatabase()

    const result = await db.collection('events').updateOne(
        { _id: new ObjectId(event_id) },
        { $set: { instructions } }
    )

    if (result.modifiedCount === 0) {
        return NextResponse.json({ error: 'Nepodarilo sa aktualizovať event' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
}
