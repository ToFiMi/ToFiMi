"use server"
import {Layout, Space} from "antd";
import {getReport} from "@/app/api/events/[event_id]/report/route";
import {AdminEventCard} from "@/app/dashboard/admin-event-card";
import {FeedbackDisplay} from "@/components/feedback-display";
import {Event} from "@/models/events";
import {connectToDatabase} from "@/lib/mongo";
import {getToken} from "next-auth/jwt";
import {cookies} from "next/headers";
import {ObjectId} from "mongodb";
import dayjs from "dayjs";
import DutyRosterDisplay from "@/components/duty-roster-display";

export default async function AdminDashboardPage() {
    const token = await getToken({req: {cookies: await cookies()} as any, secret: process.env.NEXTAUTH_SECRET})
    const school_id = token?.school_id

    let report = null
    try {
        report = await getReport('next', school_id as string)
    } catch (err) {
        console.error('Chyba pri načítaní reportu:', err)
    }

    // Find events ending today that have feedback URLs
    const db = await connectToDatabase()
    const today = dayjs().startOf('day').toDate()
    const tomorrow = dayjs().add(1, 'day').startOf('day').toDate()

    // Build query based on whether school_id is available
    const endingEventsQuery: any = {
        endDate: { $gte: today, $lt: tomorrow },
        feedbackUrl: { $exists: true, $nin: [null, ''] }
    }
    if (school_id) {
        endingEventsQuery.school_id = new ObjectId(school_id)
    }

    const events_ending_today = await db.collection<Event>('events')
        .find(endingEventsQuery)
        .toArray()

    const serializedEndingEvents = events_ending_today.map(event => ({
        ...event,
        _id: event._id.toString(),
        school_id: event.school_id?.toString(),
        created: event.created instanceof Date ? event.created.toISOString() : event.created,
        updated: event.updated instanceof Date ? event.updated.toISOString() : event.updated,
        startDate: event.startDate instanceof Date ? event.startDate.toISOString() : event.startDate,
        endDate: event.endDate instanceof Date ? event.endDate.toISOString() : event.endDate,
    }))

    // Check for currently running event (today is between startDate and endDate)
    const now = new Date()
    now.setHours(0, 0, 0, 0)

    const runningEventQuery: any = {
        startDate: { $lte: now },
        endDate: { $gte: now }
    }
    if (school_id) {
        runningEventQuery.school_id = new ObjectId(school_id)
    }

    const running_event = await db.collection<Event>('events')
        .findOne(runningEventQuery)

    const runningEvent = running_event ? {
        _id: running_event._id.toString(),
        school_id: running_event.school_id?.toString?.() ?? '',
        title: running_event.title,
        startDate: running_event.startDate instanceof Date ? running_event.startDate.toISOString() : running_event.startDate,
        endDate: running_event.endDate instanceof Date ? running_event.endDate.toISOString() : running_event.endDate,
    } : null

    if (!report) {
        return (
            <Layout className="min-h-screen p-8">
                <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
                    {/* Show duty roster for running event */}
                    {runningEvent && (
                        <DutyRosterDisplay event={runningEvent} showEmptyState={true} />
                    )}

                    {/* Show feedback forms for events ending today */}
                    {serializedEndingEvents.map(event => (
                        <FeedbackDisplay
                            key={event._id}
                            event={event}
                            showAlways={true}
                        />
                    ))}
                    <h1>Žiadny nadchádzajúci víkend nebol nájdený.</h1>
                </Space>
            </Layout>
        )
    }

    const { event, registrations, next_event, previous_event } = report

    return (
        <Layout className="min-h-screen">
            <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
                {/* Show duty roster for running event */}
                {runningEvent && (
                    <DutyRosterDisplay event={runningEvent} showEmptyState={true} />
                )}

                {/* Show feedback forms for events ending today */}
                {serializedEndingEvents.map(event => (
                    <FeedbackDisplay
                        key={event._id}
                        event={event}
                        showAlways={true}
                    />
                ))}

                <AdminEventCard
                    current_event={event}
                    next_event={next_event as Event}
                    previous_event={previous_event as Event}
                    next_registrations={registrations}
                />
            </Space>
        </Layout>
    )
}
