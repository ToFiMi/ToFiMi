'use client'

import {useEffect, useState} from 'react'
import { useRouter } from 'next/navigation'
import {Button, Card, Form, Input, Layout, message, Typography, Checkbox} from 'antd'
import {Content} from "antd/es/layout/layout";
import { useParams } from 'next/navigation'

const { Title, Text } = Typography

type User = {
    email: string
    password: string
    check_password: string
    first_name: string
    last_name: string
}

export default function CreateAccountPage() {
    const {token} = useParams< {  token: string }>()

    const [form] = Form.useForm()

    const [loading, setLoading] = useState(false)
    const router = useRouter()
    useEffect(() => {
        const fetchTokenData = async () => {
            const res = await fetch(`/api/create_account/${token}`) // GET
            if (res.ok) {
                const data = await res.json()
                form.setFieldsValue({
                    email: data.email,
                    first_name: data.first_name,
                    last_name: data.last_name
                })
            }
        }
        fetchTokenData()
    }, [token])

    const onFinish = async (values: User) => {
        if (values.password !== values.check_password) {
            message.error('Heslá sa nezhodujú')
            return
        }

        setLoading(true)
        const res = await fetch('/api/create_account', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ...values,
                token,
            }),
        })

        if (res.ok) {
            message.success('Účet bol vytvorený')
            router.push('/login')
        } else {
            const error = await res.text()
            message.error(error || 'Nepodarilo sa vytvoriť účet')
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
                <Title level={2} style={{ textAlign: 'center' }}>Vytvoriť účet</Title>
                <Form layout="vertical" onFinish={onFinish} form={form} >
                    <Form.Item
                        label="Meno"
                        name="first_name"
                        rules={[{ required: true, message: 'Zadajte meno' }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        label="Priezvisko"
                        name="last_name"
                        rules={[{ required: true, message: 'Zadajte priezvisko' }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        label="Email"
                        name="email"
                        rules={[{ required: true, type: 'email', message: 'Zadajte správny email' }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        label="Heslo"
                        name="password"
                        rules={[{ required: true, message: 'Zadajte heslo' }]}
                    >
                        <Input.Password />
                    </Form.Item>
                    <Form.Item
                        label="Zopakujte heslo"
                        name="check_password"
                        dependencies={['password']}
                        rules={[{ required: true, message: 'Zopakujte heslo' }]}
                    >
                        <Input.Password />
                    </Form.Item>

                    <Form.Item
                        name="gdpr_consent"
                        valuePropName="checked"
                        rules={[
                            {
                                validator: (_, value) =>
                                    value ? Promise.resolve() : Promise.reject(new Error('Musíte súhlasiť so spracovaním osobných údajov'))
                            }
                        ]}
                    >
                        <Checkbox>
                            <Text>
                                Súhlasím so{' '}
                                <a href="/gdpr" target="_blank" rel="noopener noreferrer">
                                    spracovaním osobných údajov
                                </a>{' '}
                                (GDPR)
                            </Text>
                        </Checkbox>
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading} block>
                            Vytvoriť účet
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
                </Content>
        </Layout>

    )
}
