import { cookies } from 'next/headers'
import {Layout} from "antd";
import {AdminEventCard} from "@/app/dashboard/admin-event-card";
import { headers } from "next/headers";

export default async function AdminDashboardPage() {
    const cookieStore =await cookies()
    const token = cookieStore.get('auth_token')?.value
    const headersList = await headers()
    const referer = headersList.get("referer")


    const res = await fetch(`${referer}/api/events/next/report`, {
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
