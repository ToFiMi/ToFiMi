import {Button, Layout, Space} from 'antd'
import {DailyReflection} from "@/componets/daily-reflection";
import {connectToDatabase} from "@/lib/mongo";
import {Event} from "@/models/events";
import {RegistrationCard} from "@/componets/registration-card";
import {getToken} from "next-auth/jwt";
import {cookies} from "next/headers";
import {ObjectId} from "mongodb";



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


    const event = next_event?.[0] || null
    const next: Event | null = {
        ...event as Event,
        _id: event?._id.toString(),
        school_id: event?.school_id?.toString?.(),
    }




    return (
        <Layout className="min-h-screen">
            <Space direction="vertical" size="middle" style={{ display: 'flex' }}>

            <DailyReflection last_event={last_event[0] ? { ...last_event[0] as Event, _id: last_event[0]._id.toString() } : null}/>

            <RegistrationCard next_event={ next?._id? next: null} userRole={token?.role}/>


            </Space>

        </Layout>
    )

}
