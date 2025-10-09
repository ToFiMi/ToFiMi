import { NextRequest } from 'next/server'
import { connectToDatabase } from '@/lib/mongo'
import { ObjectId } from 'mongodb'
import { getToken } from 'next-auth/jwt'
import dayjs from 'dayjs'

export async function GET(req: NextRequest, { params }: { params: { event_id: string } }) {
    const db = await connectToDatabase()
    const eventId = params.event_id
    const token = await getToken({
        req: { cookies: await req.cookies } as any,
        secret: process.env.NEXTAUTH_SECRET
    })

    if (!token) {
        return new Response('Unauthorized', { status: 401 })
    }

    if (!ObjectId.isValid(eventId)) {
        return new Response('Invalid event_id', { status: 400 })
    }

    const assignments = await db.collection('duty_assignments')
        .find({ event_id: new ObjectId(eventId) })
        .toArray()

    const normalized = assignments.map(a => ({
        ...a,
        _id: a._id.toString(),
        school_id: a.school_id.toString(),
        event_id: a.event_id.toString(),
        group_id: a.group_id.toString(),
        duty_type_id: a.duty_type_id.toString(),
        date: a.date?.toISOString?.() ?? a.date,
        created: a.created?.toISOString?.() ?? null,
        updated: a.updated?.toISOString?.() ?? null
    }))

    return Response.json(normalized)
}

export async function POST(req: NextRequest, { params }: { params: { event_id: string } }) {
    const db = await connectToDatabase()
    const eventId = params.event_id
    const token = await getToken({
        req: { cookies: await req.cookies } as any,
        secret: process.env.NEXTAUTH_SECRET
    })

    const allowedRoles = token?.role === 'ADMIN' || token?.role === 'leader' || token?.role === 'animator'
    if (!token || !allowedRoles) {
        return new Response('Unauthorized', { status: 401 })
    }

    if (!ObjectId.isValid(eventId)) {
        return new Response('Invalid event_id', { status: 400 })
    }

    const { action } = await req.json()

    if (action === 'generate') {
        return await generateRotation(db, eventId, token.school_id)
    }

    return new Response('Invalid action', { status: 400 })
}

export async function PUT(req: NextRequest, { params }: { params: { event_id: string } }) {
    const db = await connectToDatabase()
    const eventId = params.event_id
    const token = await getToken({
        req: { cookies: await req.cookies } as any,
        secret: process.env.NEXTAUTH_SECRET
    })

    const allowedRoles = token?.role === 'ADMIN' || token?.role === 'leader' || token?.role === 'animator'
    if (!token || !allowedRoles) {
        return new Response('Unauthorized', { status: 401 })
    }

    if (!ObjectId.isValid(eventId)) {
        return new Response('Invalid event_id', { status: 400 })
    }

    const { assignments } = await req.json()

    if (!Array.isArray(assignments)) {
        return new Response('Assignments must be an array', { status: 400 })
    }

    const eventObjectId = new ObjectId(eventId)

    // Delete existing assignments for this event
    await db.collection('duty_assignments').deleteMany({ event_id: eventObjectId })

    // Insert new assignments
    const docs = assignments.map(a => ({
        school_id: new ObjectId(a.school_id),
        event_id: eventObjectId,
        group_id: new ObjectId(a.group_id),
        duty_type_id: new ObjectId(a.duty_type_id),
        date: new Date(a.date),
        created: new Date(),
        updated: new Date()
    }))

    if (docs.length > 0) {
        await db.collection('duty_assignments').insertMany(docs)
    }

    return Response.json({ success: true, count: docs.length })
}

async function generateRotation(db: any, eventId: string, schoolId: string) {
    const eventObjectId = new ObjectId(eventId)
    const schoolObjectId = new ObjectId(schoolId)

    // Get event details
    const event = await db.collection('events').findOne({ _id: eventObjectId })
    if (!event) {
        return new Response('Event not found', { status: 404 })
    }

    // Get all groups for this school
    const groups = await db.collection('groups')
        .find({ school_id: schoolObjectId })
        .sort({ created: 1 })
        .toArray()

    if (groups.length === 0) {
        return new Response('No groups found for this school', { status: 400 })
    }

    // Get duty types
    const dutyTypes = await db.collection('duty_types')
        .find({ school_id: schoolObjectId })
        .sort({ order: 1 })
        .toArray()

    if (dutyTypes.length === 0) {
        return new Response('No duty types configured for this school', { status: 400 })
    }

    // Get rotation state for this grade
    let rotationState = await db.collection('duty_rotation_state').findOne({
        school_id: schoolObjectId,
        grade: event.grade
    })

    let startRotationIndex = 0
    if (rotationState) {
        startRotationIndex = (rotationState.last_rotation_index + 1) % dutyTypes.length
    }

    // Generate dates for the event
    // Parse dates and work with start of day to avoid timezone issues
    const startDate = dayjs(event.startDate).startOf('day')
    const endDate = dayjs(event.endDate).startOf('day')
    const days = []
    let currentDate = startDate

    console.log('Event startDate:', event.startDate)
    console.log('Event endDate:', event.endDate)
    console.log('Parsed startDate:', startDate.format('YYYY-MM-DD'))
    console.log('Parsed endDate:', endDate.format('YYYY-MM-DD'))

    while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, 'day')) {
        days.push(currentDate.toDate())
        currentDate = currentDate.add(1, 'day')
    }

    console.log('Generated days:', days.map(d => dayjs(d).format('YYYY-MM-DD')))

    // Generate assignments
    const assignments = []
    let currentRotationIndex = startRotationIndex

    for (let dayIndex = 0; dayIndex < days.length; dayIndex++) {
        const date = days[dayIndex]

        for (let groupIndex = 0; groupIndex < groups.length; groupIndex++) {
            const dutyTypeIndex = (currentRotationIndex + groupIndex) % dutyTypes.length
            const dutyType = dutyTypes[dutyTypeIndex]
            const group = groups[groupIndex]

            assignments.push({
                school_id: schoolObjectId,
                event_id: eventObjectId,
                group_id: group._id,
                duty_type_id: dutyType._id,
                date: date,
                created: new Date(),
                updated: new Date()
            })
        }

        // Rotate for next day
        currentRotationIndex = (currentRotationIndex + 1) % dutyTypes.length
    }

    // Delete existing assignments
    await db.collection('duty_assignments').deleteMany({ event_id: eventObjectId })

    // Insert new assignments
    if (assignments.length > 0) {
        await db.collection('duty_assignments').insertMany(assignments)
    }

    // Update rotation state
    const finalRotationIndex = (currentRotationIndex - 1 + dutyTypes.length) % dutyTypes.length
    await db.collection('duty_rotation_state').updateOne(
        { school_id: schoolObjectId, grade: event.grade },
        {
            $set: {
                last_rotation_index: finalRotationIndex,
                last_event_id: eventObjectId,
                updated: new Date()
            }
        },
        { upsert: true }
    )

    return Response.json({ success: true, count: assignments.length })
}