import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongo'
import { ObjectId } from 'mongodb'
import { requireAuth } from '@/lib/auth-helpers'
import { Worksheet } from '@/models/worksheet'

// Get single worksheet
export async function GET(req: NextRequest, { params }: { params: { worksheetId: string } }) {
    const authResult = await requireAuth(req, ['ADMIN', 'leader', 'animator'])
    if (authResult instanceof NextResponse) return authResult
    
    const { auth } = authResult
    const db = await connectToDatabase()
    
    try {
        const worksheetId = params.worksheetId

        const worksheet = await db.collection('worksheets').findOne({
            _id: new ObjectId(worksheetId)
        })

        if (!worksheet) {
            return new NextResponse('Worksheet not found', { status: 404 })
        }

        return NextResponse.json(worksheet)
    } catch (error) {
        console.error('Error fetching worksheet:', error)
        return new NextResponse('Internal server error', { status: 500 })
    }
}

// Update worksheet
export async function PUT(req: NextRequest, { params }: { params: { worksheetId: string } }) {
    const authResult = await requireAuth(req, ['ADMIN', 'leader', 'animator'])
    if (authResult instanceof NextResponse) return authResult
    
    const { auth } = authResult
    const db = await connectToDatabase()
    
    try {
        const worksheetId = params.worksheetId
        const body = await req.json()
        const { title, description, questions, is_template } = body

        if (!title || !questions || !Array.isArray(questions)) {
            return new NextResponse('Missing required fields', { status: 400 })
        }

        // Find the worksheet to check permissions
        const existingWorksheet = await db.collection('worksheets').findOne({
            _id: new ObjectId(worksheetId)
        })

        if (!existingWorksheet) {
            return new NextResponse('Worksheet not found', { status: 404 })
        }

        // Check permissions: admins can edit all, leaders/animators can only edit their school's worksheets
        const canEdit = auth.isAdmin || existingWorksheet.school_id.toString() === auth.schoolId

        if (!canEdit) {
            return new NextResponse('Permission denied - you can only edit worksheets from your school', { status: 403 })
        }

        const updateData: Partial<Worksheet> = {
            title,
            description,
            questions: questions.map((q: any) => ({
                ...q,
                id: q.id || new ObjectId().toString()
            })),
            is_template: is_template !== undefined ? is_template : existingWorksheet.is_template,
            updated: new Date()
        }

        const result = await db.collection('worksheets').updateOne(
            { _id: new ObjectId(worksheetId) },
            { $set: updateData }
        )

        if (result.matchedCount === 0) {
            return new NextResponse('Worksheet not found', { status: 404 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error updating worksheet:', error)
        return new NextResponse('Internal server error', { status: 500 })
    }
}

// Delete worksheet
export async function DELETE(req: NextRequest, { params }: { params: { worksheetId: string } }) {
    const authResult = await requireAuth(req, ['ADMIN', 'leader', 'animator'])
    if (authResult instanceof NextResponse) return authResult
    
    const { auth } = authResult
    const db = await connectToDatabase()
    
    try {
        const worksheetId = params.worksheetId

        // Find the worksheet to check permissions
        const existingWorksheet = await db.collection('worksheets').findOne({
            _id: new ObjectId(worksheetId)
        })

        if (!existingWorksheet) {
            return new NextResponse('Worksheet not found', { status: 404 })
        }

        // Check permissions: admins can delete all, leaders/animators can only delete their school's worksheets
        const canDelete = auth.isAdmin || existingWorksheet.school_id.toString() === auth.schoolId

        if (!canDelete) {
            return new NextResponse('Permission denied - you can only delete worksheets from your school', { status: 403 })
        }

        // Check if worksheet is assigned to any events
        const eventsUsingWorksheet = await db.collection('events').findOne({
            worksheet_id: new ObjectId(worksheetId)
        })

        if (eventsUsingWorksheet) {
            return new NextResponse('Cannot delete worksheet - it is assigned to an event', { status: 400 })
        }

        // Check if there are any submissions for this worksheet
        const submissions = await db.collection('worksheet_submissions').findOne({
            worksheet_id: new ObjectId(worksheetId)
        })

        if (submissions) {
            return new NextResponse('Cannot delete worksheet - it has existing submissions', { status: 400 })
        }

        // Delete the worksheet
        const result = await db.collection('worksheets').deleteOne({
            _id: new ObjectId(worksheetId)
        })

        if (result.deletedCount === 0) {
            return new NextResponse('Worksheet not found', { status: 404 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting worksheet:', error)
        return new NextResponse('Internal server error', { status: 500 })
    }
}