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
