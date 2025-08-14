import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongo'
import { getToken } from 'next-auth/jwt'
import { ObjectId } from 'mongodb'
import {Users} from "@/lib/class/Users";
import {UserSchool} from "@/models/user-school";

export async function GET(req: NextRequest) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return new NextResponse('Unauthorized', { status: 401 })

    const usersInstance = await Users.init()

    // ?autocomplete=1&query=term
    const isAutocomplete = req.nextUrl.searchParams.get('autocomplete') === '1'
    const query = req.nextUrl.searchParams.get('query') || ''
    const schoolIdParam = req.nextUrl.searchParams.get('school_id')
    const schoolId = schoolIdParam || token.school_id

    if (isAutocomplete && query.length < 3) {

        return NextResponse.json([])
    }

    if (token.isAdmin) {
        if (isAutocomplete && query.length >= 3){
            if (schoolId) {
                const results = await usersInstance.searchUsers(query, schoolId)
                return NextResponse.json(results)
            }

            const results = await usersInstance.searchUsers(query)
            return NextResponse.json(results)
        }

        if (!isAutocomplete) {
            const users = await usersInstance.getUsersWithSchool()
            return NextResponse.json(users)
        }
    }
    if (token.school_id) {

        const users = await usersInstance.getUsersBySchoolId(token.school_id as string)

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

export async function DELETE(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('user_id')

    console.log(userId)

    if (!userId || !ObjectId.isValid(userId)) {
        return NextResponse.json({ error: 'Invalid or missing user_id' }, { status: 400 })
    }

    try {
        const db = await connectToDatabase()
        const result = await db.collection<UserSchool>('user_school').updateOne(
            { _id: new ObjectId(userId) },
            { $set: { role: 'inactive' } }
        )

        if (result.modifiedCount === 0) {
            return NextResponse.json({ error: 'User not found or already inactive' }, { status: 404 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('❌ Deactivation error:', error)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}


