import { Layout, Tabs, Card } from 'antd'
import { connectToDatabase } from '@/lib/mongo'
import dayjs from 'dayjs'
import {getToken} from "next-auth/jwt";
import {cookies} from "next/headers";
import Link from "next/link";
import {Event} from "@/models/events"
import {ObjectId} from "mongodb";



export default async function HomeworksPage() {
    const db = await connectToDatabase()
    const token = await getToken({req: {cookies: await cookies()} as any, secret: process.env.NEXTAUTH_SECRET})
    const schoolId = token?.school_id
    console.log(schoolId)

    const events = await db
        .collection<Event>('events')
        .find({school_id: new ObjectId(schoolId)})
        .sort({ startDate: 1 })
        .toArray()

    const grouped = {
        1: [] as any[],
        2: [] as any[],
    }

    for (const event of events) {
        if (event.grade === 1) grouped[1].push(event)
        if (event.grade === 2) grouped[2].push(event)
    }

    const allFirstEnded = grouped[1].every(e => dayjs(e.endDate).isBefore(dayjs(), 'day'))

    const defaultTab = allFirstEnded ? '2' : '1'
console.log(events)
    return (
        <Layout className="max-w-4xl mx-auto mt-6 px-4">
            <h3 >Domáce úlohy</h3>

            <Tabs defaultActiveKey={defaultTab} items={[
                {
                    key: '1',
                    label: '1. ročník',
                    children: (
                        <EventList events={grouped[1]} />
                    )
                },
                {
                    key: '2',
                    label: '2. ročník',
                    children: (
                        <EventList events={grouped[2]} />
                    )
                }
            ]} />
        </Layout>
    )
}

function EventList({ events }: { events: any[] }) {
    return (
        <div className="grid grid-cols-1 gap-4 mt-4">
            {events.map(event => (
                <Link
                    key={event._id.toString()}
                    href={`/homeworks/${event._id.toString()}`}
                    className="block hover:no-underline"
                >
                    <Card
                        hoverable
                        title={event.title}
                        className="transition-shadow duration-150 hover:shadow-md"
                    >
                        <p><strong>Dátum:</strong> {dayjs(event.startDate).format('DD.MM.YYYY')} – {dayjs(event.endDate).format('DD.MM.YYYY')}</p>
                        <p><strong>Popis:</strong> {event.description ?? 'Bez popisu'}</p>
                    </Card>
                </Link>
            ))}
        </div>
    )
}
