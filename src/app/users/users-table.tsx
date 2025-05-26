'use client'

import { useEffect, useState } from 'react'
import { Button, Card, Form, Input, Modal, Select, Table, Tag, Typography, message } from 'antd'
import {School} from "@/models/school";

type Member = {
    _id?: string
    role: string
    user: {
        first_name: string
        last_name: string
        email: string
    }
    school?: {
        name: string
    }
}

export default function UsersPageClient({
                                            school_id,
                                            isAdmin = false,
                                            initialUsers,
                                            schools = []
                                        }: {
    school_id?: string
    isAdmin?: boolean
    initialUsers?: Member[]
    schools?: School[]
}) {
    const [members, setMembers] = useState<Member[]>(initialUsers || [])
    const [loading, setLoading] = useState(!initialUsers)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [inviteToken, setInviteToken] = useState<string | null>(null)
    const [form] = Form.useForm()
    const role = Form.useWatch('role', form)

    const fetchMembers = async () => {
        if (!school_id) return
        setLoading(true)
        const res = await fetch(`/api/schools/${school_id}/members`, {
            credentials: 'include'
        })
        const data = await res.json()
        setMembers(data)
        setLoading(false)
    }

    useEffect(() => {
        if (!initialUsers) fetchMembers()
    }, [])

    const handleAddUser = async () => {
        try {
            const values = await form.validateFields()
            const payload = {
                ...values,
                ...(role !== 'admin' && school_id ? { school_id } : {}),
            }
            const res = await fetch(`/api/create_account/invite`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                const data = await res.json()
                setInviteToken(`${window.location.origin}/create_account/${data.token}`)
                message.success('Používateľ pridaný')
                setIsModalOpen(false)
                form.resetFields()
                if (!initialUsers) await fetchMembers()
            } else {
                const err = await res.text()
                message.error(`Chyba: ${err}`)
            }
        } catch (e) {
            console.error(e)
        }
    }

    const columns = [
        {
            title: 'Meno',
            key: 'name',
            render: (_: any, record: Member) =>
                `${record.user.first_name} ${record.user.last_name}`
        },
        {
            title: 'Email',
            dataIndex: ['user', 'email'],
            key: 'email'
        },
        {
            title: 'Rola',
            dataIndex: 'role',
            key: 'role',
            filters: [
                { text: 'Vedúci', value: 'leader' },
                { text: 'Animátor', value: 'animator' },
                { text: 'Študent', value: 'student' },
                isAdmin && {text: 'Administrador', value: 'administrador'}
            ],
            onFilter: (value: string, record: Member) => record.role === value,
            render: (role: string) => <Tag color="blue">{role}</Tag>
        },
        isAdmin && {
            title: 'Škola',
            dataIndex: ['school', 'name'],
            key: 'school',
            render: (text: string) => <span>{text}</span>
        }
    ].filter(Boolean)

    return (
        <>
            <Card
                title="Používatelia"
                loading={loading}
                extra={
                    <Button type="primary" onClick={() => setIsModalOpen(true)}>
                        Pridať používateľa
                    </Button>
                }
            >
                <Table
                    columns={columns as any}
                    dataSource={members}
                    rowKey={(r) => r._id?.toString() || `${r.user.email}-${r.role}`}
                />
            </Card>

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
                    <Form.Item name="first_name" label="Meno" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="last_name" label="Priezvisko" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>



                    <Form.Item name="role" label="Rola" rules={[{ required: true }]}>
                        <Select placeholder="Vyber rolu">
                            <Select.Option value="leader">Leader</Select.Option>
                            <Select.Option value="animator">Animator</Select.Option>
                            <Select.Option value="student">Študent</Select.Option>
                            {isAdmin && <Select.Option value="admin">Administrátor</Select.Option>}
                        </Select>
                    </Form.Item>
                    {isAdmin && role !== 'admin' && (
                        <Form.Item
                            name="school_id"
                            label="Škola"
                            rules={[{ required: true, message: 'Zvoľ školu' }]}
                        >
                            <Select placeholder="Vyber školu">
                                {schools.map((school) => (
                                    <Select.Option key={school._id.toString()} value={school._id}>
                                        {school.name}
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                    )}
                </Form>
            </Modal>

            <Modal
                title="Pozvánka pre používateľa"
                open={!!inviteToken}
                onCancel={() => setInviteToken(null)}
                footer={null}
                centered
            >
                {inviteToken && (
                    <>
                        <Typography.Text>
                            Pošli tento link pozvanému animátorovi/vedúcemu:
                        </Typography.Text>
                        <Typography.Paragraph copyable={{ text: inviteToken }}>
                            {inviteToken}
                        </Typography.Paragraph>
                    </>
                )}
            </Modal>
        </>
    )
}
