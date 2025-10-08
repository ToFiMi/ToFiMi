import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongo'
import bcrypt from 'bcrypt'

export async function POST(req: NextRequest) {
    const { token, password } = await req.json()

    if (!token || !password) {
        return NextResponse.json({ error: 'Token a heslo sú povinné' }, { status: 400 })
    }

    if (password.length < 6) {
        return NextResponse.json({ error: 'Heslo musí mať aspoň 6 znakov' }, { status: 400 })
    }

    const db = await connectToDatabase()

    // Find and validate token
    const resetToken = await db.collection('registration-tokens').findOne({
        token,
        type: 'password-reset',
    })

    if (!resetToken || new Date(resetToken.expiresAt) < new Date()) {
        return NextResponse.json({ error: 'Token je neplatný alebo expirovaný' }, { status: 403 })
    }

    // Find user by email from token
    const user = await db.collection('users').findOne({ email: resetToken.email })

    if (!user) {
        return NextResponse.json({ error: 'Používateľ neexistuje' }, { status: 404 })
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 10)

    // Update user password
    await db.collection('users').updateOne(
        { _id: user._id },
        {
            $set: {
                passwordHash,
                updated: new Date(),
            },
        }
    )

    // Delete used token
    await db.collection('registration-tokens').deleteOne({ token })

    return NextResponse.json({ message: 'Heslo bolo úspešne zmenené' })
}

export async function GET(req: NextRequest) {
    const token = req.nextUrl.searchParams.get('token')

    if (!token) {
        return NextResponse.json({ error: 'Token chýba' }, { status: 400 })
    }

    const db = await connectToDatabase()

    // Validate token
    const resetToken = await db.collection('registration-tokens').findOne({
        token,
        type: 'password-reset',
    })

    if (!resetToken || new Date(resetToken.expiresAt) < new Date()) {
        return NextResponse.json({ error: 'Token je neplatný alebo expirovaný', valid: false }, { status: 403 })
    }

    return NextResponse.json({
        valid: true,
        email: resetToken.email,
    })
}