'use client'

import {Button, Card, Form, Input, List, message, Modal, Select, Typography} from 'antd'
import { useEffect, useState } from 'react'

type Member = {
    role: string
    user: {
        first_name: string
        last_name: string
        email: string
    }
}

export default function Members({school_id}: {school_id?: string }) {
    const [members, setMembers] = useState<Member[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [form] = Form.useForm()
    async function fetchMembers() {
        const res = await fetch(`/api/schools/${school_id}/members`, {
            credentials: 'include',
        })
        const data = await res.json()
        setMembers(data)
        setLoading(false)
    }

    useEffect(() => {

        fetchMembers()
    }, [])
    const handleAddUser = async () => {
        try {
            const values = await form.validateFields()
            const res = await fetch(`/api/schools/${school_id}/members`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(values),
            })
            if (res.ok) {
                message.success('Používateľ pridaný')
                setIsModalOpen(false)
                form.resetFields()
                await fetchMembers()
            } else {
                const err = await res.text()
                message.error(`Chyba: ${err}`)
            }
        } catch (error) {
            console.error(error)
        }
    }

    return (
        <><Card title="Členovia školy" loading={loading}>
            <Button type="primary" onClick={() => setIsModalOpen(true)}>
                Pridať používateľa
            </Button>
            <List
                dataSource={members}
                renderItem={(member) => (
                    <List.Item>
                        <Typography.Text strong>
                            {member.user.first_name} {member.user.last_name}
                        </Typography.Text>{' '}
                        – {member.user.email} ({member.role})
                    </List.Item>
                )}/>
        </Card><Modal
            title="Pridať používateľa"
            open={isModalOpen}
            onCancel={() => setIsModalOpen(false)}
            onOk={() => form.submit()}
            okText="Pridať"
        >
            <Form layout="vertical" form={form} onFinish={handleAddUser}>
                <Form.Item name="email" label="Email" rules={[{required: true, type: 'email'}]}>
                    <Input/>
                </Form.Item>
                <Form.Item name="first_name" label="Meno" rules={[{required: true, type: 'string'}]}>
                    <Input/>
                </Form.Item>
                <Form.Item name="last_name" label="Priezvisko" rules={[{required: true, type: 'string'}]}>
                    <Input/>
                </Form.Item>
                <Form.Item name="role" label="Rola" rules={[{required: true}]}>
                    <Select>
                        <Select.Option value="admin">Admin</Select.Option>
                        <Select.Option value="leader">Leader</Select.Option>
                        <Select.Option value="animator">Animator</Select.Option>
                        <Select.Option value="student">Študent</Select.Option>
                    </Select>
                </Form.Item>
            </Form>
        </Modal></>
    )
}
