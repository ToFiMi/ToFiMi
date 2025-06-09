import { NextRequest } from 'next/server'
import { connectToDatabase } from '@/lib/mongo'
import { ObjectId } from 'mongodb'
import {getToken} from "next-auth/jwt";

export async function GET(req: NextRequest, { params }: { params: { school_id: string } }) {
    const db = await connectToDatabase()
    const schoolId = params.school_id
    const token = await getToken({
        req: { cookies: await req.cookies } as any,
        secret: process.env.NEXTAUTH_SECRET
    })

    if (!token) {
        return new Response('Unauthorized', { status: 401 })
    }

    if (!ObjectId.isValid(schoolId)) {
        return new Response('Invalid school_id', { status: 400 })
    }

    const groups = await db.collection('groups')
        .find({ school_id: new ObjectId(schoolId) })
        .sort({ created: -1 })
        .toArray()

    const normalized = groups.map(group => ({
        ...group,
        _id: group._id.toString(),
        school_id: group.school_id.toString(),
        created: group.created?.toISOString?.() ?? null
    }))

    return Response.json(normalized)
}


export async function PUT(req: NextRequest, { params }: { params: { school_id: string } }) {
    const db = await connectToDatabase()
    const schoolId = params.school_id
    const token = await getToken({
        req: { cookies: await req.cookies } as any,
        secret: process.env.NEXTAUTH_SECRET
    })

    const allowedRoles = token?.role === 'ADMIN' || token?.role === 'leader' || token?.role === 'animator'
    if (!token || !allowedRoles) {
        return new Response('Unauthorized', { status: 401 })
    }

    const { groupId, name, animators = [], participants = [] } = await req.json()

    if (!groupId || !ObjectId.isValid(groupId)) {
        return new Response('Invalid or missing groupId', { status: 400 })
    }

    const groupObjectId = new ObjectId(groupId)
    const schoolObjectId = new ObjectId(schoolId)

    const updateFields: any = {
        updated: new Date(),
    }

    if (typeof name === 'string' && name.trim()) {
        updateFields.name = name.trim()
    }

    const animatorIds = animators.filter((id: string) => ObjectId.isValid(id)).map(id => new ObjectId(id))
    const participantIds = participants.filter((id: string) => ObjectId.isValid(id)).map(id => new ObjectId(id))

    if (animatorIds.length > 0) {
        updateFields.animators = animatorIds
    }


    // 1. Update skupiny
    const result = await db.collection('groups').updateOne(
        { _id: groupObjectId, school_id: schoolObjectId },
        { $set: updateFields }
    )

    if (result.matchedCount === 0) {
        return new Response('Group not found or not in this school', { status: 404 })
    }

    // 2. Update group_id v user_school pre všetkých animátorov aj účastníkov
    const allUserIds = [...animatorIds, ...participantIds]
    if (allUserIds.length > 0) {
        await db.collection('user_school').updateMany(
            {
                school_id: schoolObjectId,
                user_id: { $in: allUserIds },
            },
            { $set: { group_id: groupObjectId } }
        )
    }

    return Response.json({ success: true, modifiedCount: result.modifiedCount })
}
