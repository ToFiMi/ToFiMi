// lib/email.ts
import nodemailer from 'nodemailer'
import { Resend } from 'resend'

const isDevelopment = process.env.NODE_ENV === 'development'

let transporter: any = null
let resendClient: Resend | null = null

function getTransporter() {
    if (!transporter) {
        const smtpHost = process.env.SMTP_HOST || 'localhost'
        const smtpPort = parseInt(process.env.SMTP_PORT || '1025')
        const smtpUser = process.env.SMTP_USER
        const smtpPass = process.env.SMTP_PASS
        const smtpSecure = process.env.SMTP_SECURE === 'false'

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

function getResendClient() {
    if (!resendClient) {
        const apiKey = process.env.RESEND_API_KEY
        if (!apiKey) {
            throw new Error('RESEND_API_KEY is not set')
        }
        resendClient = new Resend(apiKey)
    }
    return resendClient
}

export async function sendEmail(opts: {
    to: string
    subject: string
    htmlContent: string
}) {
    const from = process.env.EMAIL_FROM || 'noreply@das-app.sk'

    if (isDevelopment) {
        // Use Mailhog for development
        const transport = getTransporter()
        await transport.sendMail({
            from,
            to: opts.to,
            subject: opts.subject,
            html: opts.htmlContent,
        })
    } else {
        // Use Resend for production
        const resend = getResendClient()
        await resend.emails.send({
            from,
            to: opts.to,
            subject: opts.subject,
            html: opts.htmlContent,
        })
    }
}
