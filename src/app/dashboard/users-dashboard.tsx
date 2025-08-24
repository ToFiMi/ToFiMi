import {Button, Layout, Space} from 'antd'
import {DailyReflection} from "@/components/daily-reflection";
import {connectToDatabase} from "@/lib/mongo";
import {Event} from "@/models/events";
import {RegistrationCard} from "@/components/registration-card";
import {FeedbackDisplay} from "@/components/feedback-display";
import {getToken} from "next-auth/jwt";
import {cookies} from "next/headers";
import {ObjectId} from "mongodb";
import dayjs from "dayjs";



export default async function UsersDashboardPage() {
    const db = await connectToDatabase()
    const now = new Date()

    const token = await getToken({req: {cookies: await cookies()} as any, secret: process.env.NEXTAUTH_SECRET})
    const school_id = token?.school_id

    const last_event = await db.collection<Event>('events')
        .find({ endDate: { $lt: now }, school_id: new ObjectId(school_id as string) })
        .sort({ endDate: -1 })
        .limit(1)
        .project({ school_id: 0 })
        .toArray()
    const next_event = await db.collection<Event>("events")
        .find({ startDate: { $gte: now },school_id: new ObjectId(school_id as string) })
        .sort({ startDate: 1 })
        .limit(1)
        .toArray()

    // Find events ending today that have feedback URLs
    const today = dayjs().startOf('day').toDate()
    const tomorrow = dayjs().add(1, 'day').startOf('day').toDate()

    const events_ending_today = await db.collection<Event>('events')
        .find({
            endDate: { $gte: today, $lt: tomorrow },
            school_id: new ObjectId(school_id as string),
            //@ts-ignore
            feedbackUrl: { $exists: true, $ne: null, $ne: '' }
        })
        .project({ school_id: 0 })
        .toArray()


    const event = next_event?.[0] || null
    const next: Event | null = {
        ...event as Event,
        _id: event?._id.toString(),
        school_id: event?.school_id?.toString?.(),
    }




    return (
        <Layout className="min-h-screen">
            <Space direction="vertical" size="middle" style={{ display: 'flex' }}>

            {/* Show feedback forms for events ending today */}
            {events_ending_today.map(event => (
                <FeedbackDisplay
                    key={event._id.toString()}
                    // @ts-ignore
                    event={{
                        ...event,
                        _id: event._id.toString(),
                        school_id: event.school_id?.toString()
                    }}
                    showAlways={true}
                />
            ))}

            <DailyReflection
                last_event={last_event[0] ? { ...last_event[0] as Event, _id: last_event[0]._id.toString() } : null}
                userRole={token?.role}
            />

            <RegistrationCard next_event={ next?._id? next: null} userRole={token?.role}/>


            </Space>

        </Layout>
    )

}
