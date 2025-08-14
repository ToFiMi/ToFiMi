// app/events/[id]/page.tsx
import { getToken } from "next-auth/jwt";
import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/mongo";
import { ObjectId } from "mongodb";
import { notFound } from "next/navigation";
import { Layout } from "antd";

import { EventPage } from "./event-page";
import HomeworkUserPage from "./user_page";
import HomeworkAnimatorPage, {
    HomeworkWithUser,
} from "./animator_page";
import SetBreadcrumbName from "@/componets/set-breadcrumb-name";
import { Event } from "@/models/events";
import { Homework } from "@/models/homework";

type Params = { params: { id: string } };

export default async function EventDetailPage({ params }: Params) {
    /* ---------- autorizácia a samotný víkend ---------- */
    const token = await getToken({
        req: { cookies: await cookies() } as any,
        secret: process.env.NEXTAUTH_SECRET,
    });
    if (!token) notFound();

    const db = await connectToDatabase();
    const eventId = new ObjectId(params.id);

    const event = await db.collection<Event>("events").findOne({ _id: eventId });
    if (
        !event ||
        (!token.isAdmin &&
            (!event.school_id || event.school_id.toString() !== token.school_id))
    ) {
        notFound();
    }

    /* ---------- načítanie domácich úloh podľa roly ---------- */
    const role = token.role;
    let homework: Homework | null = null;
    let homeworks: HomeworkWithUser[] = [];

    if (role === "user") {
        homework = await db.collection<Homework>("homeworks").findOne({
            user_id: new ObjectId(token.user_id),
            event_id: eventId,
        });
    }

    if (role === "animator" || role === "leader") {
        homeworks = (await db
            .collection("homeworks")
            .aggregate<HomeworkWithUser>([
                { $match: { event_id: eventId } },
                {
                    $lookup: {
                        from: "user_school",
                        localField: "user_id",
                        foreignField: "user_id",
                        as: "userSchool",
                    },
                },
                { $unwind: "$userSchool" },
                { $match: { "userSchool.school_id": new ObjectId(token.school_id) } },
                {
                    $lookup: {
                        from: "users",
                        localField: "userSchool.user_id",
                        foreignField: "_id",
                        as: "user",
                    },
                },
                { $unwind: "$user" },
                {
                    $project: {
                        _id: 1,
                        event_id: 1,
                        user_id: 1,
                        content: 1,
                        status: 1,
                        created: 1,
                        updated: 1,
                        "user.first_name": 1,
                        "user.last_name": 1,
                        "user.email": 1,
                    },
                },
            ])
            .toArray()) as HomeworkWithUser[];
        
    }

    /* ---------- render ---------- */
    return (
        <Layout className="max-w-3xl mx-auto mt-6 px-4">
            <SetBreadcrumbName id={params.id} name={event.title} />

            {/* 1. detail víkendu */}
            <EventPage event={event} />

            {/* 2. domáca úloha (podľa roly) */}
            {role === "user" && (
                <HomeworkUserPage
                    homework={homework}
                    event_id={eventId.toString()}
                    event_name={event.title}
                />
            )}

            {(role === "animator" || role === "leader") && (
                <HomeworkAnimatorPage
                    homeworks={homeworks}
                    event_id={eventId.toString()}
                    event_name={event.title}
                />
            )}
        </Layout>
    );
}
