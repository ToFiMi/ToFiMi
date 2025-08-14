'use client'

import {useEffect, useState} from 'react'
import {Button, Card, Form, Input, message, Modal, Select, Table, Tag, Typography, Space} from 'antd'
import {EyeOutlined} from '@ant-design/icons'
import {School} from "@/models/school";
import UserOverviewCard from "@/componets/user-overview-card";

type Member = {
    _id?: string
    role: string
    user_id?: string
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
                                            schools = [],
                                            userRole
                                        }: {
    school_id?: string
    isAdmin?: boolean
    initialUsers?: Member[]
    schools?: School[]
    userRole: string
}) {
    const [members, setMembers] = useState<Member[]>(initialUsers || [])
    const [loading, setLoading] = useState(!initialUsers)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [inviteToken, setInviteToken] = useState<string | null>(null)
    const [userOverviewModal, setUserOverviewModal] = useState<{visible: boolean, userId: string}>({ visible: false, userId: '' })
    const [form] = Form.useForm()
    const role = Form.useWatch('role', form)

    const fetchMembers = async () => {
        let url = ""

        if ( isAdmin) {
            url = `/api/users`
        } else {
            url = `/api/schools/${school_id}/members`
        }

        setLoading(true)
        const res = await fetch(url, {
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
            const form_school_id = values.school_id !== "null" ? values.school_id : undefined
            const payload = {
                ...values,
                school_id: form_school_id || school_id,
            }
            const res = await fetch(`/api/create_account/invite`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
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
    const handleDeactivate = async (member: Member) => {
        if (!member._id) return;

        try {
            const res = await fetch(`/api/users/?user_id=${member._id.toString()}`, {
                method: 'DELETE',
                headers: {'Content-Type': 'application/json'},
                credentials: 'include'
            })

            if (res.ok) {
                message.success('Používateľ deaktivovaný')
                await fetchMembers()
            } else {
                const err = await res.text()
                message.error(`Chyba: ${err}`)
            }
        } catch (e) {
            console.error(e)
            message.error('Nepodarilo sa deaktivovať používateľa')
        }
    }

    const columns = [
        {
            title: 'Meno',
            key: 'name',
            render: (_: any, record: Member) =>
                `${record.user?.first_name} ${record.user?.last_name}`
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
                {text: 'Vedúci', value: 'leader'},
                {text: 'Animátor', value: 'animator'},
                {text: 'Študent', value: 'user'},
                isAdmin && {text: 'Administrador', value: 'administrador'}
            ].filter(Boolean),
            onFilter: (value: string, record: Member) => record.role === value,
            render: (role: string) => <Tag color="blue">{role}</Tag>
        },
        isAdmin && {
            title: 'Škola',
            dataIndex: ['school', 'name'],
            key: 'school',
            render: (text: string) => <span>{text}</span>
        },
        (isAdmin || userRole === "leader" || userRole === "animator") && {
            title: 'Akcia',
            key: 'action',
            render: (_: any, record: Member) => {
                return (
                    <Space>
                        {(userRole === "leader" || userRole === "animator") && !isAdmin && (
                            <Button
                                type="primary"
                                ghost
                                size="small"
                                icon={<EyeOutlined />}
                            onClick={() => setUserOverviewModal({ visible: true, userId: record.user_id || '' })}
                            >
                                Prehľad
                            </Button>
                        )}
                        {(isAdmin || userRole === "leader") && (
                            <Button
                                danger
                                size="small"
                                onClick={() => handleDeactivate(record)}
                            >
                                Deaktivovať
                            </Button>
                        )}
                    </Space>
                )
            }
        }
    ].filter(Boolean)

    return (
        <>
            <Card
                title="Používatelia"
                loading={loading}
                extra={userRole === "user" ? <></> :
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
                    <Form.Item name="email" label="Email" rules={[{required: true, type: 'email'}]}>
                        <Input/>
                    </Form.Item>
                    <Form.Item name="first_name" label="Meno" rules={[{required: true}]}>
                        <Input/>
                    </Form.Item>
                    <Form.Item name="last_name" label="Priezvisko" rules={[{required: true}]}>
                        <Input/>
                    </Form.Item>


                    <Form.Item name="role" label="Rola" rules={[{required: true}]}>
                        <Select placeholder="Vyber rolu">
                            <Select.Option value="leader">Leader</Select.Option>
                            <Select.Option value="animator">Animator</Select.Option>
                            <Select.Option value="user">Študent</Select.Option>
                            {isAdmin && <Select.Option value="admin">Administrátor</Select.Option>}
                        </Select>
                    </Form.Item>
                    {isAdmin && role !== 'admin' && (
                        <Form.Item
                            name="school_id"
                            label="Škola"
                            rules={[{required: true, message: 'Zvoľ školu'}]}
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
                        <Typography.Paragraph copyable={{text: inviteToken}}>
                            {inviteToken}
                        </Typography.Paragraph>
                    </>
                )}
            </Modal>

            <UserOverviewCard
                userId={userOverviewModal.userId}
                visible={userOverviewModal.visible}
                onClose={() => setUserOverviewModal({ visible: false, userId: '' })}
            />
        </>
    )
}
