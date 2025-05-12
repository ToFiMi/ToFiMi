import LoginPage from './login/page'
import AdminDashboardPage from './dashboard/page'
import UsersDashboardPage from './dashboard/users-dashboard'

import {getAuthContextFromCookies} from "@/lib/auth-context-SSR"; // or your actual dashboard component

export default async function HomePage() {
        const auth = await getAuthContextFromCookies()
        console.log(auth)

        if (!auth) return <LoginPage />
        if(auth.role === "ADMIN") return <AdminDashboardPage />
        else return <UsersDashboardPage/>
}
