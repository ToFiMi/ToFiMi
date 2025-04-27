'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Button, Table, Modal, Form, Input, Select, message } from 'antd'

interface User {
    _id: string
    role: string
    user_info: {
        first_name: string
        last_name: string
        email: string
    }
}

interface School {
    _id: string
    name: string
    slug: string
}

export default function SchoolDetailPage() {
    const { school_id } = useParams<{ school_id: string }>()
    const [school, setSchool] = useState<School | null>(null)
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [form] = Form.useForm()

    const fetchData = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/schools/${school_id}`, { credentials: 'include' })
            if (res.ok) {
                const data = await res.json()
                setSchool(data.school)
                setUsers(data.users)
            } else {
                message.error('Failed to load school')
            }
        } catch (error) {
            console.error(error)
            message.error('Error loading school')
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchData()
    }, [school_id])

    const handleAddUser = async () => {
        try {
            const values = await form.validateFields()
            const res = await fetch(`/api/schools/${school_id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(values),
            })
            if (res.ok) {
                message.success('User assigned successfully')
                setIsModalOpen(false)
                form.resetFields()
                fetchData()
            } else {
                const err = await res.text()
                message.error(`Failed to assign user: ${err}`)
            }
        } catch (error) {
            console.error(error)
        }
    }

    const columns = [
        {
            title: 'Meno',
            dataIndex: ['user_info', 'first_name'],
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
        <div className="p-4">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">{school?.name || 'Škola'}</h1>
                <Button type="primary" onClick={() => setIsModalOpen(true)}>
                    Pridať používateľa
                </Button>
            </div>

            <div className="mb-6">
                <p><strong>Slug:</strong> {school?.slug}</p>
                <p><strong>ID školy:</strong> {school?._id}</p>
            </div>

            <h2 className="text-xl font-semibold mb-2">Používatelia</h2>
            <Table
                dataSource={users}
                columns={columns}
                rowKey="_id"
                loading={loading}
            />

            <Modal
                title="Pridať používateľa"
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                onOk={handleAddUser}
                okText="Pridať"
            >
                <Form layout="vertical" form={form}>
                    <Form.Item
                        name="email"
                        label="Email používateľa"
                        rules={[{ required: true, message: 'Zadajte email' }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="role"
                        label="Rola"
                        rules={[{ required: true, message: 'Vyberte rolu' }]}
                    >
                        <Select>
                            <Select.Option value="admin">Admin</Select.Option>
                            <Select.Option value="leader">Leader</Select.Option>
                            <Select.Option value="animator">Animator</Select.Option>
                            <Select.Option value="student">Student</Select.Option>
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}
