import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongo'
import { getToken } from 'next-auth/jwt'
import { ObjectId } from 'mongodb'
import {Registration} from "@/models/registrations";


export async function GET(req: NextRequest) {
    try {
        const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
        if (!token || !token.id || !token.school_id || !token.user_id) {
            return new NextResponse('Neautorizovaný prístup', { status: 401 })
        }

        const db = await connectToDatabase()

        const eventIdParam = req.nextUrl.searchParams.get('event_id')

        const filter: any = {
            user_id: new ObjectId(token.user_id)
        }

        if (eventIdParam && ObjectId.isValid(eventIdParam)) {
            filter.event_id = new ObjectId(eventIdParam)
        }

        const registrations = await db.collection<Registration>('registrations').find(filter).toArray()

        const normalized = registrations.map((r) => ({
            ...r,
            _id: r._id.toString(),
            user_id: r.user_id.toString(),
            event_id: r.event_id.toString(),
            school_id: r.school_id?.toString(),
            created: r.created?.toISOString(),
            updated: r.updated?.toISOString(),
            meals: r.meals?.map((m: any) => ({
                date: m.date?.toISOString(),
                time: m.time
            })) || []
        }))

        return NextResponse.json(normalized)
    } catch (error) {
        console.error('Chyba pri načítaní registrácie:', error)
        return new NextResponse('Interná chyba servera', { status: 500 })
    }
}


export async function POST(req: NextRequest) {
    try {
        const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
        if (!token || !token.id || !token.school_id || !token.user_id) {
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
            user_id: new ObjectId(token.user_id),
            event_id: new ObjectId(event_id),
        }

        const update = {
            $set: {
                going,
                updated: now,
                meals: going ? parsedMeals : [],
            },
            $setOnInsert: {
                user_id: new ObjectId(token.user_id),
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
