import {Layout} from "antd";
import {NextRequest} from "next/server";
import {getReport} from "@/app/api/events/[event_id]/report/route";
import {AdminEventCard} from "@/app/dashboard/admin-event-card";
import {Event} from "@/models/events"

export default async function AdminDashboardPage() {
    let report = null
    try {
        report = await getReport('next')
    } catch (err) {
        console.error('❌ Chyba pri načítaní reportu:', err)
    }

    if (!report) {
        return (
            <Layout className="min-h-screen p-8">
                <h1>Žiadny nadchádzajúci víkend nebol nájdený.</h1>
            </Layout>
        )
    }

    const { event, registrations, next_event, previous_event } = report

    return (
        <Layout className="min-h-screen">
            <AdminEventCard
                current_event={event}
                next_event={next_event as Event}
                previous_event={previous_event as Event}
                next_registrations={registrations}
            />
        </Layout>
    )
}
