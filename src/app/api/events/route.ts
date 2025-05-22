import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongo"
import { getToken } from "next-auth/jwt"
import { Event } from "@/models/events"
import {ObjectId} from "mongodb";

export async function GET(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    const db = await connectToDatabase()

    try {
        let events: Event[] = []

        if (token.isAdmin) {
            events = await db.collection<Event>("events")
                .find({})
                .sort({ startDate: -1 })
                .toArray()
        } else if (token.school_id) {
            events = await db.collection<Event>("events")
                .find({ school_id: new ObjectId(token.school_id) })
                .sort({ startDate: -1 })
                .toArray()
        } else {
            return new NextResponse('School not found for user', { status: 400 })
        }

        return NextResponse.json(events)
    } catch (error) {
        console.error('❌ Error fetching events:', error)
        return new NextResponse('Internal Server Error', { status: 500 })
    }
}
