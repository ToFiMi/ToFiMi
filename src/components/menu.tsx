'use client'

import {Breadcrumb, Button, ConfigProvider, Grid, Layout, Menu} from 'antd'
import {LogoutOutlined, MenuFoldOutlined, MenuUnfoldOutlined} from '@ant-design/icons'
import Link from 'next/link'
import {signOut, useSession} from 'next-auth/react'
import {useLayoutEffect, useState, useMemo, useEffect} from 'react'
import {usePathname, useRouter} from "next/navigation";
import dayjs from 'dayjs'
import 'dayjs/locale/sk'
import localeData from 'dayjs/plugin/localeData'
import sk from 'antd/locale/sk_SK'
import {useMobile} from "@/hooks/useMobile";
import {ROUTES_BY_ROLE, UserRole} from "@/config/routes";

dayjs.extend(localeData)
dayjs.locale({ ...dayjs.Ls.sk, weekStart: 1 })

const { Sider, Header } = Layout

type Props = {
    children: React.ReactNode
}

export default function AppMenu({ children }: Props) {
    const { data: session, update } = useSession()
    const role = session?.user?.role
    const mq = '(max-width: 768px)'
    const router = useRouter()
    const pathname = usePathname()
    const crumbs = pathname.split('/').filter(Boolean)

    // Auto-refresh session every 5 seconds to pick up role changes
    useEffect(() => {
        const interval = setInterval(() => {
            update()
        }, 5000)
        return () => clearInterval(interval)
    }, [update])

    const [collapsed, setCollapsed] = useState(() => {
        if (typeof window === 'undefined') return true
        return window.matchMedia(mq).matches
    })

    useLayoutEffect(() => {
        const mql = window.matchMedia(mq)
        const handler = (e: MediaQueryListEvent) => setCollapsed(e.matches)

        setCollapsed(mql.matches)
        mql.addEventListener('change', handler)
        return () => mql.removeEventListener('change', handler)
    }, [])

    const handleLogout = () => {
        signOut({ redirect: false }).then(() => {
            router.push('/')
            router.refresh()
        })
    }


    const getMenuItems = (role: UserRole) => {
        return ROUTES_BY_ROLE[role as keyof typeof ROUTES_BY_ROLE] || []
    }

    const items = getMenuItems(role as keyof typeof ROUTES_BY_ROLE)
    const menuMap = useMemo(() => Object.fromEntries(items.map(i => [i.key.replace(/^\//, ''), i.label])), [items])
    const isMobile= useMobile()
    const [idNameMap, setIdNameMap] = useState<Record<string, string>>({})

    useEffect(() => {
        if (typeof window !== 'undefined' && window.app?.callback?.path) {
            const map: Record<string, string> = {}
            for (const id in window.app.callback.path) {
                map[id] = window.app.callback.path[id].name
            }
            setIdNameMap(map)
        }
    }, [])

    const crumb_items = [
        {
            title: <Link href="/">Domov</Link>,
        },
        ...crumbs.map((part, index) => {
            const fullPath = '/' + crumbs.slice(0, index + 1).join('/')
            const isLast = index === crumbs.length - 1

            // Získaj názov z window.app.callback.path alebo použijeme segment
            const label = idNameMap[part] || decodeURIComponent(part)

            return {
                title: isLast ? (
                    <span>{label}</span>
                ) : (
                    <Link href={fullPath}>{label}</Link>
                ),
            }
        }),
    ]

    return (
        <Layout style={{ minHeight: '100vh' }}>
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
                <div style={{ height: 64, display: 'flex', alignItems: 'center', padding: '0 16px', color: 'white', fontWeight: 600, fontSize: 18, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <Button
                        type="text"
                        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                        onClick={() => setCollapsed(!collapsed)}
                        style={{ color: 'white' }}
                    />
                </div>

                <div style={{ flex: 1, overflowY: 'auto' }}>
                    <Menu
                        theme="dark"
                        mode="inline"
                        defaultSelectedKeys={['/']}
                        items={items.map(item => ({
                            key: item.key,
                            label: <Link onClick={isMobile&& (()=> setCollapsed(true))} href={item.key}>{item.label}</Link>,

                        }))}
                    />
                </div>

                <div style={{ padding: 16 }}>
                    <Button
                        type="primary"
                        danger
                        icon={<LogoutOutlined />}
                        block={!collapsed}
                        onClick={handleLogout}
                        style={{ borderRadius: 6 }}
                    >
                        {!collapsed && 'Odhlásiť sa'}
                    </Button>
                </div>
            </Sider>

            <Layout style={{ marginLeft: collapsed ? 0 : 220, transition: 'margin-left 0.2s' }}>
                <Header style={{ background: '#fff', padding: '0 16px', display: 'flex', alignItems: 'center', height: 64, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                    {collapsed && (
                        <Button icon={<MenuUnfoldOutlined />} type="text" onClick={() => setCollapsed(false)} />
                    )}
                    <Breadcrumb items={crumb_items}/>


                </Header>

                <ConfigProvider locale={sk}>
                    <Layout.Content style={{ margin: '24px 16px', overflow: 'auto' }}>
                        {children}
                    </Layout.Content>
                </ConfigProvider>
            </Layout>
        </Layout>
    )
}
