import { getToken } from "next-auth/jwt";
import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/mongo";
import { ObjectId } from "mongodb";
import { Layout } from "antd";
import HomeworkUserPage from "@/app/homeworks/[event_id]/user_page";
import HomeworkAnimatorPage, {HomeworkWithUser} from "@/app/homeworks/[event_id]/animator_page";
import { Homework } from "@/models/homework";

type Params = {
    params: { event_id: string }
}

export default async function HomeworkDetailPage({ params }: Params) {
    const token = await getToken({ req: { cookies: await cookies() } as any, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return <p>Neautorizovaný prístup</p>

    const db = await connectToDatabase()
    const eventId = new ObjectId(params.event_id)

    const event = await db.collection('events').findOne({ _id: eventId })
    if (!event) return <p>Termín neexistuje</p>

    const role = token.role
    const userId = token.user_id

    let content = null

    if (role === "user") {
        const homework = await db.collection<Homework>('homeworks').findOne({
            user_id: new ObjectId(userId),
            event_id: eventId
        })
        content = <HomeworkUserPage homework={homework} event_id={eventId.toString()} event_name={event.title} />
    }

    if (role === "animator" || role === "leader") {
        const homeworks = await db.collection('homeworks').aggregate([
            {
                $match: {
                    event_id: new ObjectId(eventId)
                }
            },
            {
                $lookup: {
                    from: 'user_school',
                    localField: 'user_id',
                    foreignField: '_id',
                    as: 'userSchool'
                }
            },
            { $unwind: '$userSchool' },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userSchool.user_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            { $unwind: '$user' },
            {
                $project: {
                    _id: 1,
                    event_id: 1,
                    user_id: 1,
                    content: 1,
                    created: 1,
                    updated: 1,
                    'user.first_name': 1,
                    'user.last_name': 1,
                    'user.email': 1
                }
            }
        ]).toArray()
        content = <HomeworkAnimatorPage homeworks={homeworks as unknown as HomeworkWithUser} event_name={event.title} event_id={eventId.toString()} />
    }

    return (
        <Layout className="max-w-3xl mx-auto mt-6 px-4">
            {content}
        </Layout>
    )
}
