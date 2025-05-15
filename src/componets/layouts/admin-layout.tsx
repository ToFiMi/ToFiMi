'use client'
import { signOut } from 'next-auth/react'
import {Button, Layout, Menu} from 'antd'
import { useRouter } from 'next/navigation'
import { ReactNode } from 'react'

const { Header, Content, Sider } = Layout

const items = [
    {key:'', label: "Domov"},
    { key: 'schools', label: 'Správa škôl' },
    { key: 'participants', label: 'Účastníci' },
    { key: 'reports', label: 'Prehľady' },
]

export function AdminLayout({ children, role, userId }: { children: ReactNode, role?:string| unknown, userId?:string| unknown }) {
    const router = useRouter()

    const onMenuClick = (e: any) => {
        router.push(`/${e.key}`)
    }



    const handleLogout = async () => {
        await signOut({ redirect: true, callbackUrl: '/' })
    }

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider breakpoint="lg" collapsedWidth="0">
                <Menu
                    theme="dark"
                    mode="inline"
                    items={items}
                    onClick={onMenuClick}
                />
                <Button type="primary" danger onClick={handleLogout}>
                    Logout
                </Button>

            </Sider>
            <Layout>
                <Header style={{ background: '#fff', paddingLeft: 10 }}>
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
