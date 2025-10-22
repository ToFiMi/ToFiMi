"use client"

import { Homework } from "@/models/homework"
import { Event } from "@/models/events"
import { Button, Form, Input, message, Typography, Card, List, Tag, Space, Modal, Divider } from "antd"
import { useEffect, useState } from "react"
import CommentsThread from "@/components/comments/thread";
import WorksheetSubmission from "@/components/worksheet-submission";
import { FileTextOutlined, CheckCircleOutlined } from "@ant-design/icons";
import dayjs from "dayjs";


const { Title, Paragraph, Text } = Typography

export default function HomeworkUserPage({ homework, event, event_id, event_name }: { homework: Homework | null, event: Event, event_id: string, event_name?: string }) {
    const [selectedHomeworkType, setSelectedHomeworkType] = useState<any>(null)
    const [showWorksheetModal, setShowWorksheetModal] = useState(false)
    const [existingHomeworks, setExistingHomeworks] = useState<{[key: string]: Homework}>({})

    useEffect(() => {
        // Load all homeworks for this event
        fetchHomeworks()
    }, [event_id])

    const fetchHomeworks = async () => {
        try {
            const response = await fetch(`/api/homeworks?event_id=${event_id}`, {
                credentials: 'include'
            })
            if (response.ok) {
                const homeworks = await response.json()
                // Group by homework_type_id
                const grouped = homeworks.reduce((acc: any, hw: Homework) => {
                    acc[hw.homework_type_id] = hw
                    return acc
                }, {})
                setExistingHomeworks(grouped)
            }
        } catch (error) {
            console.error('Error fetching homeworks:', error)
        }
    }

    const handleTextHomeworkSubmit = async (values: any, homeworkType: any) => {
        try {
            const res = await fetch(`/api/homeworks`, {
                method: existingHomeworks[homeworkType.id] ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    content: values.content,
                    event_id: event_id,
                    homework_type_id: homeworkType.id
                })
            })

            if (res.ok) {
                message.success("Domáca úloha bola uložená")
                fetchHomeworks()
            } else {
                const err = await res.text()
                message.error(`Chyba: ${err}`)
            }
        } catch (err) {
            console.error(err)
            message.error("Nepodarilo sa uložiť úlohu")
        }
    }

    const handleWorksheetSubmit = () => {
        setShowWorksheetModal(false)
        setSelectedHomeworkType(null)
        fetchHomeworks()
    }

    const getHomeworkStatus = (homeworkType: any) => {
        const existing = existingHomeworks[homeworkType.id]
        if (existing) {
            const statusColors = {
                pending: 'blue',
                approved: 'green',
                rejected: 'red'
            }
            return (
                <Tag color={statusColors[existing.status]} icon={<CheckCircleOutlined />}>
                    {existing.status === 'pending' ? 'Čaká na posúdenie' : existing.status === 'approved' ? 'Schválené' : 'Zamietnuté'}
                </Tag>
            )
        }
        return <Tag color="orange">Neodovzdané</Tag>
    }

    const getDueDateTag = (homeworkType: any) => {
        if (!homeworkType.dueDate) return null

        const dueDate = dayjs(homeworkType.dueDate)
        const isOverdue = dueDate.isBefore(dayjs())

        return (
            <Tag color={isOverdue ? 'red' : 'default'}>
                Termín: {dueDate.format('DD.MM.YYYY')}
            </Tag>
        )
    }

    if (!event.homeworkTypes || event.homeworkTypes.length === 0) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-sm">
                <Title level={4}>Domáce úlohy</Title>
                <Paragraph type="secondary">
                    Pre tento termín nie sú zadané žiadne domáce úlohy.
                </Paragraph>
            </div>
        )
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm">
            <Title level={4}>Domáce úlohy</Title>
            <Paragraph>
                Pre tento termín sú zadané nasledujúce domáce úlohy. Vyber typ úlohy a vyplň ju.
            </Paragraph>

            <List
                dataSource={event.homeworkTypes}
                renderItem={(homeworkType: any) => {
                    const existing = existingHomeworks[homeworkType.id]
                    const isWorksheet = !!homeworkType.worksheet_id

                    return (
                        <Card key={homeworkType.id} className="mb-4">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <Space direction="vertical" size="small" className="w-full">
                                        <Space>
                                            <Text strong>{homeworkType.name}</Text>
                                            {homeworkType.required && <Tag color="red">Povinné</Tag>}
                                            {isWorksheet && <Tag color="blue">Pracovný list</Tag>}
                                        </Space>
                                        {homeworkType.description && (
                                            <Text type="secondary">{homeworkType.description}</Text>
                                        )}
                                        <Space>
                                            {getHomeworkStatus(homeworkType)}
                                            {getDueDateTag(homeworkType)}
                                        </Space>
                                    </Space>
                                </div>
                                <Button
                                    type={existing ? "default" : "primary"}
                                    icon={<FileTextOutlined />}
                                    onClick={() => {
                                        setSelectedHomeworkType(homeworkType)
                                        if (isWorksheet) {
                                            setShowWorksheetModal(true)
                                        }
                                    }}
                                >
                                    {existing ? 'Zobraziť' : 'Vyplniť'}
                                </Button>
                            </div>

                            {/* Show text homework form inline if selected and not worksheet */}
                            {selectedHomeworkType?.id === homeworkType.id && !isWorksheet && (
                                <>
                                    <Divider />
                                    <Form
                                        key={homeworkType.id}
                                        layout="vertical"
                                        onFinish={(values) => handleTextHomeworkSubmit(values, homeworkType)}
                                        initialValues={{ content: existing?.content }}
                                    >
                                        <Form.Item
                                            name="content"
                                            label="Tvoja odpoveď"
                                            rules={[{ required: true, message: "Prosím, zadaj svoju odpoveď." }]}
                                        >
                                            <Input.TextArea
                                                placeholder="Napíš svoju domácu úlohu..."
                                                rows={6}
                                                showCount
                                                style={{ resize: 'vertical' }}
                                            />
                                        </Form.Item>

                                        <Form.Item>
                                            <Space>
                                                <Button type="primary" htmlType="submit">
                                                    Uložiť
                                                </Button>
                                                <Button onClick={() => setSelectedHomeworkType(null)}>
                                                    Zrušiť
                                                </Button>
                                            </Space>
                                        </Form.Item>
                                    </Form>

                                    {existing && (
                                        <CommentsThread entity="homework" entityId={existing._id.toString()} />
                                    )}
                                </>
                            )}
                        </Card>
                    )
                }}
            />

            {/* Worksheet Modal */}
            <Modal
                title={selectedHomeworkType?.name || 'Pracovný list'}
                open={showWorksheetModal}
                onCancel={() => {
                    setShowWorksheetModal(false)
                    setSelectedHomeworkType(null)
                }}
                footer={null}
                width={800}
                className="worksheet-modal"
            >
                {selectedHomeworkType && selectedHomeworkType.worksheet_id && (
                    <WorksheetSubmission
                        eventId={event_id}
                        worksheetId={selectedHomeworkType.worksheet_id}
                        homeworkTypeId={selectedHomeworkType.id}
                        onSubmit={handleWorksheetSubmit}
                    />
                )}
            </Modal>
        </div>
    )
}
