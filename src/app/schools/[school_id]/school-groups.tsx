'use client'

import {useEffect, useState} from 'react'
import {Button, Form, Input, message, Modal, Popconfirm, Select, Table,} from 'antd'
import {DeleteOutlined} from '@ant-design/icons'

interface Group {
    _id: string
    name: string
    school_id: string
    animators: string[]
    created: string
}

export default function SchoolGroups({schoolId, hide_add_group = false}: {
    schoolId: string,
    hide_add_group: boolean
}) {
    const [groups, setGroups] = useState<Group[]>([])
    const [loading, setLoading] = useState(false)

    const [createModalOpen, setCreateModalOpen] = useState(false)
    const [editModalOpen, setEditModalOpen] = useState(false)
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
    const [userOptions, setUserOptions] = useState([])
    const [users, setUsers] = useState([])
    const [groupUsers, setGroupUsers] = useState<{ name: string, email: string, _id: string, role: string }[]>([])
    const [participants, setParticipants] = useState<string[]>([])

    const [form] = Form.useForm()
    const [editForm] = Form.useForm()

    const fetchGroups = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/schools/${schoolId}/groups`)
            if (res.ok) {
                const data = await res.json()
                setGroups(data)
            } else {
                message.error('Nepodarilo sa načítať skupiny')
            }
        } catch (err) {
            console.error(err)
            message.error('Chyba pri načítaní skupín')
        }
        setLoading(false)
    }

    useEffect(() => {
        Promise.all([
            fetchGroups(),
            fetchUsers()
        ])

    }, [schoolId])
    useEffect(() => {
        if (selectedGroup && userOptions.length > 0) {
            editForm.setFieldsValue({
                name: selectedGroup.name,
                animators: selectedGroup.animators?.filter((id: string) =>
                    userOptions.some(option => option.value === id)
                ) || [],
            })

            const relatedParticipants = users
                .filter(u => u.group_id === selectedGroup._id && u.role === 'participant')
                .map(u => u.user._id)

            setParticipants(relatedParticipants)
        }
    }, [selectedGroup, userOptions])

    const handleCreateGroup = async () => {
        try {
            const values = await form.validateFields()

            const res = await fetch(`/api/schools/${schoolId}/groups`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify([{
                    name: values.name,
                    school_id: schoolId,
                }]),
            })

            if (res.ok) {
                message.success('Skupina vytvorená')
                setCreateModalOpen(false)
                form.resetFields()
                fetchGroups()
            } else {
                const err = await res.text()
                message.error(`Chyba pri vytváraní: ${err}`)
            }
        } catch (e) {
            console.error(e)
        }
    }

    const handleEditGroup = async () => {
        try {
            const values = await editForm.validateFields()

            const res = await fetch(`/api/schools/${schoolId}/groups`, {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                    groupId: selectedGroup?._id,
                    name: values.name,
                    animators: values.animators,
                    participants,
                }),
            })

            if (res.ok) {
                message.success('Skupina upravená')
                setEditModalOpen(false)
                setSelectedGroup(null)
                editForm.resetFields()
                fetchGroups()
                fetchUsers()
            } else {
                const err = await res.text()
                message.error(`Chyba pri úprave: ${err}`)
            }
        } catch (e) {
            console.error(e)
        }
    }

    const columns = [
        {
            title: 'Názov skupiny',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: '',
            key: 'edit',
            render: (_: any, record: Group) => (
                <Button
                    type="link"
                    onClick={() => {
                        setSelectedGroup(record)
                        handleFilterUsersByGroup(record._id)
                        editForm.setFieldsValue({
                            name: record.name,
                            animators: record.animators?.map((id: string) => id) || [],
                        })
                        setEditModalOpen(true)
                    }}
                >
                    Upraviť
                </Button>
            ),
        },
        {
            title: '',
            key: 'action',
            width: 40,
            render: (_: any, record: Group) => (
                <Popconfirm
                    title="Naozaj chceš zmazať túto skupinu?"
                    onConfirm={() => handleDelete(record._id)}
                    okText="Áno"
                    cancelText="Nie"
                >
                    <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined/>}
                        onClick={(e) => e.stopPropagation()}
                    />
                </Popconfirm>
            ),
        },
    ]

    const fetchUsers = async () => {
        const res = await fetch(`/api/users`)
        if (res.ok) {
            const data = await res.json()

            setUsers(data)
            console.log(data)
            setUserOptions(
                data.map((user: any) => {
                    const fullName = `${user.user.first_name} ${user.user.last_name}`.trim()
                    return {
                        role: user.role,
                        group_id: user.group_id,
                        label:   fullName + " (" + user.user.email + ")" || user.user.email,
                        value: user.user._id,
                    }
                })
            )
        }
    }

    const handleDelete = async (selectedGroupId: string) => {
        await fetch(`/api/schools/${schoolId}/groups`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                groupId: selectedGroupId,
            }),
        })
    }
    const handleFilterUsersByGroup = (groupId: string) => {
        const groupUsers = users.filter((user) => user.group_id === groupId)

        setGroupUsers(groupUsers.map((user) => ({
            email: user.user.email,
            name: `${user.user.first_name} ${user.user.last_name}`.trim(),
            _id: user.user._id,
            role: user.role
        })))
    }
const removeUser = async (userIdToRemove:string)=>{
    await fetch(`/api/schools/${schoolId}/groups`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            groupId: selectedGroup._id,
            user_id: userIdToRemove,
        }),
    })
}


    return (
        <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Skupinky</h2>
                {!hide_add_group && <Button onClick={() => setCreateModalOpen(true)}>Pridať skupinu</Button>}
            </div>

            <Table
                dataSource={groups}
                columns={columns}
                rowKey="_id"
                loading={loading}
            />

            <Modal
                title="Nová skupina"
                open={createModalOpen}
                onCancel={() => setCreateModalOpen(false)}
                onOk={handleCreateGroup}
                okText="Vytvoriť"
            >
                <Form layout="vertical" form={form}>
                    <Form.Item
                        name="name"
                        label="Názov skupiny"
                        rules={[{required: true, message: 'Zadajte názov skupiny'}]}
                    >
                        <Input/>
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title="Upraviť skupinu"
                open={editModalOpen}
                onCancel={() => setEditModalOpen(false)}
                onOk={handleEditGroup}
                okText="Uložiť"
            >
                <Form layout="vertical" form={editForm}>
                    <Form.Item
                        name="name"
                        label="Názov skupiny"
                        rules={[{required: true, message: 'Zadajte názov skupiny'}]}
                    >
                        <Input/>
                    </Form.Item>

                    <Form.Item name="animators" label="Animátori">
                        <Select
                            mode="multiple"
                            showSearch
                            placeholder="Vyhľadaj používateľa"
                            filterOption={(input, option) =>
                                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                            }
                            options={userOptions.filter((user)=> user.role === "animator" ||user.role === "leader")}
                        />
                    </Form.Item>
                    <Form.Item label="Účastníci">
                        <Select
                            showSearch
                            placeholder="Vyhľadaj účastníka"
                            filterOption={(input, option) =>
                                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                            }
                            options={userOptions
                                .filter(user => user.role === "user")
                                .filter(user => !user.group_id)
                                .filter(user => !groupUsers.some(g => g._id === user.value))
                                .filter(user => !participants.includes(user.value))
                            }
                            onSelect={async (value: string) => {
                                if (!participants.includes(value) && selectedGroup?._id) {
                                    const updated = [...participants, value]
                                    setParticipants(updated)

                                    const found = userOptions.find(u => u.value === value)
                                    if (found) {
                                        setGroupUsers(prev => [
                                            ...prev,
                                            {
                                                email: found.label?.match(/\(([^)]+)\)/)?.[1] || '',
                                                name: found.label?.split(' (')[0],
                                                _id: value,
                                                role: 'user'
                                            }
                                        ])
                                    }

                                    // 🎯 Zavolanie API na priradenie nového používateľa do skupiny
                                    try {
                                        const res = await fetch(`/api/schools/${schoolId}/groups`, {
                                            method: 'PUT',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                groupId: selectedGroup._id,
                                                participants: updated
                                            }),
                                        })

                                        if (!res.ok) {
                                            const error = await res.text()
                                            message.error(`Chyba pri priradení účastníka: ${error}`)
                                        }
                                    } catch (err) {
                                        console.error(err)
                                        message.error("Chyba pripojenia pri priradení účastníka")
                                    }
                                }
                            }}
                        />
                    </Form.Item>

                </Form>

                <Table
                    dataSource={groupUsers}
                    columns={[
                        { title: 'Používateľ', dataIndex: 'email', key: 'email' },
                        { title: 'Meno', dataIndex: 'name', key: 'name' },

                        {
                            title: '',
                            key: 'remove',
                            render: (_: any, record) =>
                                record.role === 'user' && (
                                    <Button
                                        type="link"
                                        size="small"
                                        danger
                                        onClick={() => {
                                            removeUser(record._id)
                                            setParticipants(participants.filter(id => id !== record._id))
                                            setGroupUsers(groupUsers.filter(u => u._id !== record._id))
                                        }}
                                    >
                                        ❌
                                    </Button>
                                )
                        }
                    ]}
                    rowKey="_id"
                />
            </Modal>
        </div>


    )
}
