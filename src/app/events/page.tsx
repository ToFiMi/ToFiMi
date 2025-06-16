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

    return <Events events={events} />;
}
