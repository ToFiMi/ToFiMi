import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { connectToDatabase } from '@/lib/mongo'

export async function PUT(req: NextRequest, { params }: { params: { event_id: string } }) {
    const { event_id } = params
    const { instructions, worksheet_id } = await req.json()

    if (!ObjectId.isValid(event_id)) {
        return NextResponse.json({ error: 'Neplatné event ID' }, { status: 400 })
    }

    const db = await connectToDatabase()

    const updateFields: any = {}
    if (instructions !== undefined) updateFields.instructions = instructions
    if (worksheet_id !== undefined) {
        updateFields.worksheet_id = worksheet_id ? new ObjectId(worksheet_id) : null
    }

    const result = await db.collection('events').updateOne(
        { _id: new ObjectId(event_id) },
        { $set: updateFields }
    )

    if (result.modifiedCount === 0) {
        return NextResponse.json({ error: 'Nepodarilo sa aktualizovať event' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
}
