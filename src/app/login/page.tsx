'use client'

import { useState } from 'react'
import { getSession, signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button, Card, Form, Input, Layout, Typography, message } from 'antd'

const { Content } = Layout
const { Title, Text } = Typography

export default function LoginPage() {
    const [loading, setLoading] = useState(false)
    const [hasFailedLogin, setHasFailedLogin] = useState(false)
    const router = useRouter()

    const onFinish = async (values: { email: string; password: string }) => {
        setLoading(true)
        const res = await signIn('credentials', {
            email: values.email,
            password: values.password,
            redirect: false,
        })

        if (res?.ok) {
            message.success('Prihlásenie prebehlo úspešne')
            const session: any = await getSession()
            if (session?.user.school_choices?.length > 1) {
                router.push('/select-school')
            } else {
                router.push('/')
                router.refresh()
            }
        } else {
            message.error('Neplatný email alebo heslo')
            setHasFailedLogin(true)
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
                    style={{ width: '100%', maxWidth: 420, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                >
                    <div style={{ textAlign: 'center', marginBottom: 24 }}>
                        <Title level={2} style={{ marginBottom: 0 }}>
                            Prihlásenie
                        </Title>
                        <Text type="secondary">Vitaj späť 👋</Text>
                    </div>
                    <Form layout="vertical" onFinish={onFinish}>
                        <Form.Item
                            label="Email"
                            name="email"
                            rules={[{ type: "email", required: true, message: 'Zadajte platný email' }]}
                        >
                            <Input
                                type="email"
                                autoComplete="email"
                                placeholder="napr. meno@email.sk"
                            />
                        </Form.Item>

                        <Form.Item
                            label="Heslo"
                            name="password"
                            rules={[{ required: true, message: 'Zadajte heslo' }]}
                        >
                            <Input.Password
                                autoComplete="current-password"
                                placeholder="••••••••"
                            />
                        </Form.Item>

                        <Form.Item>
                            <Button type="primary" htmlType="submit" loading={loading} block>
                                Prihlásiť sa
                            </Button>
                        </Form.Item>

                        {hasFailedLogin && (
                            <div style={{ textAlign: 'center', marginTop: 16 }}>
                                <Link href="/forgot-password" style={{ color: '#1890ff' }}>
                                    Zabudli ste heslo?
                                </Link>
                            </div>
                        )}
                    </Form>
                </Card>
            </Content>
        </Layout>
    )
}
