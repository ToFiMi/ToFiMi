'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSession, signIn } from 'next-auth/react'
import { Layout, Card, Select, Typography, Button, message } from 'antd'

const { Title, Text } = Typography
const { Content } = Layout

export default function SelectSchoolPage() {
    const [options, setOptions] = useState<any[]>([])
    const [session, setSession] = useState<any>()
    const [selected, setSelected] = useState<any | null>(null)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    useEffect(() => {
        getSession().then((session: any) => {
            if (session?.user?.school_choices?.length > 0) {
                setSession(session)
                setOptions(session.user.school_choices)
            } else {
                router.push('/')
            }
        })
    }, [router])

    const handleSubmit = async () => {
        if (!selected) return

        setLoading(true)
        const res = await signIn('credentials', {
            email: session.user.email,
            user_school_id: selected.value,
            password: 'temporary',
            redirect: true,
            callbackUrl: '/',
        })

        if (res?.ok) {
            message.success('Škola bola nastavená')
            router.push('/')
            router.refresh()
        } else {
           console.error("Nepodarilo sa")
        }
        setLoading(false)
    }

    return (
        <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
            <Content
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '24px',
                }}
            >
                <Card
                    style={{ width: '100%', maxWidth: 460, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    bordered={false}
                >
                    <div style={{ textAlign: 'center', marginBottom: 24 }}>
                        <Title level={3} style={{ marginBottom: 0 }}>
                            Výber školy
                        </Title>
                        <Text type="secondary">Zvoľte školu, do ktorej sa chcete prihlásiť</Text>
                    </div>

                    <Select
                        style={{ width: '100%', marginBottom: 16 }}
                        placeholder="Vyberte školu"
                        onChange={(_, option) => setSelected(option)}
                        options={options.map((s) => ({
                            label: `${s.name} – ${s.role}`,
                            value: s.id,
                            role: s.role,
                            school_id: s.school_id,
                        }))}
                    />

                    <Button
                        type="primary"
                        block
                        onClick={handleSubmit}
                        loading={loading}
                        disabled={!selected}
                    >
                        Pokračovať
                    </Button>
                </Card>
            </Content>
        </Layout>
    )
}
