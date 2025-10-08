'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button, Card, Form, Input, Layout, Typography, message } from 'antd'

const { Content } = Layout
const { Title, Text } = Typography

export default function ForgotPasswordPage() {
    const [loading, setLoading] = useState(false)
    const [emailSent, setEmailSent] = useState(false)
    const router = useRouter()

    const onFinish = async (values: { email: string }) => {
        setLoading(true)
        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: values.email }),
            })

            const data = await res.json()

            if (res.ok) {
                setEmailSent(true)
                message.success(data.message)
            } else {
                message.error(data.error || 'Niečo sa pokazilo')
            }
        } catch (error) {
            message.error('Niečo sa pokazilo')
        } finally {
            setLoading(false)
        }
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
                        <Title level={2} style={{ marginBottom: 8 }}>
                            Obnovenie hesla
                        </Title>
                        <Text type="secondary">
                            {emailSent
                                ? 'Skontroluj si email'
                                : 'Zadaj svoj email a pošleme ti odkaz na obnovenie hesla'}
                        </Text>
                    </div>

                    {!emailSent ? (
                        <Form layout="vertical" onFinish={onFinish}>
                            <Form.Item
                                label="Email"
                                name="email"
                                rules={[{ type: 'email', required: true, message: 'Zadajte platný email' }]}
                            >
                                <Input
                                    type="email"
                                    autoComplete="email"
                                    placeholder="napr. meno@email.sk"
                                />
                            </Form.Item>

                            <Form.Item>
                                <Button type="primary" htmlType="submit" loading={loading} block>
                                    Poslať odkaz
                                </Button>
                            </Form.Item>

                            <div style={{ textAlign: 'center', marginTop: 16 }}>
                                <Link href="/login" style={{ color: '#1890ff' }}>
                                    Späť na prihlásenie
                                </Link>
                            </div>
                        </Form>
                    ) : (
                        <div style={{ textAlign: 'center' }}>
                            <Text>
                                Ak účet s týmto emailom existuje, poslali sme ti odkaz na obnovenie hesla.
                                Skontroluj si svoju emailovú schránku.
                            </Text>
                            <div style={{ marginTop: 24 }}>
                                <Link href="/login">
                                    <Button type="primary" block>
                                        Späť na prihlásenie
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    )}
                </Card>
            </Content>
        </Layout>
    )
}