import { cookies } from 'next/headers'
import {Layout} from "antd";
import {AdminEventCard} from "@/app/dashboard/admin-event-card";

export default async function AdminDashboardPage() {
    const cookieStore =await cookies()
    const token = cookieStore.get('auth_token')?.value

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const res = await fetch(`${baseUrl}/api/events/next/report`, {
        headers: {
            Cookie: `auth_token=${token}`
        },
        cache: 'no-store' // SSR fresh data
    })

    if (!res.ok) {
        throw new Error('Nepodarilo sa načítať dáta z report API.')
    }

    const { event, registrations, next_event, previous_event } = await res.json()


    return (
        <Layout className="min-h-screen">
            <AdminEventCard current_event={event} next_event={next_event} previous_event={previous_event} next_registrations={registrations} />
        </Layout>
    )
}
