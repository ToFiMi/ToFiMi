'use client'

import {Button, Modal, Upload, Select, message, Typography, Form, Input} from 'antd'
import {useEffect, useState} from 'react'
import { UploadOutlined } from '@ant-design/icons'
import {Event} from "@/models/events"
import dayjs from "dayjs";

const { Title } = Typography

export default function ImportModal() {
    const [open, setOpen] = useState(false)
    const [events, setEvents] = useState<Event[]>([])
    const [uploading, setUploading] = useState(false)
    const [form] = Form.useForm()

    useEffect(() => {
        async function fetchEvents() {
            try {
                const res = await fetch('/api/events', { credentials: 'include' })
                if (!res.ok)return
                const data = await res.json()
                setEvents(data)
            } catch (e) {
                console.error(e)
                message.error('Nepodarilo sa načítať zoznam termínov')
            }
        }

        if(open === true){
            fetchEvents()
        }

    }, [open])

    const handleUpload = async (values: any) => {
        const fileList = values.file?.fileList
        const file = fileList?.[0]?.originFileObj
        const event_id = values.event_id
        console.log("Values",values)

        if (!file || !event_id) {
            message.error('Vyberte súbor aj víkend')
            return
        }

        const formData = new FormData()
        formData.append('file', file)
        formData.append('event_id', event_id)

        setUploading(true)
        const res = await fetch('/api/daily-reflections/import-file', {
            method: 'POST',
            body: formData,
        })

        if (res.ok) {
            message.success('Zamyslenia boli importované')
            setOpen(false)
            form.resetFields()
        } else {
            const err = await res.text()
            message.error(`Chyba: ${err}`)
        }
        setUploading(false)
    }

    return (
        <>
            <Button type="default" onClick={() => setOpen(true)}>
                Importovať z CSV/.md/.xlsx
            </Button>

            <Modal
                title="Import zamyslení zo súboru"
                open={open}
                onCancel={() => setOpen(false)}
                onOk={() => form.submit()}
                okText="Importovať"
                confirmLoading={uploading}
            >
                <Form layout="vertical" form={form} onFinish={handleUpload}>
                    <Form.Item
                        name="event_id"
                        label="Termín (event)"
                        rules={[{ required: true }]}
                    >
                        <Select
                            placeholder="Vyber termín"
                            options={events.map((e) => ({
                                label: e.title + " "+ dayjs(e.startDate).format("DD.MM.YY")  + " - " + dayjs(e.endDate).format("DD.MM.YY")  ,
                                value: e._id,
                            }))}
                            showSearch
                            filterOption={(input, option) =>
                                (option?.label as string).toLowerCase().includes(input.toLowerCase())
                            }
                            onChange={(value) => {
                                const selected = events.find((e: any) => e._id === value)
                                if (selected?.endDate) {
                                    const end = dayjs(selected.endDate).add(2, "day").toDate()

                                    const iso = end.toISOString().split('T')[0]
                                    form.setFieldsValue({ start_date: iso })
                                }
                            }}
                        />
                    </Form.Item>

                <Form.Item
                    name="start_date"
                    label="Štart zamyslení"
                    rules={[{ required: false }]}
                >
                    <Input type="date" />
                </Form.Item>

                    <Form.Item
                        label="Súbor zamyslení"
                        name="file"
                        valuePropName="file"
                        rules={[{ required: true, message: 'Vyberte súbor' }]}
                    >
                        <Upload beforeUpload={() => false} maxCount={1}>
                            <Button icon={<UploadOutlined />}>Vybrať súbor</Button>
                        </Upload>
                    </Form.Item>
                </Form>
            </Modal>
        </>
    )
}
