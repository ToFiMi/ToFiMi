'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Form, Input, Button, Typography, Card, message } from 'antd'

const { Title } = Typography

export default function LoginPage() {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const onFinish = async (values: { email: string; password: string }) => {
        setLoading(true)

        const res = await fetch('/api/public/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                email: values.email,
                password: values.password,
            }),
        })


        if (res.ok) {
            message.success('Login successful')
            router.push('/dashboard')
        } else {
            message.error('Invalid email or password')
        }

        setLoading(false)
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
            <Card style={{ width: 400 }}>
                <Title level={2} style={{ textAlign: 'center' }}>Login</Title>
                <Form layout="vertical" onFinish={onFinish}>
                    <Form.Item
                        label="Email"
                        name="email"
                        rules={[{ required: true, message: 'Please input your email!' }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        label="Password"
                        name="password"
                        rules={[{ required: true, message: 'Please input your password!' }]}
                    >
                        <Input.Password />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading} block>
                            Login
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    )
}
