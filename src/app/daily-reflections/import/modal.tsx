'use client'

import {Button, Modal, Upload, Select, message, Typography, Form, Input, Space, Divider} from 'antd'
import {useEffect, useState} from 'react'
import { UploadOutlined, DownloadOutlined } from '@ant-design/icons'
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

    const downloadTemplate = async (format: 'csv' | 'xlsx') => {
        try {
            const response = await fetch(`/api/daily-reflections/template?format=${format}&days=7`)
            if (format === 'csv') {
                const blob = await response.blob()
                const url = window.URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.href = url
                link.download = 'daily-reflections-template.csv'
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
                window.URL.revokeObjectURL(url)
                message.success('CSV template stiahnuté')
            } else {
                const data = await response.json()
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
                const url = window.URL.createObjectURL(blob)
                const link = document.createElement('a')
                link.href = url
                link.download = 'daily-reflections-template.json'
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
                window.URL.revokeObjectURL(url)
                message.success('JSON template stiahnuté')
            }
        } catch (error) {
            message.error('Chyba pri sťahovaní template')
        }
    }

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
                width={600}
            >
                <div style={{ marginBottom: 16 }}>
                    <Typography.Text strong>Stiahnuť šablónu:</Typography.Text>
                    <br />
                    <Space>
                        <Button 
                            icon={<DownloadOutlined />} 
                            onClick={() => downloadTemplate('csv')}
                            type="dashed"
                        >
                            CSV šablóna
                        </Button>
                        <Typography.Text type="secondary">
                            (Odporúčané - otvorí sa v Excel/Google Sheets)
                        </Typography.Text>
                    </Space>
                </div>
                
                <Divider />
                
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
