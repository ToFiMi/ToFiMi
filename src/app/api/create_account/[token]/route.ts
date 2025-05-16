// src/app/api/create_account/[token]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongo'
import { ObjectId } from 'mongodb'

export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
    const db = await connectToDatabase()
    const token = params.token

    const record = await db.collection('registration-tokens').findOne({ token })
    if (!record || new Date(record.expiresAt) < new Date()) {
        return new NextResponse('Invalid or expired token', { status: 404 })
    }

    return NextResponse.json({
        email: record.email ?? '',
        first_name: record.first_name ?? '',
        last_name: record.last_name ?? '',
        role: record.role ?? 'user'
    })
}
