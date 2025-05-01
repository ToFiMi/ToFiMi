'use client'

import { useState } from 'react'
import { Table, Modal, Form, Input, Select, Button, message } from 'antd'

export interface User {
    _id: string
    role: string
    user_info: {
        first_name: string
        last_name: string
        email: string
    }
}

export default function SchoolUsers({ schoolId, initialUsers }: { schoolId: string, initialUsers: User[] }) {
    const [users, setUsers] = useState<User[]>(initialUsers)
    const [loading, setLoading] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [form] = Form.useForm()

    const fetchUsers = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/schools/${schoolId}`, { credentials: 'include' })
            if (res.ok) {
                const data = await res.json()
                setUsers(data.users)
            }
        } catch (error) {
            console.error(error)
        }
        setLoading(false)
    }

    const handleAddUser = async () => {
        try {
            const values = await form.validateFields()
            const res = await fetch(`/api/schools/${schoolId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(values),
            })
            if (res.ok) {
                message.success('Používateľ pridaný')
                setIsModalOpen(false)
                form.resetFields()
                fetchUsers()
            } else {
                const err = await res.text()
                message.error(`Chyba: ${err}`)
            }
        } catch (error) {
            console.error(error)
        }
    }

    const columns = [
        {
            title: 'Meno',
            key: 'first_name',
            render: (_: any, record: User) => `${record.user_info.first_name} ${record.user_info.last_name}`,
        },
        {
            title: 'Email',
            dataIndex: ['user_info', 'email'],
            key: 'email',
        },
        {
            title: 'Rola',
            dataIndex: 'role',
            key: 'role',
        },
    ]

    return (
        <div>
            <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-semibold">Používatelia</h2>
                <Button type="primary" onClick={() => setIsModalOpen(true)}>
                    Pridať používateľa
                </Button>
            </div>

            <Table dataSource={users} columns={columns} rowKey="_id" loading={loading} />
            <Modal
                title="Pridať používateľa"
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                onOk={() => form.submit()}
                okText="Pridať"
            >
            <Form layout="vertical" form={form} onFinish={handleAddUser}>
                <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
                    <Input />
                </Form.Item>
                <Form.Item name="role" label="Rola" rules={[{ required: true }]}>
                    <Select>
                        <Select.Option value="admin">Admin</Select.Option>
                        <Select.Option value="leader">Leader</Select.Option>
                        <Select.Option value="animator">Animator</Select.Option>
                        <Select.Option value="student">Študent</Select.Option>
                    </Select>
                </Form.Item>
            </Form>
            </Modal>


        </div>
    )
}
