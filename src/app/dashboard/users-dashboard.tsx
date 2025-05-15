import {Button, Layout, Space} from 'antd'
import {DailyReflection} from "@/componets/daily-reflection";
import {connectToDatabase} from "@/lib/mongo";
import {Event} from "../../../models/events";
import {RegistrationCard} from "@/componets/registration-card";
import {signOut} from "next-auth/react";



export default async function UsersDashboardPage() {
    const db = await connectToDatabase()
    const now = new Date()

    // todo: handle this schoold id event
    const last_event = await db.collection('events')
        .find({ endDate: { $lt: now } })
        .sort({ endDate: -1 })
        .limit(1)
        .project({ _id: 0, school_id: 0 })
        .toArray()
    const next_event = await db.collection("events")
        .find({ startDate: { $gte: now } })
        .sort({ startDate: 1 })
        .limit(1)
        .toArray()


    const event = next_event?.[0] || null
    const next: Event = {
        ...event as Event,
        _id: event?._id.toString(),
        school_id: event?.school_id?.toString?.(),
    }


    return (
        <Layout className="min-h-screen">
            <Space direction="vertical" size="middle" style={{ display: 'flex' }}>

            <DailyReflection last_event={last_event[0] as Event || null}/>

            <RegistrationCard next_event={next || null}/>


            </Space>

        </Layout>
    )

}
