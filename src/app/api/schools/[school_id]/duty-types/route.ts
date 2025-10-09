import { NextRequest } from 'next/server'
import { connectToDatabase } from '@/lib/mongo'
import { ObjectId } from 'mongodb'
import { getToken } from 'next-auth/jwt'

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

    const dutyTypes = await db.collection('duty_types')
        .find({ school_id: new ObjectId(schoolId) })
        .sort({ order: 1 })
        .toArray()

    const normalized = dutyTypes.map(dt => ({
        ...dt,
        _id: dt._id.toString(),
        school_id: dt.school_id.toString(),
        created: dt.created?.toISOString?.() ?? null,
        updated: dt.updated?.toISOString?.() ?? null
    }))

    return Response.json(normalized)
}

export async function POST(req: NextRequest, { params }: { params: { school_id: string } }) {
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

    if (!ObjectId.isValid(schoolId)) {
        return new Response('Invalid school_id', { status: 400 })
    }

    const { name } = await req.json()

    if (!name || typeof name !== 'string') {
        return new Response('Name is required', { status: 400 })
    }

    const schoolObjectId = new ObjectId(schoolId)

    // Get max order to append new duty type at the end
    const maxOrderDoc = await db.collection('duty_types')
        .find({ school_id: schoolObjectId })
        .sort({ order: -1 })
        .limit(1)
        .toArray()

    const nextOrder = maxOrderDoc.length > 0 ? (maxOrderDoc[0].order + 1) : 0

    const dutyTypeDoc = {
        school_id: schoolObjectId,
        name: name.trim(),
        order: nextOrder,
        created: new Date(),
        updated: new Date()
    }

    const result = await db.collection('duty_types').insertOne(dutyTypeDoc)

    return Response.json({
        success: true,
        insertedId: result.insertedId.toString()
    })
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

    if (!ObjectId.isValid(schoolId)) {
        return new Response('Invalid school_id', { status: 400 })
    }

    const body = await req.json()
    const { dutyTypeId, name, reorderedIds } = body

    const schoolObjectId = new ObjectId(schoolId)

    // Handle reordering
    if (reorderedIds && Array.isArray(reorderedIds)) {
        const bulkOps = reorderedIds.map((id: string, index: number) => ({
            updateOne: {
                filter: { _id: new ObjectId(id), school_id: schoolObjectId },
                update: { $set: { order: index, updated: new Date() } }
            }
        }))

        await db.collection('duty_types').bulkWrite(bulkOps)

        return Response.json({ success: true })
    }

    // Handle name update
    if (!dutyTypeId || !ObjectId.isValid(dutyTypeId)) {
        return new Response('Invalid dutyTypeId', { status: 400 })
    }

    if (!name || typeof name !== 'string') {
        return new Response('Name is required', { status: 400 })
    }

    const result = await db.collection('duty_types').updateOne(
        { _id: new ObjectId(dutyTypeId), school_id: schoolObjectId },
        { $set: { name: name.trim(), updated: new Date() } }
    )

    if (result.matchedCount === 0) {
        return new Response('Duty type not found', { status: 404 })
    }

    return Response.json({ success: true })
}

export async function DELETE(req: NextRequest, { params }: { params: { school_id: string } }) {
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

    if (!ObjectId.isValid(schoolId)) {
        return new Response('Invalid school_id', { status: 400 })
    }

    const { dutyTypeId } = await req.json()

    if (!dutyTypeId || !ObjectId.isValid(dutyTypeId)) {
        return new Response('Invalid dutyTypeId', { status: 400 })
    }

    const schoolObjectId = new ObjectId(schoolId)
    const dutyTypeObjectId = new ObjectId(dutyTypeId)

    const result = await db.collection('duty_types').deleteOne({
        _id: dutyTypeObjectId,
        school_id: schoolObjectId
    })

    if (result.deletedCount === 0) {
        return new Response('Duty type not found', { status: 404 })
    }

    return Response.json({ success: true })
}