import { getToken } from "next-auth/jwt";
import { cookies } from "next/headers";
import {Events} from "@/app/events/events";
import {findEvents} from "@/app/api/events/route"; // napr. premiestni si tú funkciu

export default async function EventsPage() {
    const token = await getToken({
        req: { cookies: await cookies() } as any,
        secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) return <div>Neautorizovaný prístup</div>;

    const events = await findEvents({
        isAdmin: token.isAdmin,
        school_id: token.school_id,
    });

    // Serialize events for client component
    const serializedEvents = events.map(event => ({
        ...event,
        _id: event._id.toString(),
        school_id: event.school_id?.toString(),
        worksheet_id: event.worksheet_id?.toString(),
        created: event.created instanceof Date ? event.created.toISOString() : event.created,
        updated: event.updated instanceof Date ? event.updated.toISOString() : event.updated,
    }));

    return <Events
        events={serializedEvents}
        userRole={token.role as string}
        schoolId={token.school_id as string}
    />;
}
