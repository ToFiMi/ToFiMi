import {NextRequest} from 'next/server'
import {connectToDatabase} from '@/lib/mongo'
import bcrypt from 'bcrypt'
import {SignJWT} from 'jose'
import {cookies} from 'next/headers'

export async function POST(req: NextRequest) {
    console.log("ola")
    const {email, password} = await req.json()

    const db = await connectToDatabase()
    const user = await db.collection('users').findOne({email})
    console.log(user)
    if (!user) {
        return Response.json({message: 'Invalid credentials'}, {status: 401})
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash)
    if (!passwordMatch) {
        return Response.json({message: 'Invalid credentials'}, {status: 401})
    }


    // JWT payload
    const payload: any = {
        user_id: user._id.toString(),
        isAdmin: user.isAdmin === true
    }

    // ak user nie je admin, načítame jeho školy
    if (!user.isAdmin) {
        const userSchool = await db.collection('user_school').findOne({user_id: user._id})
        if (userSchool) {
            payload.school_id = userSchool.school_id.toString()
            payload.role = userSchool.role
        }
    }

    const token = await new SignJWT(payload)
        .setProtectedHeader({alg: 'HS256'})
        .setExpirationTime('7d')
        .sign(new TextEncoder().encode(process.env.JWT_SECRET))
    const cookieStore = await cookies()


    cookieStore.set('auth_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 7 dní
    })

    return Response.json({success: true})
}
