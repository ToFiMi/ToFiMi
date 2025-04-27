// /api/schools/[school_id]/route.ts
import { NextRequest } from 'next/server'
import { connectToDatabase } from '@/lib/mongo'
import { ObjectId } from 'mongodb'

export async function GET(req: NextRequest, { params }: { params: { school_id: string } }) {
    const db = await connectToDatabase()
    const schoolId = params.school_id

    const school = await db.collection('schools').findOne({ _id: new ObjectId(schoolId) })
    if (!school) {
        return new Response('School not found', { status: 404 })
    }

    const users = await db.collection('user_school').aggregate([
        { $match: { school_id: new ObjectId(schoolId) } },
        {
            $lookup: {
                from: 'users',
                localField: 'user_id',
                foreignField: '_id',
                as: 'user_info'
            }
        },
        { $unwind: '$user_info' },
        {
            $project: {
                _id: 1,
                role: 1,
                'user_info.first_name': 1,
                'user_info.last_name': 1,
                'user_info.email': 1,
            }
        }
    ]).toArray()

    return Response.json({ school, users })
}

export async function POST(req: NextRequest, { params }: { params: { school_id: string } }) {
    const db = await connectToDatabase()
    const schoolId = params.school_id
    const { email, role, first_name = '', last_name = '' } = await req.json()

    if (!email || !role) {
        return new Response('Missing email or role', { status: 400 })
    }

    // 1. Nájdeme usera podľa emailu
    let user = await db.collection('users').findOne({ email })

    // 2. Ak user neexistuje, vytvoríme ho
    if (!user) {
        const now = new Date()
        const result = await db.collection('users').insertOne({
            email,
            first_name,
            last_name,
            passwordHash: '',
            isAdmin: false,
            createdAt: now,
            modifiedAt: now,
        })

        user = {
            _id: result.insertedId,
            email,
        }
    }

    const existing = await db.collection('user_school').findOne({
        school_id: new ObjectId(schoolId),
        user_id: user._id,
    })

    if (existing) {
        return new Response('User already assigned to school', { status: 400 })
    }

    // 4. Priradíme usera ku škole
    await db.collection('user_school').insertOne({
        school_id: new ObjectId(schoolId),
        user_id: user._id,
        role,
    })

    return Response.json({ success: true })
}
