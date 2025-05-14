'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card, Form, Input, message, Typography } from 'antd'

const { Title } = Typography

type User = {
    email: string
    password: string
    check_password: string
    first_name: string
    last_name: string
}

export default function CreateAccountPage({ params }: { params: { token: string } }) {
    const token = params.token
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const onFinish = async (values: User) => {
        if (values.password !== values.check_password) {
            message.error('Heslá sa nezhodujú')
            return
        }

        setLoading(true)
        const res = await fetch('/api/crete_account', {
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
        <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
            <Card style={{ width: 400 }}>
                <Title level={2} style={{ textAlign: 'center' }}>Vytvoriť účet</Title>
                <Form layout="vertical" onFinish={onFinish}>
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

                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading} block>
                            Vytvoriť účet
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    )
}
