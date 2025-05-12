// src/app/api/schools/[school_id]/members/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongo'
import { ObjectId } from 'mongodb'
import {getToken} from "next-auth/jwt";
import {sendEmail} from "@/lib/email";

export async function GET(
    req: NextRequest,
    context: { params: { school_id: string } }
) {
    const db = await connectToDatabase()
    const schoolId = context.params.school_id

    const users = await db.collection('user_school').aggregate([
        { $match: { school_id: new ObjectId(schoolId) } },
        {
            $lookup: {
                from: 'users',
                localField: 'user_id',
                foreignField: '_id',
                as: 'user_info',
            },
        },
        { $unwind: '$user_info' },
        {
            $project: {
                _id: 0,
                role: 1,
                user: {
                    first_name: '$user_info.first_name',
                    last_name: '$user_info.last_name',
                    email: '$user_info.email',
                },
            },
        },
    ]).toArray()

    return NextResponse.json(users)
}


export async function POST(
    req: NextRequest,
    { params }: { params: { school_id: string }},
) {
    const param = await params
    const schoolId =param.school_id
    const db = await connectToDatabase()

    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (token.role !== 'ADMIN' && token.role !== 'leader') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { email, role, first_name = '', last_name = '' } = await req.json()

    if (!email || !role) {
        return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    // 1. Find or create user
    let user = await db.collection('users').findOne({ email })

    if (!user) {
        const result = await db.collection('users').insertOne({
            email,
            first_name,
            last_name,
            isAdmin: false,
            createdAt: new Date(),
            modifiedAt: new Date(),
        })

        user = { _id: result.insertedId, email }
        // TODO: Send invite email

        const school = await db.collection('schools').findOne({ _id: new ObjectId(schoolId) })


        await sendEmail({
            to: email,
            schoolName: school?.name,
            htmlContent:`<p>Ahoj ${first_name},</p>
      <p>bol(a) si pridaný(á) do systému ako člen školy <strong>${school?.name}</strong>.</p>
      <p>Ak ešte nemáš účet, vytvor si ho pomocou tohto e-mailu a nastav si heslo.</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/login">Prihlásiť sa</a></p>
      <p>Ak o tom nič nevieš, tento e-mail môžeš ignorovať.</p>
      <br>
      <p>💌 Tvoj tím</p>
    `,
        })
    }

    // 2. Check if user is already assigned
    const existing = await db.collection('user_school').findOne({
        user_id: user._id,
        school_id: new ObjectId(schoolId),
    })

    if (existing) {
        return NextResponse.json({ error: 'User already assigned to school' }, { status: 400 })
    }

    // 3. Assign user to school
    await db.collection('user_school').insertOne({
        user_id: user._id,
        school_id: new ObjectId(schoolId),
        role,
        createdAt: new Date(),
    })

    return NextResponse.json({ success: true })
}
