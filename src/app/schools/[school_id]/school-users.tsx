'use client'
import { debounce } from 'lodash'
import { useState } from 'react'
import { Table, Modal, Form, Input, Select, Button, message, Typography, Space } from 'antd'
import {User as UserModel} from "@/models/user"

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
    const [emailOptions, setEmailOptions] = useState<UserModel[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [showDropdown, setShowDropdown] = useState(false)
    const [inviteUrl, setInviteUrl] = useState<string | null>(null)

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

    const updateUser = async () =>{
        await fetch('/api/users', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                first_name: 'Filip',
                last_name: 'Vnenčák',
                email: 'filip@zooza.sk'
            })
        })
    }

    const handleAddUser = async () => {
        try {
            const values = await form.validateFields()
            const res = await fetch(`/api/create_account/invite`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ ...values, school_id: schoolId }),
            })

            if (res.ok) {
                const data = await res.json()
                if(data.token) {
                    setInviteUrl(`${window.location.protocol}//${window.location.host}/create_account/${data.token}`)
                    message.success('Pozvánka bola vygenerovaná')
                }
                else message.success(data.message)

                form.resetFields()
                await fetchUsers()
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
    const handleSearch = async (value: string) => {
        setSearchTerm(value)
        if (value.length > 3 && value.includes('@')) {
            setLoading(true)
            try {
                const res = await fetch(`/api/users?autocomplete=1&query=${encodeURIComponent(value)}`, {
                    credentials: 'include',
                })
                if (res.ok) {
                    const data = await res.json()
                    setEmailOptions(data)
                    setShowDropdown(true)
                } else {
                    setEmailOptions([])
                }
            } catch (e) {
                message.error('Chyba pri načítaní používateľov')
            } finally {
                setLoading(false)
            }
        } else {
            setShowDropdown(false)
        }
    }

    const handleSelect = (email: string, option: UserModel) => {
        form.setFieldsValue({
            email,
            first_name: option.first_name || '',
            last_name: option.last_name || '',
        })
        setSearchTerm(email)
        setShowDropdown(false)
    }

    return (
        <>
            <div className="flex justify-between items-center mb-2">
                <Typography.Title level={4}>Používatelia</Typography.Title>
                <Button type="primary" onClick={() => setIsModalOpen(true)}>
                    Pridať používateľa
                </Button>
            </div>

            <Table dataSource={users} columns={columns} rowKey="_id" loading={loading} />

            <Modal
                title="Pozvať používateľa"
                open={isModalOpen}
                onCancel={() => {
                    setIsModalOpen(false)
                    setInviteUrl(null)
                }}
                onOk={() => form.submit()}
                okText="Vytvoriť pozvánku"
            >
                <Form layout="vertical" form={form} onFinish={handleAddUser}>
                    <Form.Item
                        name="email"
                        label="Email"
                        rules={[
                            { required: true, message: 'Zadajte email' },
                            { type: 'email', message: 'Neplatný formát emailu' },
                        ]}
                    >
                        <>
                            <Input
                                autoComplete="off"
                                value={searchTerm}
                                type={"email"}
                                onChange={(e) => {
                                    const value = e.target.value
                                    setSearchTerm(value)
                                    form.setFieldsValue({ email: value })
                                    handleSearch(value)
                                }}
                                placeholder="Zadajte email"
                            />
                            {showDropdown && emailOptions.length > 0 && (
                                <div
                                    style={{
                                        position: 'absolute',
                                        backgroundColor: '#fff',
                                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                                        zIndex: 1000,
                                        width: '100%',
                                        maxHeight: 200,
                                        overflowY: 'auto',
                                        borderRadius: 4,
                                        marginTop: 4,
                                        padding: 4,
                                    }}
                                >
                                    {emailOptions.map((opt) => (
                                        <div
                                            key={ Number(opt._id)}
                                            style={{
                                                padding: '8px 12px',
                                                cursor: 'pointer',
                                                borderRadius: 4,
                                            }}
                                            onMouseDown={() => handleSelect(opt.email, opt)}
                                        >
                                            <p>{opt.first_name + " "  + opt.last_name + " (" + opt.email+ ")"  }</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    </Form.Item>
                    <Form.Item name="first_name" label="Meno" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="last_name" label="Priezvisko" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="role" label="Rola" rules={[{ required: true }]}>
                        <Select>
                            <Select.Option value="leader">Leader</Select.Option>
                            <Select.Option value="animator">Animator</Select.Option>
                            <Select.Option value="user">Študent</Select.Option>
                        </Select>
                    </Form.Item>
                </Form>

                {inviteUrl && (
                    <Space direction="vertical" style={{ marginTop: 16 }}>
                        <Typography.Text strong>Registračný link:</Typography.Text>
                        <Typography.Text copyable>{inviteUrl}</Typography.Text>
                    </Space>
                )}
            </Modal>
        </>
    )
}
