'use client'

import { Layout, Menu } from 'antd'
import { useRouter } from 'next/navigation'
import { ReactNode } from 'react'

const { Header, Content, Sider } = Layout

const items = [
    { key: 'schools', label: 'Správa škôl' },
    { key: 'participants', label: 'Účastníci' },
    { key: 'reports', label: 'Prehľady' },
]

export function AdminLayout({ children }: { children: ReactNode }) {
    const router = useRouter()

    const onMenuClick = (e: any) => {
        router.push(`/${e.key}`)
    }

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider breakpoint="lg" collapsedWidth="0">
                <div className="p-4 text-white font-bold">Admin</div>
                <Menu
                    theme="dark"
                    mode="inline"
                    items={items}
                    onClick={onMenuClick}
                />
            </Sider>
            <Layout>
                <Header style={{ background: '#fff', padding: 0 }}>
                    <div className="p-4 text-lg font-semibold">Admin Panel</div>
                </Header>
                <Content style={{ margin: '24px 16px 0' }}>
                    <div style={{ padding: 24, minHeight: 360 }}>
                        {children}
                    </div>
                </Content>
            </Layout>
        </Layout>
    )
}
