import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongo'
import { getToken } from 'next-auth/jwt'
import { ObjectId } from 'mongodb'
import { DailyReflection } from '@/models/daliy-reflections'

export async function GET(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return new NextResponse('Unauthorized', { status: 401 })

    const school_id = token.school_id
    if (!school_id) {
        return new NextResponse('School ID required', { status: 400 })
    }

    const db = await connectToDatabase()
    const date = req.nextUrl.searchParams.get('date')
    const today = req.nextUrl.searchParams.get('today') === 'true'

    try {
        let query: any = { school_id: new ObjectId(school_id) }
        
        if (today) {
            // Get today's reflection
            const todayDate = new Date()
            todayDate.setHours(0, 0, 0, 0)
            const tomorrowDate = new Date(todayDate)
            tomorrowDate.setDate(todayDate.getDate() + 1)
            
            query.date = {
                $gte: todayDate,
                $lt: tomorrowDate
            }
        } else if (date) {
            // Get reflection for specific date
            const targetDate = new Date(date)
            targetDate.setHours(0, 0, 0, 0)
            const nextDate = new Date(targetDate)
            nextDate.setDate(targetDate.getDate() + 1)
            
            query.date = {
                $gte: targetDate,
                $lt: nextDate
            }
        }

        const reflections = await db.collection<DailyReflection>('daily_reflections')
            .find(query)
            .sort({ date: -1 })
            .toArray()

        return NextResponse.json(reflections)
    } catch (error) {
        console.error('Error fetching daily reflections:', error)
        return new NextResponse('Internal server error', { status: 500 })
    }
}

export async function POST(req: NextRequest) {
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

    const db = await connectToDatabase()
    
    try {
        const body = await req.json()
        const { event_id, date, verse_reference, content } = body

        if (!event_id || !date || !verse_reference || !content) {
            return new NextResponse('Missing required fields', { status: 400 })
        }

        const reflection: Omit<DailyReflection, '_id'> = {
            event_id: new ObjectId(event_id),
            school_id: new ObjectId(school_id),
            date: new Date(date),
            verse_reference,
            content,
            created_by: new ObjectId(token.id),
            created: new Date()
        }

        const result = await db.collection<DailyReflection>('daily_reflections')
            .insertOne(reflection as DailyReflection)
        
        return NextResponse.json({ 
            success: true, 
            id: result.insertedId.toString() 
        })
    } catch (error) {
        console.error('Error creating daily reflection:', error)
        return new NextResponse('Internal server error', { status: 500 })
    }
}