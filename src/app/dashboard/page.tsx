import { cookies } from 'next/headers'
import {Layout} from "antd";
import {AdminEventCard, AdminReportRegistrations} from "@/app/dashboard/admin-event-card";
import {NextRequest} from "next/server";
import {getReport} from "@/app/api/events/[event_id]/report/route";
import {Event} from "../../../models/events"
import {connectToDatabase} from "@/lib/mongo";

export default async function AdminDashboardPage(req: NextRequest) {

    const { event, registrations, next_event, previous_event } =  await getReport('next')


    return (
        <Layout className="min-h-screen">
            <AdminEventCard current_event={event} next_event={next_event as Event } previous_event={previous_event as Event} next_registrations={registrations as AdminReportRegistrations } />
        </Layout>
    )
}
