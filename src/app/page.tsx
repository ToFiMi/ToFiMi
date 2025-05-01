// src/app/page.tsx
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import LoginPage from './login/page'
import DashboardPage from './dashboard/page' // or your actual dashboard component

export default async function HomePage() {
    const session = await getServerSession(authOptions)

    if (session?.user) {
        return <DashboardPage />
    }

    return <LoginPage />
}
