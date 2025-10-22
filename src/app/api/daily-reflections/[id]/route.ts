import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongo'
import { getToken } from 'next-auth/jwt'
import { ObjectId } from 'mongodb'
import { DailyReflection } from '@/models/daliy-reflections'
import dayjs from 'dayjs'

export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return new NextResponse('Unauthorized', { status: 401 })

    const role = token.role
    if (role !== 'leader' && role !== 'animator') {
        return new NextResponse('Forbidden - insufficient permissions', { status: 403 })
    }

    const school_id = token.school_id
    if (!school_id) {
        return new NextResponse('School ID required', { status: 400 })
    }

    const { id } = params
    if (!ObjectId.isValid(id)) {
        return new NextResponse('Invalid reflection ID', { status: 400 })
    }

    const db = await connectToDatabase()
    
    try {
        const body = await req.json()
        const { verse_reference, content, date } = body

        if (!verse_reference || !content) {
            return new NextResponse('Missing required fields', { status: 400 })
        }

        // Validate verse_reference structure
        if (!Array.isArray(verse_reference) || verse_reference.length === 0) {
            return new NextResponse('verse_reference must be a non-empty array', { status: 400 })
        }

        for (const verse of verse_reference) {
            if (!verse.reference || !verse.verse) {
                return new NextResponse('Each verse must have reference and verse text', { status: 400 })
            }
        }

        // Check if reflection exists and belongs to user's school
        const existingReflection = await db.collection<DailyReflection>('daily_reflections')
            .findOne({ 
                _id: new ObjectId(id), 
                school_id: new ObjectId(school_id) 
            })

        if (!existingReflection) {
            return new NextResponse('Reflection not found', { status: 404 })
        }

        // Update the reflection
        const updateData: any = {
            verse_reference: verse_reference.map((v: any) => ({
                reference: v.reference.trim(),
                verse: v.verse.trim()
            })),
            content: content.trim(),
            updated_by: new ObjectId(token.id),
            updated: new Date()
        }

        // Add date if provided - parse as local date at midnight to avoid timezone issues
        if (date) {
            updateData.date = dayjs(date).startOf('day').toDate()
        }

        const result = await db.collection<DailyReflection>('daily_reflections')
            .updateOne(
                { _id: new ObjectId(id) },
                { $set: updateData }
            )

        if (result.matchedCount === 0) {
            return new NextResponse('Reflection not found', { status: 404 })
        }

        // Return updated reflection
        const updatedReflection = await db.collection<DailyReflection>('daily_reflections')
            .findOne({ _id: new ObjectId(id) })

        return NextResponse.json(updatedReflection)
    } catch (error) {
        console.error('Error updating daily reflection:', error)
        return new NextResponse('Internal server error', { status: 500 })
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return new NextResponse('Unauthorized', { status: 401 })

    const role = token.role
    if (role !== 'leader' && role !== 'animator') {
        return new NextResponse('Forbidden - insufficient permissions', { status: 403 })
    }

    const school_id = token.school_id
    if (!school_id) {
        return new NextResponse('School ID required', { status: 400 })
    }

    const { id } = params
    if (!ObjectId.isValid(id)) {
        return new NextResponse('Invalid reflection ID', { status: 400 })
    }

    const db = await connectToDatabase()
    
    try {
        // Check if reflection exists and belongs to user's school
        const existingReflection = await db.collection<DailyReflection>('daily_reflections')
            .findOne({ 
                _id: new ObjectId(id), 
                school_id: new ObjectId(school_id) 
            })

        if (!existingReflection) {
            return new NextResponse('Reflection not found', { status: 404 })
        }

        const result = await db.collection<DailyReflection>('daily_reflections')
            .deleteOne({ _id: new ObjectId(id) })

        if (result.deletedCount === 0) {
            return new NextResponse('Reflection not found', { status: 404 })
        }

        return NextResponse.json({ success: true, message: 'Reflection deleted successfully' })
    } catch (error) {
        console.error('Error deleting daily reflection:', error)
        return new NextResponse('Internal server error', { status: 500 })
    }
}