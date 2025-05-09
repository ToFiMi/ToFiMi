'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Layout, Typography, Button, Spin } from 'antd'

const { Header, Content } = Layout
const { Title, Text } = Typography

export default function DashboardPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [user, setUser] = useState<null | { email: string; isAdmin: boolean; role?: string }>(null)

    useEffect(() => {
        const fetchUser = async () => {
            // const res = await fetch('/api/auth/me')
            // if (res.ok) {
            //     const data = await res.json()
            //     setUser(data)
            // } else {
            //     router.push('/login') // ak nie je prihlásený, presmeruj
            // }
            setLoading(false)
        }

        fetchUser()
    }, [router])

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' })
        router.push('/login')
    }

    if (loading) {
        return <div className="flex justify-center items-center min-h-screen"><Spin size="large" /></div>
    }

    if (!user) {
        return null
    }

    return (
        <Layout className="min-h-screen">
            <Header className="flex justify-between items-center bg-blue-600 px-6">
                <Title level={3} className="text-white mb-0">Dashboard</Title>
                <Button type="primary" danger onClick={handleLogout}>
                    Logout
                </Button>
            </Header>
            <Content className="p-6">
                <Title level={4}>Welcome, {user.email}</Title>
                <Text>Your role: {user.isAdmin ? 'Super Admin' : user.role ?? 'User'}</Text>
            </Content>
        </Layout>
    )
}
