'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input, Button, Typography, message, Form } from 'antd';

export default function CreateSchoolPage() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const onFinish = async (values: any) => {
        setLoading(true);
        try {
            const res = await fetch('/api/backoffice/schools', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            });

            if (!res.ok) throw new Error('Failed to create school');

            const { school } = await res.json();
            message.success(`School "${school.name}" created!`);
            router.push('/admin/schools');
        } catch (err) {
            console.error(err);
            message.error('Could not create school');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-lg mx-auto">
            <Typography.Title level={2}>Create New School</Typography.Title>

            <Form layout="vertical" onFinish={onFinish}>
                <Form.Item
                    label="School Name"
                    name="name"
                    rules={[{ required: true, message: 'Please enter school name' }]}
                >
                    <Input placeholder="e.g. Poprad 2025" />
                </Form.Item>

                <Button type="primary" htmlType="submit" loading={loading}>
                    Create School
                </Button>
            </Form>
        </div>
    );
}
