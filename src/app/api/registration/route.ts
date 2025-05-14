import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongo'
import { getToken } from 'next-auth/jwt'
import { ObjectId } from 'mongodb'


export async function POST(req: NextRequest) {
    try {
        const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
        if (!token || !token.id || !token.school_id) {
            return new NextResponse('Neautorizovaný prístup', { status: 401 })
        }

        const { event_id, going, meals } = await req.json()

        if (!event_id || typeof going !== 'boolean') {
            return new NextResponse('Chýbajúce alebo nesprávne údaje', { status: 400 })
        }

        const db = await connectToDatabase()
        const now = new Date()

        const parsedMeals = Array.isArray(meals)
            ? meals.map((entry: { date: string, time: string }) => ({
                date: new Date(entry.date),
                time: entry.time
            }))
            : []

        const filter = {
            user_id: new ObjectId(token.id),
            event_id: new ObjectId(event_id),
        }

        const update = {
            $set: {
                going,
                updated: now,
                meals: going ? parsedMeals : [],
            },
            $setOnInsert: {
                user_id: new ObjectId(token.id),
                event_id: new ObjectId(event_id),
                school_id: new ObjectId(token.school_id),
                created: now,
            },
        }

        await db.collection('registrations').updateOne(filter, update, { upsert: true })

        return new NextResponse('OK', { status: 200 })
    } catch (error) {
        console.error('Chyba pri registrácii:', error)
        return new NextResponse('Interná chyba servera', { status: 500 })
    }
}
