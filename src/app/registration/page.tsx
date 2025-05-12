import Members from "@/app/registration/members";
import {getToken} from "next-auth/jwt";
import {cookies} from "next/headers";

export default async function RegistrationPage() {
    const token = await getToken({ req: { cookies: await cookies() } as any, secret: process.env.NEXTAUTH_SECRET  })

    const schoolId = token?.school_id

    console.log(token)

    return(<main>

        <Members school_id={schoolId as string}/>



    </main>)
}
