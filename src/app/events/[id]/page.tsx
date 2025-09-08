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
import WorksheetPage from "./worksheet-page";
import SetBreadcrumbName from "@/components/set-breadcrumb-name";
import { Event } from "@/models/events";
import { Homework } from "@/models/homework";
import { Registration } from "@/models/registrations";

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
    let registration: Registration | null = null;
    let shouldShowWorksheet: ObjectId | string | boolean = false;
    let worksheet: any = null;

    if (role === "user") {
        // Check registration and attendance
        registration = await db.collection<Registration>("registrations").findOne({
            user_id: new ObjectId(token.user_id),
            event_id: eventId,
        });

        const notRegistered = !registration;
        const notAttended = registration && (registration.attended === false || registration.attended === null);

        shouldShowWorksheet = (notRegistered || notAttended) && event.worksheet_id;

        if (shouldShowWorksheet && event.worksheet_id) {
            worksheet = await db.collection("worksheets").findOne({
                _id: new ObjectId(event.worksheet_id)
            });
        }

        // Only show homework if user attended or was registered
        if (!shouldShowWorksheet) {
            homework = await db.collection<Homework>("homeworks").findOne({
                user_id: new ObjectId(token.id),
                event_id: eventId,
            });
        }
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
                // Lookup worksheet submissions for worksheet type homeworks
                {
                    $lookup: {
                        from: "worksheet_submissions",
                        localField: "worksheet_submission_id",
                        foreignField: "_id",
                        as: "worksheet_submission",
                    },
                },
                {
                    $project: {
                        _id: 1,
                        event_id: 1,
                        user_id: 1,
                        content: {
                            $cond: [
                                { $eq: ["$type", "worksheet"] },
                                { $ifNull: [{ $arrayElemAt: ["$worksheet_submission.essay_content", 0] }, "Worksheet submission"] },
                                "$content"
                            ]
                        },
                        status: 1,
                        type: 1,
                        worksheet_submission_id: 1,
                        created: 1,
                        updated: 1,
                        "user.first_name": 1,
                        "user.last_name": 1,
                        "user.email": 1,
                        worksheet_submission: { $arrayElemAt: ["$worksheet_submission", 0] },
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
            <EventPage event={event} userRole={role} />

            {/* 2. domáca úloha alebo worksheet (podľa roly a účasti) */}
            {role === "user" && shouldShowWorksheet && (
                <WorksheetPage
                    worksheet={worksheet}
                    event_id={eventId.toString()}
                    event_name={event.title}
                    registration={registration}
                />
            )}

            {role === "user" && !shouldShowWorksheet && (
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
