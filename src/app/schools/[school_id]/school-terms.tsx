'use client'

import {useEffect, useState} from 'react'
import {Button, DatePicker, Form, Input, InputNumber, message, Modal, Table} from 'antd'
import dayjs from 'dayjs'

interface Term {
    _id: string
    title: string
    description?: string
    startDate: string
    endDate: string
    grade: number
}

export default function SchoolTerms({schoolId}: { schoolId: string }) {
    const [terms, setTerms] = useState<Term[]>([])
    const [loading, setLoading] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [form] = Form.useForm()

    const fetchTerms = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/schools/${schoolId}/terms`, {credentials: 'include'})
            if (res.ok) {
                const data = await res.json()
                setTerms(data)
            } else {
                message.error('Nepodarilo sa načítať termíny')
            }
        } catch (error) {
            console.error(error)
            message.error('Chyba pri načítavaní termínov')
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchTerms()
    }, [schoolId])

    const handleAddTerm = async () => {
        try {
            const values = await form.validateFields()
            const res = await fetch(`/api/schools/${schoolId}/terms`, {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                credentials: 'include',
                body: JSON.stringify({
                    title: values.title,
                    description: values.description,
                    startDate: values.startDate.toISOString(),
                    endDate: values.endDate.toISOString(),
                    grade: values.grade,
                })
            })
            if (res.ok) {
                message.success('Termín bol pridaný')
                setIsModalOpen(false)
                form.resetFields()
                fetchTerms()
            } else {
                const err = await res.text()
                message.error(`Chyba: ${err}`)
            }
        } catch (error) {
            console.error(error)
        }
    }

    const columns = [
        {title: 'Názov', dataIndex: 'title', key: 'title'},
        {title: 'Popis', dataIndex: 'description', key: 'description'},
        {
            title: 'Začiatok',
            dataIndex: 'startDate',
            key: 'startDate',
            render: (d: string) => dayjs(d).format('DD.MM.YYYY')
        },
        {title: 'Koniec', dataIndex: 'endDate', key: 'endDate', render: (d: string) => dayjs(d).format('DD.MM.YYYY')},
        {title: 'Ročník', dataIndex: 'grade', key: 'grade', render: (g: number) => `${g}. ročník`},
    ]

    return (
        <div className="mt-8">
            <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-semibold">Termíny</h2>
                <Button type="primary" onClick={() => setIsModalOpen(true)}>
                    Pridať termín
                </Button>
            </div>

            <Table dataSource={terms} columns={columns} rowKey="_id" loading={loading}/>

            <Modal
                title="Pridať nový termín"
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                onOk={() => form.submit()}

                okText="Vytvoriť"
            >
                <Form layout="vertical" form={form} onFinish={handleAddTerm}>
                    <Form.Item
                        name="title"
                        label="Názov termínu"
                        rules={[{required: true, message: 'Zadajte názov'}]}
                    >
                        <Input/>
                    </Form.Item>

                    <Form.Item name="description" label="Popis">
                        <Input.TextArea rows={2}/>
                    </Form.Item>

                    <Form.Item
                        name="startDate"
                        label="Začiatok"
                        rules={[{required: true, message: 'Zadajte začiatok'}]}
                    >
                        <DatePicker style={{width: '100%'}}/>
                    </Form.Item>

                    <Form.Item
                        name="endDate"
                        label="Koniec"
                        rules={[{required: true, message: 'Zadajte koniec'}]}
                    >
                        <DatePicker style={{width: '100%'}}/>
                    </Form.Item>

                    <Form.Item
                        name="grade"
                        label="Ročník"
                        rules={[{required: true, message: 'Zadajte ročník'}]}
                    >
                        <InputNumber min={0} max={10} style={{width: '100%'}}/>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}
