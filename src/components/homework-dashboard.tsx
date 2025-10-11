'use client'

import { useState, useEffect } from 'react'
import { Card, List, Button, Tag, Space, Typography, Empty, Modal } from 'antd'
import { FileTextOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useRouter } from 'next/navigation'

const { Title, Text } = Typography

interface HomeworkAssignment {
    event_id: string
    event_title: string
    event_end_date: string
    homework_types: Array<{
        id: string
        name: string
        description?: string
        required: boolean
        dueDate?: string
        worksheet_id?: string
        submitted: boolean
        status?: 'pending' | 'approved' | 'rejected'
    }>
}

export default function HomeworkDashboard() {
    const [assignments, setAssignments] = useState<HomeworkAssignment[]>([])
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        fetchPendingHomeworks()
    }, [])

    const fetchPendingHomeworks = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/homeworks/pending', {
                credentials: 'include'
            })

            if (response.ok) {
                const data = await response.json()
                setAssignments(data)
            }
        } catch (error) {
            console.error('Error fetching pending homeworks:', error)
        }
        setLoading(false)
    }

    const getStatusTag = (homework: any) => {
        if (!homework.submitted) {
            return <Tag color="orange" icon={<ClockCircleOutlined />}>Neodovzdané</Tag>
        }

        const statusColors = {
            pending: 'blue',
            approved: 'green',
            rejected: 'red'
        }

        return (
            <Tag color={statusColors[homework.status]} icon={<CheckCircleOutlined />}>
                {homework.status === 'pending' ? 'Čaká na posúdenie' :
                 homework.status === 'approved' ? 'Schválené' : 'Zamietnuté'}
            </Tag>
        )
    }

    const getDueDateTag = (homework: any) => {
        if (!homework.dueDate) return null

        const dueDate = dayjs(homework.dueDate)
        const isOverdue = dueDate.isBefore(dayjs())

        return (
            <Tag color={isOverdue ? 'red' : 'default'}>
                Termín: {dueDate.format('DD.MM.YYYY')}
                {isOverdue && ' (po termíne)'}
            </Tag>
        )
    }

    const getPendingCount = (assignment: HomeworkAssignment) => {
        return assignment.homework_types.filter(hw => !hw.submitted).length
    }

    const getRequiredPendingCount = (assignment: HomeworkAssignment) => {
        return assignment.homework_types.filter(hw => hw.required && !hw.submitted).length
    }

    if (loading) {
        return <Card loading={true} />
    }

    if (assignments.length === 0) {
        return null // Don't show anything if no homework
    }

    return (
        <Card
            title={
                <Space>
                    <FileTextOutlined />
                    <span>Domáce úlohy</span>
                </Space>
            }
            className="homework-dashboard"
        >
            <Text type="secondary" className="block mb-4">
                Máš nevyplnené domáce úlohy z predchádzajúcich termínov. Prosím, vyplň ich čo najskôr.
            </Text>

            <List
                dataSource={assignments}
                renderItem={(assignment) => {
                    const pendingCount = getPendingCount(assignment)
                    const requiredPendingCount = getRequiredPendingCount(assignment)
                    const eventEndDate = dayjs(assignment.event_end_date)

                    return (
                        <Card
                            key={assignment.event_id}
                            size="small"
                            className="mb-3"
                            style={{
                                borderLeft: requiredPendingCount > 0 ? '4px solid #ff4d4f' : '4px solid #1890ff'
                            }}
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <Space direction="vertical" size="small" className="w-full">
                                        <Space>
                                            <Text strong>{assignment.event_title}</Text>
                                            <Tag color="default">{eventEndDate.format('DD.MM.YYYY')}</Tag>
                                            {requiredPendingCount > 0 && (
                                                <Tag color="red">{requiredPendingCount} povinných neodovzdaných</Tag>
                                            )}
                                            {pendingCount > 0 && requiredPendingCount === 0 && (
                                                <Tag color="orange">{pendingCount} neodovzdaných</Tag>
                                            )}
                                        </Space>

                                        <div className="pl-4">
                                            {assignment.homework_types.map((homework) => (
                                                <div key={homework.id} className="py-1">
                                                    <Space size="small" wrap>
                                                        <Text>{homework.name}</Text>
                                                        {homework.required && <Tag color="red" size="small">Povinné</Tag>}
                                                        {homework.worksheet_id && <Tag color="blue" size="small">Pracovný list</Tag>}
                                                        {getStatusTag(homework)}
                                                        {getDueDateTag(homework)}
                                                    </Space>
                                                </div>
                                            ))}
                                        </div>
                                    </Space>
                                </div>

                                <Button
                                    type={requiredPendingCount > 0 ? "primary" : "default"}
                                    danger={requiredPendingCount > 0}
                                    onClick={() => router.push(`/events/${assignment.event_id}`)}
                                >
                                    {pendingCount > 0 ? 'Vyplniť úlohy' : 'Zobraziť'}
                                </Button>
                            </div>
                        </Card>
                    )
                }}
            />
        </Card>
    )
}