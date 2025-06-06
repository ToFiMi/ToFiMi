'use client'

import {Breadcrumb, Button, ConfigProvider, Grid, Layout, Menu} from 'antd'
import {LeftOutlined, LogoutOutlined, MenuFoldOutlined, MenuUnfoldOutlined} from '@ant-design/icons'
import Link from 'next/link'
import {signOut} from 'next-auth/react'
import {useLayoutEffect, useState} from 'react'
import {usePathname, useRouter} from "next/navigation";
import dayjs from 'dayjs'
import 'dayjs/locale/sk'
import localeData from 'dayjs/plugin/localeData'
import sk from 'antd/locale/sk_SK'

dayjs.extend(localeData)
dayjs.locale({
    ...dayjs.Ls.sk,
    weekStart: 1
})


const {Sider, Header} = Layout

type Props = {
    role: 'ADMIN' | 'user' | 'leader' | 'animator' | null | {}
    children: React.ReactNode
}
const {useBreakpoint} = Grid;
export default function AppMenu({role, children}: Props) {
    const mq = '(max-width: 768px)'
    const router = useRouter()


    const [collapsed, setCollapsed] = useState(() => {
        // na SSR: schovám ho, aby nič nesvietilo
        if (typeof window === 'undefined') return true
        return window.matchMedia(mq).matches
    })

    useLayoutEffect(() => {
        const mql = window.matchMedia(mq)
        const handler = (e: MediaQueryListEvent) => setCollapsed(e.matches)

        setCollapsed(mql.matches)

        mql.addEventListener('change', handler)
        return () => {
            mql.removeEventListener('change', handler)
        }
    }, [])

    const handleLogout = () => {
        signOut({redirect: false}).then(() => {
                router.push('/')
                router.refresh()
            }
        )
    }


    const getMenuItems = () => {
        if (role === "ADMIN") return [

            {key: '/', label: "Domov"},
            {key: '/schools', label: 'Správa škôl'},
            {key: '/users', label: 'Účastníci'},
            {key: '/reports', label: 'Prehľady'},
            {key: "/notifications", label: 'Notifikácie'},
            {key: '/profile', label: 'Profil'},

        ]

        if (role === 'leader') return [
            {key: '/', label: "Domov"},
            {key: '/homeworks', label: 'Domáce úlohy'},
            {key: '/groups', label: 'Skupinky'},
            {key: '/users', label: 'Účastníci'},
            {key: '/daily-reflections', label: 'Zamyslenia'},
            {key: '/profile', label: 'Profil'},
        ]
        if (role === 'animator') return [
            {key: '/', label: "Domov"},
            {key: '/homeworks', label: 'Domáce úlohy'},
            {key: '/events', label: 'Termíny'},
            {key: '/users', label: 'Účastníci'},
            {key: '/daily-reflections', label: 'Zamyslenia'},
            {key: '/profile', label: 'Profil'},
        ]
        return [
            {key: '/', label: "Domov"},
            {key: '/homeworks', label: 'Domáce úlohy'},
            {key: '/events', label: 'Termíny'},
            {key: '/users', label: 'Účastníci'},
            {key: '/daily-reflections', label: 'Zamyslenia'},
            {key: '/profile', label: 'Profil'},
        ]
    }

    const items = getMenuItems()
    const pathname = usePathname()

    const crumbs = pathname.split('/').filter(Boolean)

    return (
        <Layout style={{minHeight: '100vh'}}>
            <Sider
                collapsible
                trigger={null}
                collapsed={collapsed}
                collapsedWidth={0}
                width={220}
                style={{
                    height: '100vh',
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    backgroundColor: '#001529',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
                    zIndex: 1000,
                }}
            >
                {/* Logo + Collapse toggle */}
                <div
                    style={{
                        height: 64,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0 16px',
                        color: 'white',
                        fontWeight: 600,
                        fontSize: 18,
                        borderBottom: '1px solid rgba(255,255,255,0.1)',
                    }}
                >

                    <Button
                        type="text"
                        icon={collapsed ? <MenuUnfoldOutlined/> : <MenuFoldOutlined/>}
                        onClick={() => setCollapsed(!collapsed)}
                        style={{color: 'white'}}
                    />

                </div>

                {/* Menu */}
                <div style={{flex: 1, overflowY: 'auto'}}>
                    <Menu
                        theme="dark"
                        mode="inline"
                        defaultSelectedKeys={['/']}
                        items={items.map(item => ({
                            key: item.key,
                            label: <Link href={item.key}>{item.label}</Link>,
                        }))}
                    />
                </div>

                {/* Logout */}
                <div style={{padding: 16}}>
                    <Button
                        type="primary"
                        danger
                        icon={<LogoutOutlined/>}
                        block={!collapsed}
                        onClick={handleLogout}
                        style={{borderRadius: 6}}
                    >
                        {!collapsed && 'Odhlásiť sa'}
                    </Button>
                </div>
            </Sider>


            <Layout style={{marginLeft: collapsed ? 0 : 220, transition: 'margin-left 0.2s'}}>
                <Header
                    style={{
                        background: '#fff',
                        padding: '0 16px',
                        display: 'flex',
                        alignItems: 'center',
                        height: 64,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    }}
                >
                    {collapsed ? (
                        <Button
                            icon={<MenuUnfoldOutlined />}
                            type="text"
                            onClick={() => setCollapsed(false)}
                        />
                    ) : (
                        <></>
                        // <Button icon={<LeftOutlined />} type="text" onClick={() => router.back()}>
                        //     Späť
                        // </Button>
                    )}
                    <Breadcrumb>
                        <Breadcrumb.Item key="home">
                            <a href="/">Domov</a>
                        </Breadcrumb.Item>
                        {crumbs.map((part, index) => (
                            <Breadcrumb.Item key={index}>
                                {decodeURIComponent(part)}
                            </Breadcrumb.Item>
                        ))}
                    </Breadcrumb>
                </Header>

                {/* Page content */}
                <ConfigProvider locale={sk}>
                    <Layout.Content style={{margin: '24px 16px', overflow: 'auto'}}>
                        {children}
                    </Layout.Content>
                </ConfigProvider>
            </Layout>
        </Layout>
    )
}
