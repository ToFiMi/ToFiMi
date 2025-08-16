import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongo'
import { ObjectId } from 'mongodb'
import { requireAuth } from '@/lib/auth-helpers'
import { Worksheet } from '@/models/worksheet'

// Get worksheets library - admins see all, leaders/animators see their school + templates
export async function GET(req: NextRequest) {
    const authResult = await requireAuth(req, ['ADMIN', 'leader', 'animator'])
    if (authResult instanceof NextResponse) return authResult
    
    const { auth } = authResult
    const db = await connectToDatabase()
    
    try {
        const url = new URL(req.url)
        const search = url.searchParams.get('search') || ''
        
        let matchQuery: any = {}
        
        if (auth.isAdmin) {
            // Admins see all worksheets
            matchQuery = {}
        } else {
            // Leaders/animators see all worksheets (can view from other schools for inspiration/duplication)
            matchQuery = {}
        }

        // Add search filter if provided
        if (search) {
            matchQuery.$and = matchQuery.$and || []
            matchQuery.$and.push({
                $or: [
                    { title: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } }
                ]
            })
        }

        const worksheets = await db.collection('worksheets').aggregate([
            { $match: matchQuery },
            {
                $lookup: {
                    from: 'schools',
                    localField: 'school_id',
                    foreignField: '_id',
                    as: 'school'
                }
            },
            {
                $lookup: {
                    from: 'user_school',
                    localField: 'created_by',
                    foreignField: '_id',
                    as: 'creator'
                }
            },
            {
                $project: {
                    _id: 1,
                    school_id: 1,
                    event_id: 1,
                    title: 1,
                    description: 1,
                    questions: 1,
                    created_by: 1,
                    is_template: 1,
                    created: 1,
                    updated: 1,
                    school_name: { $arrayElemAt: ['$school.name', 0] },
                    creator_name: { 
                        $concat: [
                            { $arrayElemAt: ['$creator.first_name', 0] },
                            ' ',
                            { $arrayElemAt: ['$creator.last_name', 0] }
                        ]
                    },
                    question_count: { $size: '$questions' },
                    // Add permission flags
                    can_edit: {
                        $cond: {
                            if: auth.isAdmin,
                            then: true,
                            else: { $eq: ['$school_id', new ObjectId(auth.schoolId)] }
                        }
                    },
                    can_delete: {
                        $cond: {
                            if: auth.isAdmin,
                            then: true,
                            else: { $eq: ['$school_id', new ObjectId(auth.schoolId)] }
                        }
                    }
                }
            },
            { $sort: { created: -1 } }
        ]).toArray()

        return NextResponse.json(worksheets)
    } catch (error) {
        console.error('Error fetching worksheets library:', error)
        return new NextResponse('Internal server error', { status: 500 })
    }
}

// Create new worksheet template
export async function POST(req: NextRequest) {
    const authResult = await requireAuth(req, ['ADMIN', 'leader', 'animator'])
    if (authResult instanceof NextResponse) return authResult
    
    const { auth } = authResult
    const db = await connectToDatabase()
    
    try {
        const body = await req.json()
        const { title, description, questions, is_template } = body

        if (!title || !questions || !Array.isArray(questions)) {
            return new NextResponse('Missing required fields', { status: 400 })
        }

        const worksheet: Omit<Worksheet, '_id'> = {
            school_id: new ObjectId(auth.schoolId),
            title,
            description,
            questions: questions.map((q: any) => ({
                ...q,
                id: q.id || new ObjectId().toString()
            })),
            created_by: new ObjectId(auth.userSchoolId),
            is_template: is_template || false,
            created: new Date(),
            updated: new Date()
        }

        const result = await db.collection<Worksheet>('worksheets').insertOne(worksheet as Worksheet)

        return NextResponse.json({ 
            success: true, 
            worksheetId: result.insertedId.toString() 
        })
    } catch (error) {
        console.error('Error creating worksheet template:', error)
        return new NextResponse('Internal server error', { status: 500 })
    }
}