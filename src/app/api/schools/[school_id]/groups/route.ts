import {NextRequest} from 'next/server'
import {connectToDatabase} from '@/lib/mongo'
import {ObjectId} from 'mongodb'
import {getToken} from "next-auth/jwt";

export async function GET(req: NextRequest, {params}: { params: { school_id: string } }) {
  const db = await connectToDatabase()
  const schoolId = params.school_id
  const token = await getToken({
    req: {cookies: await req.cookies} as any,
    secret: process.env.NEXTAUTH_SECRET
  })

  if (!token) {
    return new Response('Unauthorized', {status: 401})
  }

  if (!ObjectId.isValid(schoolId)) {
    return new Response('Invalid school_id', {status: 400})
  }
  let groups = []
  if (token.role === "user") {
    const user = await db.collection('user_school').find({user_id: new ObjectId(token.id)}).toArray()
    groups = await db.collection('groups')
      .find({_id: {$in: user.map(u => u.group_id)}})
      .sort({created: -1})
      .toArray()
  } else {
    groups = await db.collection('groups')
      .find({school_id: new ObjectId(schoolId)})
      .sort({created: -1})
      .toArray()
  }


  const normalized = groups.map(group => ({
    ...group,
    _id: group._id.toString(),
    school_id: group.school_id.toString(),
    created: group.created?.toISOString?.() ?? null
  }))

  return Response.json(normalized)
}


export async function PUT(req: NextRequest, {params}: { params: { school_id: string } }) {
  const db = await connectToDatabase()
  const schoolId = params.school_id
  const token = await getToken({
    req: {cookies: await req.cookies} as any,
    secret: process.env.NEXTAUTH_SECRET
  })

  const allowedRoles = token?.role === 'ADMIN' || token?.role === 'leader' || token?.role === 'animator'
  if (!token || !allowedRoles) {
    return new Response('Unauthorized', {status: 401})
  }

  const {groupId, name, animators = [], participants = []} = await req.json()

  if (!groupId || !ObjectId.isValid(groupId)) {
    return new Response('Invalid or missing groupId', {status: 400})
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
    {_id: groupObjectId, school_id: schoolObjectId},
    {$set: updateFields}
  )

  if (result.matchedCount === 0) {
    return new Response('Group not found or not in this school', {status: 404})
  }

  // 2. Update group_id v user_school pre všetkých animátorov aj účastníkov
  const allUserIds = [...animatorIds, ...participantIds]
  if (allUserIds.length > 0) {
    await db.collection('user_school').updateMany(
      {
        school_id: schoolObjectId,
        user_id: {$in: allUserIds},
      },
      {$set: {group_id: groupObjectId}}
    )
  }

  return Response.json({success: true, modifiedCount: result.modifiedCount})
}

export async function POST(req: NextRequest, {params}: { params: { school_id: string } }) {
  const db = await connectToDatabase()
  const schoolId = params.school_id
  const token = await getToken({
    req: {cookies: await req.cookies} as any,
    secret: process.env.NEXTAUTH_SECRET
  })

  const allowedRoles = token?.role === 'ADMIN' || token?.role === 'leader' || token?.role === 'animator'
  if (!token || !allowedRoles) {
    return new Response('Unauthorized', {status: 401})
  }

  if (!ObjectId.isValid(schoolId)) {
    return new Response('Invalid school_id', {status: 400})
  }

  const schoolObjectId = new ObjectId(schoolId)

  const groups = await req.json()
  if (!Array.isArray(groups)) {
    return new Response('Request body must be an array of groups', {status: 400})
  }

  const insertedGroupIds: string[] = []

  for (const group of groups) {
    const {name, animators = [], participants = []} = group

    if (!name || typeof name !== 'string') continue

    const animatorIds = animators
      .filter((id: string) => ObjectId.isValid(id))
      .map(id => new ObjectId(id))

    const participantIds = participants
      .filter((id: string) => ObjectId.isValid(id))
      .map(id => new ObjectId(id))

    const groupDoc = {
      name: name.trim(),
      animators: animatorIds,
      school_id: schoolObjectId,
      created: new Date(),
    }

    const insertResult = await db.collection('groups').insertOne(groupDoc)
    const newGroupId = insertResult.insertedId

    insertedGroupIds.push(newGroupId.toString())

    const allUserIds = [...animatorIds, ...participantIds]

    if (allUserIds.length > 0) {
      await db.collection('user_school').updateMany(
        {
          school_id: schoolObjectId,
          user_id: {$in: allUserIds},
        },
        {$set: {group_id: newGroupId}}
      )
    }
  }

  return Response.json({
    success: true,
    insertedCount: insertedGroupIds.length,
    insertedGroupIds,
  })
}

export async function DELETE(req: NextRequest, {params}: { params: { school_id: string } }) {
  const db = await connectToDatabase()
  const schoolId = params.school_id
  const token = await getToken({
    req: {cookies: await req.cookies} as any,
    secret: process.env.NEXTAUTH_SECRET
  })

  const allowedRoles = token?.role === 'ADMIN' || token?.role === 'leader' || token?.role === 'animator'
  if (!token || !allowedRoles) {
    return new Response('Unauthorized', {status: 401})
  }

  if (!ObjectId.isValid(schoolId)) {
    return new Response('Invalid school_id', {status: 400})
  }

  const {groupId, user_id} = await req.json()
  const schoolObjectId = new ObjectId(schoolId)

  if (user_id) {
    if (!ObjectId.isValid(user_id) || !ObjectId.isValid(groupId)) {
      return new Response('Invalid user_id or groupId', {status: 400})
    }

    const userObjectId = new ObjectId(user_id)
    const groupObjectId = new ObjectId(groupId)

    const result = await db.collection('user_school').updateOne(
      {
        school_id: schoolObjectId,
        group_id: groupObjectId,
        user_id: userObjectId
      },
      {$unset: {group_id: ""}}
    )

    if (result.matchedCount === 0) {
      return new Response('User not found in group', {status: 404})
    }

    return Response.json({
      success: true,
      removedUserId: user_id,
    })
  }

  // ⚠️ Ak nie je user_id → pokračuje v štandardnom mazaní celej skupiny
  if (!groupId || !ObjectId.isValid(groupId)) {
    return new Response('Invalid or missing groupId', {status: 400})
  }

  const groupObjectId = new ObjectId(groupId)

  const deleteResult = await db.collection('groups').deleteOne({
    _id: groupObjectId,
    school_id: schoolObjectId,
  })

  if (deleteResult.deletedCount === 0) {
    return new Response('Group not found', {status: 404})
  }

  await db.collection('user_school').updateMany(
    {
      school_id: schoolObjectId,
      group_id: groupObjectId
    },
    {$unset: {group_id: ""}}
  )

  return Response.json({
    success: true,
    deletedGroupId: groupId
  })
}
