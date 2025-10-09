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

    /* ---------- serialize data for client components ---------- */
    const serializedEvent = {
        ...event,
        _id: event._id.toString(),
        school_id: event.school_id?.toString(),
        worksheet_id: event.worksheet_id?.toString(),
        created: event.created instanceof Date ? event.created.toISOString() : event.created,
        updated: event.updated instanceof Date ? event.updated.toISOString() : event.updated,
    }

    const serializedWorksheet = worksheet ? {
        ...worksheet,
        _id: worksheet._id?.toString(),
        school_id: worksheet.school_id?.toString(),
        created_by: worksheet.created_by?.toString(),
        created: worksheet.created instanceof Date ? worksheet.created.toISOString() : worksheet.created,
        updated: worksheet.updated instanceof Date ? worksheet.updated.toISOString() : worksheet.updated,
    } : null

    const serializedHomework = homework ? {
        ...homework,
        _id: homework._id?.toString(),
        user_id: homework.user_id?.toString(),
        event_id: homework.event_id?.toString(),
        worksheet_submission_id: homework.worksheet_submission_id?.toString(),
        created: homework.created instanceof Date ? homework.created.toISOString() : homework.created,
        updated: homework.updated instanceof Date ? homework.updated.toISOString() : homework.updated,
    } : null

    const serializedHomeworks = homeworks.map(hw => ({
        ...hw,
        _id: hw._id?.toString(),
        user_id: hw.user_id?.toString(),
        event_id: hw.event_id?.toString(),
        worksheet_submission_id: hw.worksheet_submission_id?.toString(),
        created: hw.created instanceof Date ? hw.created.toISOString() : hw.created,
        updated: hw.updated instanceof Date ? hw.updated.toISOString() : hw.updated,
        worksheet_submission: hw.worksheet_submission ? {
            ...hw.worksheet_submission,
            _id: hw.worksheet_submission._id?.toString(),
            worksheet_id: hw.worksheet_submission.worksheet_id?.toString(),
            user_id: hw.worksheet_submission.user_id?.toString(),
            created: hw.worksheet_submission.created instanceof Date ? hw.worksheet_submission.created.toISOString() : hw.worksheet_submission.created,
            updated: hw.worksheet_submission.updated instanceof Date ? hw.worksheet_submission.updated.toISOString() : hw.worksheet_submission.updated,
        } : undefined
    }))

    const serializedRegistration = registration ? {
        ...registration,
        _id: registration._id?.toString(),
        user_id: registration.user_id?.toString(),
        event_id: registration.event_id?.toString(),
        attendance_marked_at: registration.attendance_marked_at instanceof Date ? registration.attendance_marked_at.toISOString() : registration.attendance_marked_at,
        created: registration.created instanceof Date ? registration.created.toISOString() : registration.created,
        updated: registration.updated instanceof Date ? registration.updated.toISOString() : registration.updated,
    } : null

    /* ---------- render ---------- */
    return (
        <Layout className="max-w-3xl mx-auto mt-6 px-4">
            <SetBreadcrumbName id={params.id} name={event.title} />

            {/* 1. detail víkendu */}
            <EventPage event={serializedEvent} userRole={role} />

            {/* 2. domáca úloha alebo worksheet (podľa roly a účasti) */}
            {role === "user" && shouldShowWorksheet && (
                <WorksheetPage
                    worksheet={serializedWorksheet}
                    event_id={eventId.toString()}
                    event_name={event.title}
                    registration={serializedRegistration}
                />
            )}

            {role === "user" && !shouldShowWorksheet && (
                <HomeworkUserPage
                    homework={serializedHomework}
                    event_id={eventId.toString()}
                    event_name={event.title}
                />
            )}

            {(role === "animator" || role === "leader") && (
                <HomeworkAnimatorPage
                    homeworks={serializedHomeworks}
                    event_id={eventId.toString()}
                    event_name={event.title}
                />
            )}
        </Layout>
    );
}
