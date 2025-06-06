import {Card, Layout, Tabs} from 'antd'
import {connectToDatabase} from '@/lib/mongo'
import dayjs from 'dayjs'
import {getToken} from "next-auth/jwt"
import {cookies} from "next/headers"
import Link from "next/link"
import {Event} from "@/models/events"
import {ObjectId} from "mongodb"

export default async function HomeworksPage() {
    const db = await connectToDatabase()
    const token = await getToken({req: {cookies: await cookies()} as any, secret: process.env.NEXTAUTH_SECRET})
    const schoolId = token?.school_id

    const events = await db
        .collection<Event>('events')
        .find({school_id: new ObjectId(schoolId)})
        .sort({startDate: 1})
        .toArray()


    const groupedByGrade: Record<number, Event[]> = {}
    console.log(events)
    for (const event of events) {

        const grade = event.grade ?? 0

        if (!groupedByGrade[grade]) groupedByGrade[grade] = []
        groupedByGrade[grade].push(event)
    }

    const sortedGrades = Object.keys(groupedByGrade)
        .map(Number)
        .sort((a, b) => a - b)


    const firstActiveGrade = sortedGrades.find(grade =>
        groupedByGrade[grade].some(event => dayjs(event.endDate).isAfter(dayjs(), 'day'))
    ) ?? sortedGrades[0]?.toString()

    return (
        <Layout className="max-w-4xl mx-auto mt-6 px-4">
            <h3>Domáce úlohy</h3>

            <Tabs defaultActiveKey={firstActiveGrade?.toString()} items={
                sortedGrades.map(grade => ({
                    key: grade.toString(),
                    label: `${grade}. ročník`,
                    children: <EventList events={groupedByGrade[grade]}/>
                }))
            }/>
        </Layout>
    )
}

function EventList({events}: { events: Event[] }) {
    return (
        <div className="grid grid-cols-1 gap-4 mt-4">
            {events.map(event => (
                <Layout style={{marginBottom: 10}}>
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
                            <p>
                                <strong>Dátum:</strong> {dayjs(event.startDate).format('DD.MM.YYYY')} – {dayjs(event.endDate).format('DD.MM.YYYY')}
                            </p>
                            <p><strong>Popis:</strong> {event.description ?? 'Bez popisu'}</p>
                        </Card>
                    </Link>
                </Layout>
            ))}
        </div>
    )
}
