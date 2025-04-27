'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Button, Table, Modal, Form, Input, DatePicker, InputNumber, message } from 'antd'
import dayjs from 'dayjs'

interface Term {
    _id: string
    title: string
    description?: string
    startDate: string
    endDate: string
    grade: number
}

export default function TermsPage() {
    const { school_id } = useParams<{ school_id: string }>()
    const [terms, setTerms] = useState<Term[]>([])
    const [loading, setLoading] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [form] = Form.useForm()

    const fetchTerms = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/schools/${school_id}/terms`, { credentials: 'include' })
            if (res.ok) {
                const data = await res.json()
                setTerms(data)
            } else {
                message.error('Failed to load terms')
            }
        } catch (error) {
            console.error(error)
            message.error('Error loading terms')
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchTerms()
    }, [school_id])

    const handleAddTerm = async () => {
        try {
            const values = await form.validateFields()

            const res = await fetch(`/api/schools/${school_id}/terms`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    title: values.title,
                    description: values.description,
                    startDate: values.startDate.toISOString(),
                    endDate: values.endDate.toISOString(),
                    grade: values.grade,
                }),
            })

            if (res.ok) {
                message.success('Term created successfully')
                setIsModalOpen(false)
                form.resetFields()
                fetchTerms()
            } else {
                const err = await res.text()
                message.error(`Failed to create term: ${err}`)
            }
        } catch (error) {
            console.error(error)
        }
    }

    const columns = [
        {
            title: 'Názov',
            dataIndex: 'title',
            key: 'title',
        },
        {
            title: 'Popis',
            dataIndex: 'description',
            key: 'description',
        },
        {
            title: 'Začiatok',
            dataIndex: 'startDate',
            key: 'startDate',
            render: (text: string) => dayjs(text).format('DD.MM.YYYY'),
        },
        {
            title: 'Koniec',
            dataIndex: 'endDate',
            key: 'endDate',
            render: (text: string) => dayjs(text).format('DD.MM.YYYY'),
        },
        {
            title: 'Ročník',
            dataIndex: 'grade',
            key: 'grade',
            render: (grade: number) => `${grade}. ročník`,
        },
    ]

    return (
        <div className="p-4">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Termíny školy</h1>
                <Button type="primary" onClick={() => setIsModalOpen(true)}>
                    Pridať termín
                </Button>
            </div>

            <Table
                dataSource={terms}
                columns={columns}
                rowKey="_id"
                loading={loading}
            />

            <Modal
                title="Pridať nový termín"
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                onOk={handleAddTerm}
                okText="Vytvoriť"
            >
                <Form layout="vertical" form={form}>
                    <Form.Item
                        name="title"
                        label="Názov termínu"
                        rules={[{ required: true, message: 'Zadajte názov' }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="description"
                        label="Popis (nepovinné)"
                    >
                        <Input.TextArea rows={2} />
                    </Form.Item>
                    <Form.Item
                        name="startDate"
                        label="Začiatok"
                        rules={[{ required: true, message: 'Zadajte dátum začiatku' }]}
                    >
                        <DatePicker style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item
                        name="endDate"
                        label="Koniec"
                        rules={[{ required: true, message: 'Zadajte dátum konca' }]}
                    >
                        <DatePicker style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item
                        name="grade"
                        label="Ročník"
                        rules={[{ required: true, message: 'Zadajte ročník' }]}
                    >
                        <InputNumber min={0} max={10} style={{ width: '100%' }} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}
