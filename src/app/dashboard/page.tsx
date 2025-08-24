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

export default async function AdminDashboardPage() {
    let report = null
    try {
        report = await getReport('next')
    } catch (err) {
        console.error('Chyba pri načítaní reportu:', err)
    }

    const token = await getToken({req: {cookies: await cookies()} as any, secret: process.env.NEXTAUTH_SECRET})
    const school_id = token?.school_id

    // Find events ending today that have feedback URLs
    const db = await connectToDatabase()
    const today = dayjs().startOf('day').toDate()
    const tomorrow = dayjs().add(1, 'day').startOf('day').toDate()
    
    const events_ending_today = await db.collection<Event>('events')
        .find({ 
            endDate: { $gte: today, $lt: tomorrow },
            school_id: new ObjectId(school_id as string),
            feedbackUrl: { $exists: true, $ne: null, $ne: '' }
        })
        .project({ school_id: 0 })
        .toArray()

    if (!report) {
        return (
            <Layout className="min-h-screen p-8">
                <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
                    {/* Show feedback forms for events ending today */}
                    {events_ending_today.map(event => (
                        <FeedbackDisplay 
                            key={event._id.toString()}
                            event={{
                                ...event,
                                _id: event._id.toString(),
                                school_id: event.school_id?.toString()
                            }}
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
                {/* Show feedback forms for events ending today */}
                {events_ending_today.map(event => (
                    <FeedbackDisplay 
                        key={event._id.toString()}
                        event={{
                            ...event,
                            _id: event._id.toString(),
                            school_id: event.school_id?.toString()
                        }}
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
