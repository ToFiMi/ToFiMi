import {randomUUID} from 'crypto'
import {NextRequest, NextResponse} from "next/server";
import {connectToDatabase} from "@/lib/mongo";
import {ObjectId} from "mongodb";
import {getToken} from "next-auth/jwt";
import {cookies} from "next/headers";
import {User} from "@/lib/class/User";

export async function POST(req: NextRequest) {
    const { email, first_name, last_name, role, school_id } = await req.json()
    const db = await connectToDatabase()

    const userToken = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

    const school_id_token = userToken?.school_id
    const effectiveSchoolId = school_id || school_id_token

    if (!effectiveSchoolId) {
        return new NextResponse('Unauthorized', { status: 401 })
    }
    const u = await User.init(req)
    const user = await u.getUserByEmail(email)


    if (user) {
        const existsInSchool = await db.collection('user_school').findOne({
            user_id: user._id,
            school_id: new ObjectId(effectiveSchoolId)
        },{ projection: { passwordHash: 0 } })

        if (existsInSchool) {
            return new NextResponse('Používateľ už je členom školy', { status: 409 })
        }

        await db.collection('user_school').insertOne({
            user_id: user._id,
            school_id: new ObjectId(effectiveSchoolId),
            role,
        })

        return NextResponse.json({message: 'Používateľ bol pridaný do školy'})
    }

    const token = randomUUID()
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24) // 24h

    await db.collection('registration-tokens').insertOne({
        token,
        school_id: new ObjectId(effectiveSchoolId),
        email,
        first_name,
        last_name,
        role,
        expiresAt,
        created: new Date(),
    })

    return NextResponse.json({ token })
}

export async function GET(req: NextRequest) {
    const token = await getToken({
        req: {cookies: await cookies()} as any,
        secret: process.env.NEXTAUTH_SECRET,
    })

    const school_id = token?.school_id
    if (!school_id) {
        return new NextResponse('Unauthorized', {status: 401})
    }

    const db = await connectToDatabase()

    const now = new Date()

    const activeToken = await db.collection('registration-tokens').findOne(
        {
            school_id: new ObjectId(school_id),
            expiresAt: {$gte: now},
        },
        {sort: {created: -1}}
    )

    if (!activeToken) {
        return NextResponse.json({token: null})
    }

    return NextResponse.json({token: activeToken.token})
}
