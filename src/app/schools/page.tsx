'use client'

import { useEffect, useState } from 'react'
import { Button, Table, Modal, Form, Input, message } from 'antd'
import {useRouter} from "next/navigation";

interface School {
    _id: string
    name: string
    slug: string
    createdAt: string
}

export default function SchoolsPage() {
    const [schools, setSchools] = useState<School[]>([])
    const [loading, setLoading] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [form] = Form.useForm()

    const fetchSchools = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/schools', { credentials: 'include' })
            if (res.ok) {
                const data = await res.json()
                setSchools(data)
            } else {
                message.error('Failed to load schools')
            }
        } catch (error) {
            console.error(error)
            message.error('Error loading schools')
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchSchools()
    }, [])

    const handleAddSchool = async () => {
        try {
            const values = await form.validateFields()

            const res = await fetch('/api/schools', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(values),
            })

            if (res.ok) {
                message.success('School created successfully')
                setIsModalOpen(false)
                form.resetFields()
                fetchSchools()
            } else {
                const err = await res.text()
                message.error(`Failed to create school: ${err}`)
            }
        } catch (error) {
            console.error(error)
        }
    }

    const columns = [
        {
            title: 'Názov školy',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Slug',
            dataIndex: 'slug',
            key: 'slug',
        },
        {
            title: 'Vytvorená',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (text: string) => new Date(text).toLocaleDateString(),
        },
    ]
    const router = useRouter()

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Školy</h1>
                <Button type="primary" onClick={() => setIsModalOpen(true)}>
                    Pridať školu
                </Button>
            </div>

            <Table
                dataSource={schools}
                columns={columns}
                rowKey="_id"
                loading={loading}
                onRow={(record) => {
                    return {
                        onClick: () => {
                            router.push(`/schools/${record._id}`)
                        },
                        style: { cursor: 'pointer' }
                    }
                }}
            />

            <Modal
                title="Pridať novú školu"
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                onOk={handleAddSchool}
                okText="Vytvoriť"
            >
                <Form layout="vertical" form={form}>
                    <Form.Item
                        name="name"
                        label="Názov školy"
                        rules={[{ required: true, message: 'Zadajte názov školy' }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="slug"
                        label="Slug"
                        rules={[{ required: true, message: 'Zadajte slug' }]}
                    >
                        <Input />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}
