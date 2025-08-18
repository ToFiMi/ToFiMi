import { randomUUID } from 'crypto'
import { NextRequest, NextResponse } from "next/server"
import { connectToDatabase } from "@/lib/mongo"
import { ObjectId } from "mongodb"
import { getAuthContext } from "@/lib/auth-context"

export async function POST(req: NextRequest) {
    const db = await connectToDatabase()
    const auth = await getAuthContext(req)

    if (!auth || !auth.schoolId) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    const token = randomUUID()
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 2) // 2 hours

    await db.collection('registration-tokens').insertOne({
        token,
        school_id: new ObjectId(auth.schoolId),
        email: "", // Empty for QR code registration
        first_name: "",
        last_name: "",
        role: 'user',
        type: 'qr', // QR tokens can be used multiple times
        expiresAt,
        created: new Date(),
    })

    return NextResponse.json({ token })
}