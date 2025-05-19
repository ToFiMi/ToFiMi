'use client'

import {Button, Card, Form, Input, List, message, Modal, Select, Table, Typography} from 'antd'
import { useEffect, useState } from 'react'
import {useParams} from "next/navigation";

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
    const [inviteToken, setInviteToken] = useState<string | null>(null)

    const handleAddUser = async () => {
        try {
            const values = await form.validateFields()

            // Pridaj používateľa a získaš token
            const res = await fetch(`/api/create_account/invite`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(values),
            })

            if (res.ok) {
                const data = await res.json()
                setInviteToken(`${window.location.href}/create_account/${data.token}`)

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

    const columns = [
        {
            title: 'Meno',
            key: 'name',
            render: (_: any, record: Member) => `${record.user.first_name} ${record.user.last_name}`,
        },
        {
            title: 'Email',
            dataIndex: ['user', 'email'],
            key: 'email',
        },
        {
            title: 'Rola',
            dataIndex: 'role',
            key: 'role',
        },
    ]

// todo: update aj delete users
    return (
        <><Card title="Členovia školy" loading={loading} extra={
            <Button type="primary" onClick={() => setIsModalOpen(true)}>
                Pridať používateľa
            </Button>
        }>


            <Table dataSource={members} columns={columns} rowKey={(rec, i) => String(i)} />
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
                        <Select.Option value="leader">Leader</Select.Option>
                        <Select.Option value="animator">Animator</Select.Option>
                        <Select.Option value="student">Študent</Select.Option>
                    </Select>
                </Form.Item>
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
                        <Typography.Text>Pošli tento link pozvanému animátorovi/vedúcemu:</Typography.Text>
                        <Typography.Paragraph copyable={{ text: inviteToken }}>
                            {inviteToken}
                        </Typography.Paragraph>
                    </>
                )}
            </Modal></>
    )
}
