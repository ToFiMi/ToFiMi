import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongo'
import { getToken } from 'next-auth/jwt'
import { ObjectId } from 'mongodb'
import { Homework } from '@/models/homework'

export async function GET(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return new NextResponse('Unauthorized', { status: 401 })

    const db = await connectToDatabase()
    const eventId = req.nextUrl.searchParams.get('event_id')

    if (!eventId) {
        return new NextResponse('Missing event_id parameter', { status: 400 })
    }

    try {
        // Return all homeworks for this event and user
        const homeworks = await db.collection<Homework>('homeworks').find({
            event_id: new ObjectId(eventId),
            user_id: new ObjectId(token.id)
        }).toArray()

        return NextResponse.json(homeworks)
    } catch (error) {
        console.error('Error fetching homework:', error)
        return new NextResponse('Internal server error', { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return new NextResponse('Unauthorized', { status: 401 })

    const db = await connectToDatabase()
    
    try {
        const body = await req.json()
        const { content, event_id, homework_type_id } = body

        if (!content || !event_id) {
            return new NextResponse('Missing required fields', { status: 400 })
        }

        const homework: Omit<Homework, '_id'> = {
            event_id: new ObjectId(event_id),
            user_id: new ObjectId(token.id),
            homework_type_id: homework_type_id || 'default',
            content,
            type: 'essay',
            status: 'pending',
            comments: [],
            created: new Date(),
            updated: new Date()
        }

        const result = await db.collection<Homework>('homeworks').insertOne(homework as Homework)
        
        return NextResponse.json({ 
            success: true, 
            id: result.insertedId.toString() 
        })
    } catch (error) {
        console.error('Error creating homework:', error)
        return new NextResponse('Internal server error', { status: 500 })
    }
}

export async function PUT(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return new NextResponse('Unauthorized', { status: 401 })

    const db = await connectToDatabase()

    try {
        const body = await req.json()
        const { content, event_id, homework_type_id } = body

        if (!content || !event_id || !homework_type_id) {
            return new NextResponse('Missing required fields', { status: 400 })
        }

        const updateData: any = {
            content,
            updated: new Date()
        }

        const result = await db.collection<Homework>('homeworks').updateOne(
            {
                event_id: new ObjectId(event_id),
                user_id: new ObjectId(token.id),
                homework_type_id: homework_type_id
            },
            {
                $set: updateData
            }
        )

        if (result.matchedCount === 0) {
            return new NextResponse('Homework not found', { status: 404 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error updating homework:', error)
        return new NextResponse('Internal server error', { status: 500 })
    }
}