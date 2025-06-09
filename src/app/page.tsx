import LoginPage from './login/page'
import AdminDashboardPage from './dashboard/page'
import UsersDashboardPage from './dashboard/users-dashboard'
import {getToken} from "next-auth/jwt";
import {cookies} from "next/headers"; // or your actual dashboard component

export default async function HomePage() {
    const token = await getToken({req: {cookies: await cookies()} as any, secret: process.env.NEXTAUTH_SECRET})

    if (!token) {
        console.log("NO TOKEN")
        return null
    }

    const auth = {
        userId: token.id as string,
        userSchoolId: token.user_id,
        role: token.role as 'ADMIN' | 'user' | 'leader' | 'animator',
        isAdmin: token.role === 'ADMIN',
        schoolId: token.school_id as string | null,
    }

    if (!auth) return <LoginPage/>
    if (auth.role === "ADMIN") return <AdminDashboardPage/>
    else return <UsersDashboardPage/>
}
