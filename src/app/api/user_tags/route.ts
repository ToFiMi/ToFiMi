// app/api/user_tags/[userId]/route.ts
import { connectToDatabase } from '@/lib/mongo'
import { ObjectId } from 'mongodb'
import { NextRequest, NextResponse } from 'next/server'
import {getToken} from "next-auth/jwt";

export async function GET(req: NextRequest, { params }: { params: { userId: string } }) {
    const db = await connectToDatabase()
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

    const userId = token?.id

    const userTags = await db.collection('user_tags').aggregate([
        { $match: { user_id: new ObjectId(userId) } },
        {
            $lookup: {
                from: 'tags',
                localField: 'tag_id',
                foreignField: '_id',
                as: 'tag_info'
            }
        },
        { $unwind: '$tag_info' },
        {
            $project: {
                _id: 1,
                tag_id: 1,
                name: '$tag_info.name',
            }
        }
    ]).toArray()

    return NextResponse.json(userTags)
}
export async function POST(req: NextRequest) {
    const { tags } = await req.json() // očakávame tags: string[]
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    const userId = token?.id

    if (!userId || !Array.isArray(tags)) {
        return new NextResponse('Missing user_id or tags', { status: 400 })
    }

    const db = await connectToDatabase()


    await db.collection('user_tags').deleteMany({ user_id: new ObjectId(userId) })


    const operations = tags.map(tagId => ({
        user_id: new ObjectId(userId),
        tag_id: new ObjectId(tagId),
        created: new Date()
    }))

    if (operations.length > 0) {
        await db.collection('user_tags').insertMany(operations)
    }

    return new NextResponse('Tags updated', { status: 200 })
}

export async function DELETE(req: NextRequest, { params }: { params: { userTagId: string } }) {
    const db = await connectToDatabase()
    await db.collection('user_tags').deleteOne({ _id: new ObjectId(params.userTagId) })
    return new NextResponse('Tag removed', { status: 204 })
}
