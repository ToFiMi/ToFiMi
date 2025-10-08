'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button, Card, Form, Input, Layout, Typography, message, Spin } from 'antd'

const { Content } = Layout
const { Title, Text } = Typography

export default function ResetPasswordPage() {
    const [loading, setLoading] = useState(false)
    const [validating, setValidating] = useState(true)
    const [tokenValid, setTokenValid] = useState(false)
    const [email, setEmail] = useState('')
    const [passwordReset, setPasswordReset] = useState(false)
    const router = useRouter()
    const searchParams = useSearchParams()
    const token = searchParams.get('token')

    useEffect(() => {
        const validateToken = async () => {
            if (!token) {
                message.error('Neplatný odkaz')
                setValidating(false)
                return
            }

            try {
                const res = await fetch(`/api/auth/reset-password?token=${token}`)
                const data = await res.json()

                if (res.ok && data.valid) {
                    setTokenValid(true)
                    setEmail(data.email)
                } else {
                    message.error(data.error || 'Token je neplatný alebo expirovaný')
                    setTokenValid(false)
                }
            } catch (error) {
                message.error('Niečo sa pokazilo')
                setTokenValid(false)
            } finally {
                setValidating(false)
            }
        }

        validateToken()
    }, [token])

    const onFinish = async (values: { password: string; confirmPassword: string }) => {
        if (values.password !== values.confirmPassword) {
            message.error('Heslá sa nezhodujú')
            return
        }

        setLoading(true)
        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token,
                    password: values.password,
                }),
            })

            const data = await res.json()

            if (res.ok) {
                message.success(data.message)
                setPasswordReset(true)
                setTimeout(() => {
                    router.push('/login')
                }, 2000)
            } else {
                message.error(data.error || 'Niečo sa pokazilo')
            }
        } catch (error) {
            message.error('Niečo sa pokazilo')
        } finally {
            setLoading(false)
        }
    }

    if (validating) {
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
                    <Card style={{ width: '100%', maxWidth: 420, textAlign: 'center' }}>
                        <Spin size="large" />
                        <div style={{ marginTop: 16 }}>
                            <Text>Overujem token...</Text>
                        </div>
                    </Card>
                </Content>
            </Layout>
        )
    }

    if (!tokenValid) {
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
                    <Card style={{ width: '100%', maxWidth: 420, textAlign: 'center' }}>
                        <Title level={3}>Neplatný odkaz</Title>
                        <Text type="secondary">
                            Tento odkaz na obnovenie hesla je neplatný alebo expirovaný.
                        </Text>
                        <div style={{ marginTop: 24 }}>
                            <Link href="/forgot-password">
                                <Button type="primary" block>
                                    Požiadať o nový odkaz
                                </Button>
                            </Link>
                            <Link href="/login">
                                <Button type="link" block>
                                    Späť na prihlásenie
                                </Button>
                            </Link>
                        </div>
                    </Card>
                </Content>
            </Layout>
        )
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
                            Nové heslo
                        </Title>
                        <Text type="secondary">
                            {passwordReset ? 'Heslo bolo zmenené!' : `Zadaj nové heslo pre ${email}`}
                        </Text>
                    </div>

                    {!passwordReset ? (
                        <Form layout="vertical" onFinish={onFinish}>
                            <Form.Item
                                label="Nové heslo"
                                name="password"
                                rules={[
                                    { required: true, message: 'Zadajte heslo' },
                                    { min: 6, message: 'Heslo musí mať aspoň 6 znakov' },
                                ]}
                            >
                                <Input.Password
                                    autoComplete="new-password"
                                    placeholder="••••••••"
                                />
                            </Form.Item>

                            <Form.Item
                                label="Potvrďte heslo"
                                name="confirmPassword"
                                rules={[
                                    { required: true, message: 'Potvrďte heslo' },
                                    ({ getFieldValue }) => ({
                                        validator(_, value) {
                                            if (!value || getFieldValue('password') === value) {
                                                return Promise.resolve()
                                            }
                                            return Promise.reject(new Error('Heslá sa nezhodujú'))
                                        },
                                    }),
                                ]}
                            >
                                <Input.Password
                                    autoComplete="new-password"
                                    placeholder="••••••••"
                                />
                            </Form.Item>

                            <Form.Item>
                                <Button type="primary" htmlType="submit" loading={loading} block>
                                    Zmeniť heslo
                                </Button>
                            </Form.Item>
                        </Form>
                    ) : (
                        <div style={{ textAlign: 'center' }}>
                            <Text>Presmerujeme ťa na prihlasovaciu stránku...</Text>
                        </div>
                    )}
                </Card>
            </Content>
        </Layout>
    )
}