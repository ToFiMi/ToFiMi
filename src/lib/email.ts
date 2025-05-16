// lib/email.ts
import { Resend } from 'resend'

let resend: Resend | null = null

function getResend () {
    if (!resend) {
        const key = process.env.RESEND_API_KEY
        if (!key) throw new Error('RESEND_API_KEY missing')
        resend = new Resend(key)
    }
    return resend
}

export async function sendEmail(opts: {
    to: string
    schoolName?: string
    htmlContent: string
}) {
    const r = getResend()
    await r.emails.send({
        from: 'noreply@das-app.sk',
        to: opts.to,
        subject: `Pozvánka do školy ${opts.schoolName ?? ''}`,
        html: opts.htmlContent,
    })
}
