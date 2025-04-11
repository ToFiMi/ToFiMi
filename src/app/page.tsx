'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button, Form, Input, Typography, Divider, message } from 'antd';

export default function HomeLoginPage() {
    const router = useRouter(); // ✅ Correct usage here
    const [loading, setLoading] = useState(false);

    const handleCredentialsLogin = async (values: any) => {
        setLoading(true);

        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(values),
        });

        const data = await res.json();

        if (res.ok) {
            if (data.redirectTo) {
                router.push(data.redirectTo);
            } else if (data.options?.length > 1) {
                localStorage.setItem('login-options', JSON.stringify(data.options));
                router.push('/choose');
            }
        } else {
            message.error(data.error || 'Login failed');
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen flex flex-col justify-center items-center p-6">
            <Typography.Title level={2}>Welcome to DAS</Typography.Title>

            <Form layout="vertical" onFinish={handleCredentialsLogin} className="w-full max-w-sm">
                <Form.Item name="email" label="Email" rules={[{ required: true }]}>
                    <Input />
                </Form.Item>

                <Form.Item name="password" label="Password" rules={[{ required: true }]}>
                    <Input.Password />
                </Form.Item>

                <Button type="primary" htmlType="submit" loading={loading} block>
                    Login
                </Button>
            </Form>

            <Divider>Or</Divider>

            {/* Google login can be enabled later */}
        </div>
    );
}
