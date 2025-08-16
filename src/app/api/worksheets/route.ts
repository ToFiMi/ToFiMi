import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongo'
import { ObjectId } from 'mongodb'
import { requireAuth } from '@/lib/auth-helpers'
import { Worksheet } from '@/models/worksheet'

export async function POST(req: NextRequest) {
    const authResult = await requireAuth(req, ['ADMIN', 'leader', 'animator'])
    if (authResult instanceof NextResponse) return authResult
    
    const { auth } = authResult
    const db = await connectToDatabase()
    
    try {
        const body = await req.json()
        const { event_id, title, description, questions } = body

        if (!event_id || !title || !questions || !Array.isArray(questions)) {
            return new NextResponse('Missing required fields', { status: 400 })
        }

        // Verify event exists and user has access
        const eventQuery: any = { _id: new ObjectId(event_id) }
        if (!auth.isAdmin) {
            eventQuery.school_id = new ObjectId(auth.schoolId)
        }
        
        const event = await db.collection('events').findOne(eventQuery)
        if (!event) {
            return new NextResponse('Event not found', { status: 404 })
        }

        const worksheet: Omit<Worksheet, '_id'> = {
            school_id: new ObjectId(auth.schoolId),
            event_id: new ObjectId(event_id),
            title,
            description,
            questions: questions.map((q: any) => ({
                ...q,
                id: q.id || new ObjectId().toString()
            })),
            created_by: new ObjectId(auth.userSchoolId),
            is_template: false,
            created: new Date(),
            updated: new Date()
        }

        const result = await db.collection<Worksheet>('worksheets').insertOne(worksheet as Worksheet)
        
        // Update event to reference this worksheet
        await db.collection('events').updateOne(
            { _id: new ObjectId(event_id) },
            { $set: { worksheet_id: result.insertedId } }
        )

        return NextResponse.json({ 
            success: true, 
            worksheetId: result.insertedId.toString() 
        })
    } catch (error) {
        console.error('Error creating worksheet:', error)
        return new NextResponse('Internal server error', { status: 500 })
    }
}

export async function GET(req: NextRequest) {
    const authResult = await requireAuth(req)
    if (authResult instanceof NextResponse) return authResult
    
    const { auth } = authResult
    const db = await connectToDatabase()
    
    try {
        const url = new URL(req.url)
        const eventId = url.searchParams.get('event_id')
        
        if (!eventId) {
            return new NextResponse('Missing event_id parameter', { status: 400 })
        }

        // Find worksheet for this event
        const worksheet = await db.collection<Worksheet>('worksheets').findOne({
            event_id: new ObjectId(eventId)
        })

        return NextResponse.json(worksheet)
    } catch (error) {
        console.error('Error fetching worksheet:', error)
        return new NextResponse('Internal server error', { status: 500 })
    }
}