import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongo'
import bcrypt from 'bcrypt'
import { ObjectId } from 'mongodb'
import {User} from "@/lib/class/User";

export async function POST(req: NextRequest) {
    const body = await req.json()
    const { email, password, first_name, last_name, token } = body

    if (!email || !password || !first_name || !last_name || !token) {
        return new NextResponse('Chýbajúce údaje', { status: 400 })
    }

    const db = await connectToDatabase()


    const ott = await db.collection('registration-tokens').findOne({ token })
    if (!ott || new Date(ott.expiresAt) < new Date()) {
        return new NextResponse('Token je neplatný alebo expirovaný', { status: 403 })
    }

    const school_id = ott?.school_id


    const existing = await db.collection('users').findOne({ email })

    if (existing) {
        return new NextResponse('Používateľ už existuje', { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const userResult = await db.collection('users').insertOne({
        email,
        passwordHash,
        first_name,
        last_name,
        isAdmin:  ott.role === "admin",
        created: new Date(),
        updated: new Date(),
    })
    if(ott.role !== "admin") {
        await db.collection('user_school').insertOne({
            user_id: userResult.insertedId,
            school_id: new ObjectId(school_id),
            role: ott.role || 'user',
        })
    }

    // Delete token only if it's a single-use invite token
    if (ott.type === 'invite') {
        await db.collection('registration-tokens').deleteOne({ token })
    }

    return new NextResponse('Účet bol vytvorený', { status: 201 })
}
export async function GET(req: NextRequest) {
    const tokenParam = req.nextUrl.searchParams.get('token')
    if (!tokenParam) return new NextResponse('Missing token', { status: 400 })

    const db = await connectToDatabase()
    const ott = await db.collection('registration-tokens').findOne({ token: tokenParam })

    if (!ott || new Date(ott.expiresAt) < new Date()) {
        return new NextResponse('Token je neplatný alebo expirovaný', { status: 403 })
    }

    return NextResponse.json({
        email: ott.email,
        first_name: ott.first_name,
        last_name: ott.last_name,
        role: ott.role,
        school_id: ott.school_id.toString(),
    })
}
