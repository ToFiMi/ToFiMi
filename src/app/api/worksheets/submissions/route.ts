import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongo'
import { ObjectId } from 'mongodb'
import { requireAuth } from '@/lib/auth-helpers'
import { WorksheetSubmission } from '@/models/worksheet'

export async function POST(req: NextRequest) {
    const authResult = await requireAuth(req)
    if (authResult instanceof NextResponse) return authResult
    
    const { auth } = authResult
    const db = await connectToDatabase()
    
    try {
        const body = await req.json()
        const { worksheet_id, event_id, answers, essay_content } = body

        if (!worksheet_id || !event_id || !answers || !Array.isArray(answers)) {
            return new NextResponse('Missing required fields', { status: 400 })
        }

        // Verify worksheet exists
        const worksheet = await db.collection('worksheets').findOne({
            _id: new ObjectId(worksheet_id)
        })
        
        if (!worksheet) {
            return new NextResponse('Worksheet not found', { status: 404 })
        }

        // Check if user already submitted for this worksheet
        const existingSubmission = await db.collection('worksheet_submissions').findOne({
            worksheet_id: new ObjectId(worksheet_id),
            user_id: new ObjectId(auth.userId)
        })

        if (existingSubmission) {
            return new NextResponse('Worksheet already submitted', { status: 400 })
        }

        const submission: Omit<WorksheetSubmission, '_id'> = {
            worksheet_id: new ObjectId(worksheet_id),
            event_id: new ObjectId(event_id),
            user_id: new ObjectId(auth.userId),
            answers,
            essay_content,
            status: 'pending',
            comments: [],
            created: new Date(),
            updated: new Date()
        }

        const result = await db.collection<WorksheetSubmission>('worksheet_submissions').insertOne(submission as WorksheetSubmission)

        // Create homework entry for this worksheet submission
        // Use 'worksheet' as homework_type_id for worksheet submissions
        const homework = {
            event_id: new ObjectId(event_id),
            user_id: new ObjectId(auth.userId),
            homework_type_id: 'worksheet',
            worksheet_submission_id: result.insertedId,
            type: 'worksheet' as const,
            status: 'pending' as const,
            comments: [],
            created: new Date(),
            updated: new Date()
        }

        await db.collection('homeworks').insertOne(homework)

        return NextResponse.json({ 
            success: true, 
            submissionId: result.insertedId.toString() 
        })
    } catch (error) {
        console.error('Error submitting worksheet:', error)
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
        const userId = url.searchParams.get('user_id')
        
        if (!eventId) {
            return new NextResponse('Missing event_id parameter', { status: 400 })
        }

        const query: any = { event_id: new ObjectId(eventId) }
        
        // If user_id is provided and user is admin/leader/animator, get that user's submission
        // Otherwise, get current user's submission
        if (userId && ['ADMIN', 'leader', 'animator'].includes(auth.role)) {
            query.user_id = new ObjectId(userId)
        } else {
            query.user_id = new ObjectId(auth.userId)
        }

        const submission = await db.collection('worksheet_submissions').findOne(query)

        return NextResponse.json(submission)
    } catch (error) {
        console.error('Error fetching worksheet submission:', error)
        return new NextResponse('Internal server error', { status: 500 })
    }
}