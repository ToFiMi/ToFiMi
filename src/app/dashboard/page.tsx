'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Layout, Typography, Button, Spin } from 'antd'

const { Header, Content } = Layout
const { Title, Text } = Typography

export default function AdminDashboardPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    if (loading) {
        return <div className="flex justify-center items-center min-h-screen"><Spin size="large" /></div>
    }


    return (
        <Layout className="min-h-screen">
            <Content className="p-6">
                Hellou čuraci
            </Content>
        </Layout>
    )
}
