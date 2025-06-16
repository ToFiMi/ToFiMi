import { getToken } from "next-auth/jwt";
import { cookies } from "next/headers";
import { connectToDatabase } from "@/lib/mongo";
import { Event } from "@/models/events";
import { ObjectId } from "mongodb";
import { notFound } from "next/navigation";
import {EventPage} from "@/app/events/[id]/event-page";

type Params = {
    params: {
        id: string;
    };
};
//TODO: tu ešte tereba viac info o vikende, plus domacu ulohu ale ak som leader, admin, animator tak domace ulohy
export default async function EventDetailPage({ params }: Params) {
    const token = await getToken({
        req: { cookies: await cookies() } as any,
        secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token) notFound();

    const db = await connectToDatabase();
    const event = await db.collection<Event>("events").findOne({
        _id: new ObjectId(params.id),
    });

    if (
        !event ||
        (!token.isAdmin &&
            (!event.school_id || event.school_id.toString() !== token.school_id))
    ) {
        notFound();
    }

    return <EventPage event={event} />;
}
