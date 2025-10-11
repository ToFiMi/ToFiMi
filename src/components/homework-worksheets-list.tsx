'use client'

import { useState, useEffect } from 'react'
import {
    Card,
    Button,
    Tag,
    Typography,
    Modal,
    Space,
    Empty,
    List
} from 'antd'
import { FileTextOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons'
import WorksheetSubmission from './worksheet-submission'
import dayjs from 'dayjs'

const { Title, Text } = Typography

interface HomeworkWorksheet {
    worksheet_id: string
    required: boolean
    dueDate?: string
    worksheet?: {
        _id: string
        title: string
        description?: string
    }
    submission?: {
        _id: string
        status: 'pending' | 'approved' | 'rejected'
        created: string
    }
}

interface HomeworkWorksheetsListProps {
    eventId: string
    homeworkWorksheets: HomeworkWorksheet[]
}

export default function HomeworkWorksheetsList({ eventId, homeworkWorksheets }: HomeworkWorksheetsListProps) {
    const [selectedWorksheet, setSelectedWorksheet] = useState<HomeworkWorksheet | null>(null)
    const [worksheetModalOpen, setWorksheetModalOpen] = useState(false)

    const handleWorksheetSubmit = () => {
        setWorksheetModalOpen(false)
        setSelectedWorksheet(null)
        // Refresh the page to show updated submission status
        window.location.reload()
    }

    const openWorksheet = (worksheet: HomeworkWorksheet) => {
        setSelectedWorksheet(worksheet)
        setWorksheetModalOpen(true)
    }

    const getStatusTag = (worksheet: HomeworkWorksheet) => {
        if (worksheet.submission) {
            const status = worksheet.submission.status
            const statusColors = {
                pending: 'blue',
                approved: 'green',
                rejected: 'red'
            }
            return (
                <Tag color={statusColors[status]} icon={<CheckCircleOutlined />}>
                    {status === 'pending' ? 'Čaká na schválenie' : status === 'approved' ? 'Schválené' : 'Zamietnuté'}
                </Tag>
            )
        }

        return <Tag color="orange" icon={<ClockCircleOutlined />}>Neodovzdané</Tag>
    }

    const getDueDateTag = (worksheet: HomeworkWorksheet) => {
        if (!worksheet.dueDate) return null

        const dueDate = dayjs(worksheet.dueDate)
        const isOverdue = dueDate.isBefore(dayjs())

        return (
            <Tag color={isOverdue ? 'red' : 'default'}>
                Termín: {dueDate.format('DD.MM.YYYY')}
            </Tag>
        )
    }

    if (homeworkWorksheets.length === 0) {
        return null
    }

    return (
        <>
            <Card
                title="Pracovné listy ako domáce úlohy"
                className="mb-4"
            >
                <Text type="secondary" className="block mb-4">
                    Tieto pracovné listy sú zadané ako domáce úlohy pre tento termín.
                </Text>

                <List
                    dataSource={homeworkWorksheets}
                    renderItem={(worksheet) => (
                        <List.Item
                            key={worksheet.worksheet_id}
                            actions={[
                                <Button
                                    key="fill"
                                    type={worksheet.submission ? "default" : "primary"}
                                    icon={<FileTextOutlined />}
                                    onClick={() => openWorksheet(worksheet)}
                                >
                                    {worksheet.submission ? 'Zobraziť' : 'Vyplniť'}
                                </Button>
                            ]}
                        >
                            <List.Item.Meta
                                title={
                                    <Space>
                                        {worksheet.worksheet?.title || 'Pracovný list'}
                                        {worksheet.required && <Tag color="red">Povinné</Tag>}
                                    </Space>
                                }
                                description={
                                    <Space direction="vertical" size="small">
                                        {worksheet.worksheet?.description && (
                                            <Text type="secondary">{worksheet.worksheet.description}</Text>
                                        )}
                                        <Space>
                                            {getStatusTag(worksheet)}
                                            {getDueDateTag(worksheet)}
                                        </Space>
                                    </Space>
                                }
                            />
                        </List.Item>
                    )}
                />
            </Card>

            <Modal
                title={selectedWorksheet?.worksheet?.title || 'Pracovný list'}
                open={worksheetModalOpen}
                onCancel={() => {
                    setWorksheetModalOpen(false)
                    setSelectedWorksheet(null)
                }}
                footer={null}
                width={800}
                className="worksheet-modal"
            >
                {selectedWorksheet && (
                    <WorksheetSubmission
                        eventId={eventId}
                        worksheetId={selectedWorksheet.worksheet_id}
                        onSubmit={handleWorksheetSubmit}
                    />
                )}
            </Modal>
        </>
    )
}
