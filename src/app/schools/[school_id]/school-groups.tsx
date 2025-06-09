'use client'

import { useEffect, useState } from 'react'
import {
    Button,
    Form,
    Input,
    message,
    Modal, Select,
    Table,
} from 'antd'
import {debounce} from "lodash";

interface Group {
    _id: string
    name: string
    school_id: string
    animators:string[]
    created: string
}

export default function SchoolGroups({ schoolId }: { schoolId: string }) {
    const [groups, setGroups] = useState<Group[]>([])
    const [loading, setLoading] = useState(false)

    const [createModalOpen, setCreateModalOpen] = useState(false)
    const [editModalOpen, setEditModalOpen] = useState(false)
    const [selectedGroup, setSelectedGroup] = useState<Group | null>(null)
    const [userOptions, setUserOptions] = useState([])

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
        fetchGroups()
    }, [schoolId])

    const handleCreateGroup = async () => {
        try {
            const values = await form.validateFields()

            const res = await fetch(`/api/groups`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: values.name,
                    school_id: schoolId,
                }),
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
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    groupId: selectedGroup?._id,
                    name: values.name,
                    animators: values.animators,
                }),
            })

            if (res.ok) {
                message.success('Skupina upravená')
                setEditModalOpen(false)
                setSelectedGroup(null)
                editForm.resetFields()
                fetchGroups()
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
            title: 'Vytvorená',
            dataIndex: 'created',
            key: 'created',
            render: (text: string) => new Date(text).toLocaleDateString(),
        },
    ]
    const debouncedSearch = debounce(async (value: string) => {
        if (value.length < 3) return
        const res = await fetch(`/api/users?autocomplete=1&query=${value}&school_id=${schoolId}`)
        if (res.ok) {
            const data = await res.json()
            setUserOptions(data.map((u: any) => ({
                label: `${u.user.first_name} ${u.user.last_name} (${u.user.email})`,
                value: u._id
            })))
        }
    }, 300)

    return (
        <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Skupinky</h2>
                <Button onClick={() => setCreateModalOpen(true)}>Pridať skupinu</Button>
            </div>

            <Table
                dataSource={groups}
                columns={columns}
                rowKey="_id"
                loading={loading}
                onRow={(record) => ({
                    onClick: () => {
                        setSelectedGroup(record)
                        editForm.setFieldsValue({
                            name: record.name,
                            animators: record.animators?.map((id: string) => id) || [],
                        })
                        setEditModalOpen(true)
                    },
                    style: { cursor: 'pointer' }
                })}
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
                        rules={[{ required: true, message: 'Zadajte názov skupiny' }]}
                    >
                        <Input />
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
                        rules={[{ required: true, message: 'Zadajte názov skupiny' }]}
                    >
                        <Input />
                    </Form.Item>

                        <Form.Item name="animators" label="Animátori">
                            <Select
                                mode="multiple"
                                showSearch
                                placeholder="Vyhľadaj používateľa"
                                filterOption={false}
                                onSearch={debouncedSearch}
                                options={userOptions}
                            />
                        </Form.Item>

                </Form>
            </Modal>
        </div>
    )
}
