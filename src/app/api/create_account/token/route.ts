import { randomUUID } from 'crypto'
import {NextRequest, NextResponse} from "next/server";
import {connectToDatabase} from "@/lib/mongo";
import {ObjectId} from "mongodb";
import {getToken} from "next-auth/jwt";
import {cookies} from "next/headers";

export async function POST(req: NextRequest) {
    const db = await connectToDatabase()
    const user_token = await getToken({ req: { cookies: await cookies() } as any, secret: process.env.NEXTAUTH_SECRET  })
    const school_id = user_token?.school_id

    if(!school_id) return
    const token = randomUUID()
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24) // 24 hodín

    await db.collection('registration-tokens').insertOne({
        token,
        school_id: new ObjectId(school_id),
        created: new Date(),
        expiresAt,
    })

    return Response.json({ token })
}
export async function GET(req: NextRequest) {
    const token = await getToken({
        req: { cookies: await cookies() } as any,
        secret: process.env.NEXTAUTH_SECRET,
    })

    const school_id = token?.school_id
    if (!school_id) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    const db = await connectToDatabase()

    const now = new Date()

    const activeToken = await db.collection('registration-tokens').findOne(
        {
            school_id: new ObjectId(school_id),
            expiresAt: { $gte: now },
        },
        { sort: { created: -1 } }
    )

    if (!activeToken) {
        return NextResponse.json({ token: null })
    }

    return NextResponse.json({ token: activeToken.token })
}
