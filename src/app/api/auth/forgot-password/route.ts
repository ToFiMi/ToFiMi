import { NextRequest, NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongo'
import { sendEmail } from '@/lib/email'
import { nanoid } from 'nanoid'

export async function POST(req: NextRequest) {
    const { email } = await req.json()

    if (!email) {
        return NextResponse.json({ error: 'Email je povinný' }, { status: 400 })
    }

    const db = await connectToDatabase()

    // Check if user exists
    const user = await db.collection('users').findOne({ email })

    // Always return success to prevent email enumeration
    if (!user) {
        return NextResponse.json({
            message: 'Ak účet s týmto emailom existuje, poslali sme ti odkaz na obnovenie hesla.'
        })
    }

    // Generate reset token
    const token = nanoid(32)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour expiry

    // Store token in registration-tokens collection
    await db.collection('registration-tokens').insertOne({
        token,
        type: 'password-reset',
        email,
        expiresAt,
        created: new Date(),
    })

    // Get the reset URL
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const resetUrl = `${baseUrl}/reset-password?token=${token}`

    // Send email
    await sendEmail({
        to: email,
        subject: 'Obnovenie hesla',
        htmlContent: `
            <p>Ahoj,</p>
            <p>Požiadal(a) si o obnovenie hesla. Klikni na odkaz nižšie pre nastavenie nového hesla:</p>
            <p><a href="${resetUrl}">Obnoviť heslo</a></p>
            <p>Tento odkaz je platný 1 hodinu.</p>
            <p>Ak si o obnovenie hesla nežiadal(a), tento email ignoruj.</p>
            <br>
            <p>💌 Tvoj tím</p>
        `,
    })

    return NextResponse.json({
        message: 'Ak účet s týmto emailom existuje, poslali sme ti odkaz na obnovenie hesla.'
    })
}