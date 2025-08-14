import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongo'
import { getToken } from 'next-auth/jwt'
import { ObjectId } from 'mongodb'

export async function PUT(
    req: NextRequest,
    { params }: { params: { homeworkId: string } }
) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return new NextResponse('Unauthorized', { status: 401 })

    // Only leaders and animators can update homework status
    if (token.role !== 'leader' && token.role !== 'animator') {
        return new NextResponse('Forbidden - insufficient permissions', { status: 403 })
    }

    const homeworkId = params.homeworkId
    if (!homeworkId || !ObjectId.isValid(homeworkId)) {
        return new NextResponse('Invalid homework ID', { status: 400 })
    }

    const db = await connectToDatabase()
    
    try {
        const body = await req.json()
        const { status } = body

        if (!status || !['approved', 'rejected', 'pending'].includes(status)) {
            return new NextResponse('Invalid status. Must be: approved, rejected, or pending', { status: 400 })
        }

        // Verify the homework belongs to the same school
        const homework = await db.collection('homeworks').findOne({
            _id: new ObjectId(homeworkId)
        })

        if (!homework) {
            return new NextResponse('Homework not found', { status: 404 })
        }

        // Check if user belongs to the same school as the homework submitter
        const userSchool = await db.collection('user_school').findOne({
            user_id: homework.user_id,
            school_id: new ObjectId(token.school_id)
        })

        if (!userSchool) {
            return new NextResponse('Homework not found in your school', { status: 404 })
        }

        const result = await db.collection('homeworks').updateOne(
            { _id: new ObjectId(homeworkId) },
            { 
                $set: { 
                    status,
                    updated: new Date()
                }
            }
        )

        if (result.matchedCount === 0) {
            return new NextResponse('Homework not found', { status: 404 })
        }

        return NextResponse.json({ success: true, status })
    } catch (error) {
        console.error('Error updating homework status:', error)
        return new NextResponse('Internal server error', { status: 500 })
    }
}