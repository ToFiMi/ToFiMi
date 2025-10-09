import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { connectToDatabase } from '@/lib/mongo'

export async function PUT(req: NextRequest, { params }: { params: { event_id: string } }) {
    const { event_id } = params
    const body = await req.json()
    const { instructions, worksheet_id, feedbackUrl, sheetsUrl, title, description, startDate, endDate, grade, meals, homeworkTypes } = body

    if (!ObjectId.isValid(event_id)) {
        return NextResponse.json({ error: 'Neplatné event ID' }, { status: 400 })
    }

    const db = await connectToDatabase()

    const updateFields: any = {}
    if (instructions !== undefined) updateFields.instructions = instructions
    if (worksheet_id !== undefined) {
        updateFields.worksheet_id = worksheet_id ? new ObjectId(worksheet_id) : null
    }
    if (feedbackUrl !== undefined) updateFields.feedbackUrl = feedbackUrl
    if (sheetsUrl !== undefined) updateFields.sheetsUrl = sheetsUrl
    if (title !== undefined) updateFields.title = title
    if (description !== undefined) updateFields.description = description
    if (startDate !== undefined) updateFields.startDate = new Date(startDate)
    if (endDate !== undefined) updateFields.endDate = new Date(endDate)
    if (grade !== undefined) updateFields.grade = grade
    if (meals !== undefined) updateFields.meals = meals
    if (homeworkTypes !== undefined) updateFields.homeworkTypes = homeworkTypes

    updateFields.updated = new Date()

    const result = await db.collection('events').updateOne(
        { _id: new ObjectId(event_id) },
        { $set: updateFields }
    )

    if (result.modifiedCount === 0) {
        return NextResponse.json({ error: 'Nepodarilo sa aktualizovať event' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
}
