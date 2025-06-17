import {Suspense} from "react";
import SchoolGroups from "@/app/schools/[school_id]/school-groups";
import {getToken} from "next-auth/jwt";
import {cookies} from "next/headers";

export default async function GroupsPage() {

    const token = await getToken({req: {cookies: await cookies()} as any, secret: process.env.NEXTAUTH_SECRET})
    if (!token) return <p>Neautorizovaný prístup</p>
    return (
        <div className="mt-8">
            <Suspense fallback={<p>Načítavam termíny...</p>}>
                <SchoolGroups schoolId={token.school_id} hide_add_group={token.role == "user"}/>
            </Suspense>
        </div>
    )
}
