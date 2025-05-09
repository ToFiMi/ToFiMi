'use client'

import {useState} from 'react'
import {signIn} from 'next-auth/react'
import {useRouter} from 'next/navigation'
import {Button, Card, Form, Input, message, Typography} from 'antd'

const {Title} = Typography

export default function LoginPage() {
    const [loading, setLoading] = useState(false)
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
            router.push("/");
        } else {
            message.error('Neplatný email alebo heslo')
        }

        setLoading(false)
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
            <Card style={{width: 400}}>
                <Title level={2} style={{textAlign: 'center'}}>Prihlásenie</Title>
                <Form layout="vertical" onFinish={onFinish}>
                    <Form.Item
                        label="Email"
                        name="email"
                        rules={[{required: true, message: 'Zadajte email'}]}
                    >
                        <Input/>
                    </Form.Item>
                    <Form.Item
                        label="Heslo"
                        name="password"
                        rules={[{required: true, message: 'Zadajte heslo'}]}
                    >
                        <Input.Password/>
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading} block>
                            Prihlásiť sa
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    )
}
