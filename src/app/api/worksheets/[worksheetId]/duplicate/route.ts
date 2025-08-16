import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongo'
import { ObjectId } from 'mongodb'
import { requireAuth } from '@/lib/auth-helpers'
import { Worksheet } from '@/models/worksheet'

export async function POST(req: NextRequest, { params }: { params: { worksheetId: string } }) {
    const authResult = await requireAuth(req, ['ADMIN', 'leader', 'animator'])
    if (authResult instanceof NextResponse) return authResult
    
    const { auth } = authResult
    const db = await connectToDatabase()
    
    try {
        const worksheetId = params.worksheetId
        const body = await req.json()
        const { title, is_template } = body

        // Find the original worksheet
        const originalWorksheet = await db.collection('worksheets').findOne({
            _id: new ObjectId(worksheetId)
        })

        if (!originalWorksheet) {
            return new NextResponse('Worksheet not found', { status: 404 })
        }

        // Check permissions - can duplicate if admin, or if it's a template, or if it's from their school
        const canDuplicate = auth.isAdmin || 
                           originalWorksheet.is_template || 
                           originalWorksheet.school_id.toString() === auth.schoolId

        if (!canDuplicate) {
            return new NextResponse('Permission denied', { status: 403 })
        }

        // Create duplicated worksheet
        const duplicatedWorksheet: Omit<Worksheet, '_id'> = {
            school_id: new ObjectId(auth.schoolId), // Always belongs to current user's school
            title: title || `${originalWorksheet.title} (Copy)`,
            description: originalWorksheet.description,
            questions: originalWorksheet.questions.map((q: any) => ({
                ...q,
                id: new ObjectId().toString() // Generate new IDs for questions
            })),
            created_by: new ObjectId(auth.userSchoolId),
            is_template: is_template || false,
            created: new Date(),
            updated: new Date()
        }

        const result = await db.collection<Worksheet>('worksheets').insertOne(duplicatedWorksheet as Worksheet)

        return NextResponse.json({ 
            success: true, 
            worksheetId: result.insertedId.toString() 
        })
    } catch (error) {
        console.error('Error duplicating worksheet:', error)
        return new NextResponse('Internal server error', { status: 500 })
    }
}