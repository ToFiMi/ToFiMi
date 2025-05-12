import {Button, Layout, Space} from 'antd'
import {DailyReflection} from "@/componets/daily-reflection";
import {connectToDatabase} from "@/lib/mongo";
import {Term} from "../../../models/terms";
import {RegistrationCard} from "@/componets/registration-card";
import {signOut} from "next-auth/react";



export default async function UsersDashboardPage() {
    const db = await connectToDatabase()
    const now = new Date()
    const last_event = await db.collection('terms')
        .find({ endDate: { $lt: now } })
        .sort({ endDate: -1 })
        .limit(1)
        .project({ _id: 0, school_id: 0 })
        .toArray()
    const next_event = await db.collection("terms")
        .find({ startDate: { $gte: now } })
        .sort({ startDate: 1 })
        .limit(1)
        .toArray()


    const term = next_event[0]
    const next: Term = {
        ...term as Term,
        _id: term._id.toString(),
        school_id: term.school_id?.toString?.(),
    }


    return (
        <Layout className="min-h-screen">
            <Space direction="vertical" size="middle" style={{ display: 'flex' }}>

            <DailyReflection last_event={last_event[0] as Term}/>

            <RegistrationCard next_event={next}/>


            </Space>

        </Layout>
    )

}
