'use client'

import { Button, Modal, Form, Input, Space, Typography, message } from 'antd'
import { useState, useEffect } from 'react'
import { EditOutlined } from '@ant-design/icons'
import { DailyReflection } from "@/models/daliy-reflections"
import dayjs from 'dayjs'

const { TextArea } = Input

interface ReflectionEditModalProps {
    reflection: DailyReflection
    userRole?: 'ADMIN' | 'user' | 'leader' | 'animator' | null
    onUpdate?: (updatedReflection: DailyReflection) => void
}

export default function ReflectionEditModal({ 
    reflection, 
    userRole, 
    onUpdate 
}: ReflectionEditModalProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [form] = Form.useForm()

    const canEdit = userRole === 'leader' || userRole === 'animator'

    useEffect(() => {
        if (open && reflection) {
            // Set initial form values
            form.setFieldsValue({
                verse_reference: reflection.verse_reference.map(v => ({
                    reference: v.reference,
                    verse: v.verse
                })),
                content: reflection.content
            })
        }
    }, [open, reflection, form])

    const handleSubmit = async (values: any) => {
        setLoading(true)
        try {
            const response = await fetch(`/api/daily-reflections/${reflection._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    verse_reference: values.verse_reference,
                    content: values.content
                }),
                credentials: 'include'
            })

            if (response.ok) {
                const updatedReflection = await response.json()
                message.success('Zamyslenie bolo úspešne aktualizované')
                setOpen(false)
                onUpdate?.(updatedReflection)
            } else {
                const error = await response.text()
                message.error(error || 'Chyba pri aktualizácii zamyslenia')
            }
        } catch (error) {
            console.error('Chyba pri aktualizácii reflexie:', error)
            message.error('Chyba pri komunikácii so serverom')
        } finally {
            setLoading(false)
        }
    }

    if (!canEdit) {
        return null
    }

    return (
        <>
            <Button 
                type="text" 
                icon={<EditOutlined />} 
                onClick={() => setOpen(true)}
                size="small"
                title="Upraviť zamyslenie"
            >
                Upraviť
            </Button>

            <Modal
                title={`Upraviť zamyslenie - ${dayjs(reflection.date).format('DD.MM.YYYY')}`}
                open={open}
                onCancel={() => setOpen(false)}
                onOk={() => form.submit()}
                okText="Uložiť"
                cancelText="Zrušiť"
                confirmLoading={loading}
                width={800}
            >
                <Form 
                    form={form} 
                    layout="vertical" 
                    onFinish={handleSubmit}
                >
                    <Typography.Title level={5}>Biblické verše</Typography.Title>
                    
                    <Form.List name="verse_reference">
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map(({ key, name, ...restField }) => (
                                    <Space key={key} align="baseline" style={{ display: 'flex', marginBottom: 8 }}>
                                        <Form.Item
                                            {...restField}
                                            name={[name, 'reference']}
                                            label="Odkaz"
                                            rules={[{ required: true, message: 'Zadaj odkaz na verš' }]}
                                        >
                                            <Input placeholder="Napr. Rim 1:11-12" />
                                        </Form.Item>
                                        
                                        <Form.Item
                                            {...restField}
                                            name={[name, 'verse']}
                                            label="Text verša"
                                            rules={[{ required: true, message: 'Zadaj text verša' }]}
                                            style={{ flex: 1 }}
                                        >
                                            <TextArea 
                                                placeholder="Text biblického verša" 
                                                autoSize={{ minRows: 2, maxRows: 4 }}
                                            />
                                        </Form.Item>
                                        
                                        <Button 
                                            type="text" 
                                            onClick={() => remove(name)}
                                            danger
                                            disabled={fields.length === 1}
                                        >
                                            Vymazať
                                        </Button>
                                    </Space>
                                ))}
                                
                                <Form.Item>
                                    <Button 
                                        type="dashed" 
                                        onClick={() => add()} 
                                        block
                                    >
                                        Pridať ďalší verš
                                    </Button>
                                </Form.Item>
                            </>
                        )}
                    </Form.List>

                    <Form.Item
                        name="content"
                        label="Zamyslenie"
                        rules={[{ required: true, message: 'Zadaj obsah zamyslenia' }]}
                    >
                        <TextArea 
                            rows={6} 
                            placeholder="Napíš zamyslenie ku veršom"
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </>
    )
}