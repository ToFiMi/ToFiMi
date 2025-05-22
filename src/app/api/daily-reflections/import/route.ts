import {NextRequest, NextResponse} from 'next/server'
import {connectToDatabase} from '@/lib/mongo'
import {ObjectId} from 'mongodb'
import {Event} from '@/models/events'
import {DailyReflection} from '@/models/daliy-reflections'
import dayjs from 'dayjs'

export async function POST(req: NextRequest) {
    const db = await connectToDatabase()
    const body = await req.json()

    const {event_id, reflections, created_by, start_date} = body;

    if (!event_id || !Array.isArray(reflections) || reflections.length === 0 || !created_by) {
        return new NextResponse('Missing required fields', {status: 400})
    }

    const event = await db.collection<Event>('events').findOne({id: new ObjectId(event_id)})
    if (!event) return new NextResponse('Event not found', {status: 404})

    const baseDate = start_date
        ? dayjs(start_date).startOf('day')
        : dayjs(event.endDate).add(1, 'day').startOf('day')

    const documents = reflections.map((r: any, index: number) => ({
        event_id,
        date: baseDate.add(index, 'day').toDate(),
        verse_reference: r.verse_reference,
        content: r.content,
        created_by: new ObjectId(created_by),
        created: new Date(),
    }))

    await db.collection<DailyReflection>('daily_reflections').insertMany(documents as DailyReflection[])

    return NextResponse.json({inserted: documents.length})
}
