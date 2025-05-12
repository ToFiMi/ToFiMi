import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail({
                                    to,
                                    schoolName,
                                    htmlContent

                                      }: {
    to: string
    schoolName: string
    htmlContent:string
}) {
    const result = await resend.emails.send({
        from: process.env.EMAIL_FROM ?? 'info@das-vazec.sk',
        to,
        subject: `Pozvánka do školy ${schoolName}`,
        html: htmlContent
    })

    return result
}
