import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongo'
import { getToken } from 'next-auth/jwt'
import { ObjectId } from 'mongodb'

export async function GET(req: NextRequest) {
    const db = await connectToDatabase()
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

    if (!token) {
        return new NextResponse('Unauthorized', { status: 401 })
    }
    if(token.isAdmin){

    const query = req.nextUrl.searchParams.get('query') || ''

    const regex = { $regex: query, $options: 'i' } // case-insensitive

    const users = await db.collection('users')
        .find({
            $or: [
                { email: regex },
                { first_name: regex },
                { last_name: regex }
            ]
        })
        .limit(10)
        .toArray()

        return NextResponse.json(users)
    } else if (token.school_id) {
        // 🔹 UŽÍVATEĽ viazaný na školu
        const userSchools = await db
            .collection('user_school')
            .find({ school_id: new ObjectId(token.school_id) })
            .toArray()

        const userIds = userSchools.map(us => us.user_id)

        const users = await db
            .collection('users')
            .find({ _id: { $in: userIds } })
            .toArray()

        return NextResponse.json(users)
    }

    return new NextResponse('Unauthorized', { status: 401 })
}

export async function PUT(req: NextRequest) {
    const token = await getToken({
        req,
        secret: process.env.NEXTAUTH_SECRET,
    })

    if (!token || !token.id) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    const userId = token.id
    const body = await req.json()
    const { first_name, last_name, email } = body

    // Možno si doplniť ďalšiu validáciu podľa potreby
    if (!first_name || !last_name || !email) {
        return new NextResponse('Chýbajú povinné údaje', { status: 400 })
    }

    const db = await connectToDatabase()

    const result = await db.collection('users').updateOne(
        { _id: new ObjectId(userId) },
        {
            $set: {
                first_name,
                last_name,
                email,
                updated: new Date(),
            },
        }
    )

    if (result.modifiedCount === 0) {
        return new NextResponse('Nepodarilo sa aktualizovať údaje', { status: 500 })
    }

    return NextResponse.json({ success: true, updated: true })
}

