import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongo"
import { getToken } from "next-auth/jwt"
import { Event } from "@/models/events"
import { ObjectId } from "mongodb"

export async function GET(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    if (!token.isAdmin && !token.school_id) {
        return new NextResponse('School not found for user', { status: 400 });
    }

    try {
        const events = await findEvents({ isAdmin: token.isAdmin, school_id: token.school_id });
        return NextResponse.json(events);
    } catch (error) {
        console.error("❌ Error fetching events:", error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

export async function findEvents({
                                     isAdmin,
                                     school_id,
                                 }: {
    isAdmin: boolean;
    school_id?: string;
}): Promise<Event[]> {
    const db = await connectToDatabase();
    const query = isAdmin ? {} : { school_id: new ObjectId(school_id!) };

    return await db
        .collection<Event>("events")
        .find(query)
        .sort({ startDate: -1 })
        .toArray();
}
