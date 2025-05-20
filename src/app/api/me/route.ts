import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongo'
import { getToken } from 'next-auth/jwt'
import bcrypt from 'bcrypt'
import {ObjectId} from "mongodb";

export async function PUT(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token?.id) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    const { current_password, new_password } = await req.json()

    if (!current_password || !new_password) {
        return new NextResponse('Chýbajú dáta', { status: 400 })
    }

    const db = await connectToDatabase()
    const user = await db.collection('users').findOne({ _id: new ObjectId(token.id) })

    if (!user || !user.passwordHash) {
        return new NextResponse('Použivateľ sa nenašiel', { status: 404 })
    }

    const valid = await bcrypt.compare(current_password, user.passwordHash)
    if (!valid) {
        return new NextResponse('Neplatné aktuálne heslo', { status: 403 })
    }

    const newHash = await bcrypt.hash(new_password, 10)

    await db.collection('users').updateOne(
        { _id: new ObjectId(token.id) },
        { $set: { passwordHash: newHash } }
    )

    return NextResponse.json({ success: true })
}
