// lib/email.ts
import nodemailer from 'nodemailer'

let transporter: any = null

function getTransporter() {
    if (!transporter) {
        const smtpHost = process.env.SMTP_HOST || 'localhost'
        const smtpPort = parseInt(process.env.SMTP_PORT || '1025')
        const smtpUser = process.env.SMTP_USER
        const smtpPass = process.env.SMTP_PASS
        const smtpSecure = process.env.SMTP_SECURE === 'true'

        transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpSecure,
            auth: smtpUser && smtpPass ? {
                user: smtpUser,
                pass: smtpPass,
            } : undefined,
        })
    }
    return transporter
}

export async function sendEmail(opts: {
    to: string
    subject: string
    htmlContent: string
}) {
    const from = process.env.EMAIL_FROM || 'noreply@das-app.sk'
    const transport = getTransporter()

    await transport.sendMail({
        from,
        to: opts.to,
        subject: opts.subject,
        html: opts.htmlContent,
    })
}
