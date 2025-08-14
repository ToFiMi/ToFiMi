"use client"

import { useState, useEffect } from 'react'
import { Card, Table, Tag, Typography, Space, Tooltip, Button, Modal, Statistic, Row, Col } from 'antd'
import { CheckCircleOutlined, CloseCircleOutlined, FileTextOutlined, CalendarOutlined, UserOutlined, EditOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import Link from 'next/link'

const { Title, Text, Paragraph } = Typography

interface UserOverviewProps {
    userId: string
    visible: boolean
    onClose: () => void
}

interface EventData {
    _id: string
    title: string
    startDate: string
    endDate: string
    description?: string
    grade?: number
    attendance: {
        registered: boolean
        going: boolean
        registrationDate?: string
    }
    homework: {
        submitted: boolean
        content?: string
        status?: 'approved' | 'pending' | 'rejected'
        submissionDate?: string
        lastUpdate?: string
    }
}

interface UserData {
    _id: string
    first_name: string
    last_name: string
    email: string
    role: string
}

interface UserOverviewData {
    user: UserData
    events: EventData[]
    stats: {
        totalEvents: number
        registeredEvents: number
        attendedEvents: number
        submittedHomeworks: number
        approvedHomeworks: number
    }
}

export default function UserOverviewCard({ userId, visible, onClose }: UserOverviewProps) {
    const [data, setData] = useState<UserOverviewData | null>(null)
    const [loading, setLoading] = useState(false)
    const [homeworkModal, setHomeworkModal] = useState<{ visible: boolean; content: string; title: string; eventId?: string }>({
        visible: false,
        content: '',
        title: '',
        eventId: undefined
    })

    useEffect(() => {
        if (visible && userId) {
            fetchUserData()
        }
    }, [visible, userId])

    const fetchUserData = async () => {
        setLoading(true)
        try {
            const response = await fetch(`/api/users/${userId}/overview`, {
                credentials: 'include'
            })
            if (response.ok) {
                const userData = await response.json()
                setData(userData)
            }
        } catch (error) {
            console.error('Error fetching user data:', error)
        } finally {
            setLoading(false)
        }
    }

    const showHomework = (content: string, title: string, eventId: string) => {
        setHomeworkModal({ visible: true, content, title, eventId })
    }

    const getAttendanceIcon = (attendance: EventData['attendance']) => {
        if (!attendance.registered) {
            return <Tooltip title="Nezaregistrovaný"><CloseCircleOutlined style={{ color: '#ff4d4f' }} /></Tooltip>
        }
        if (attendance.going) {
            return <Tooltip title="Zaregistrovaný a zúčastní sa"><CheckCircleOutlined style={{ color: '#52c41a' }} /></Tooltip>
        }
        return <Tooltip title="Zaregistrovaný ale nezúčastní sa"><CloseCircleOutlined style={{ color: '#faad14' }} /></Tooltip>
    }

    const getHomeworkIcon = (homework: EventData['homework'], eventId: string) => {
        if (!homework.submitted) {
            return <Tooltip title="Domáca úloha neodovzdaná"><CloseCircleOutlined style={{ color: '#ff4d4f' }} /></Tooltip>
        }

        const color = homework.status === 'approved' ? '#52c41a' :
                     homework.status === 'rejected' ? '#ff4d4f' : '#faad14'
        const title = homework.status === 'approved' ? 'Domáca úloha schválená' :
                     homework.status === 'rejected' ? 'Domáca úloha zamietnutá' : 'Domáca úloha čaká na posúdenie'

        return (
            <Tooltip title={title}>
                <Button
                    type="text"
                    icon={<FileTextOutlined style={{ color }} />}
                    onClick={() => showHomework(homework.content || '', `Domáca úloha`, eventId)}
                />
            </Tooltip>
        )
    }

    const getHomeworkStatus = (homework: EventData['homework']) => {
        if (!homework.submitted) return <Tag color="red">Neodovzdané</Tag>

        const statusMap = {
            approved: { color: 'green', text: 'Schválené' },
            rejected: { color: 'red', text: 'Zamietnuté' },
            pending: { color: 'orange', text: 'Čaká na posúdenie' }
        }

        const status = statusMap[homework.status as keyof typeof statusMap] || statusMap.pending
        return <Tag color={status.color}>{status.text}</Tag>
    }

    const columns = [
        {
            title: 'Termín',
            dataIndex: 'title',
            key: 'title',
            render: (text: string, record: EventData) => (
                <Space direction="vertical" size={0}>
                    <Text strong>{text}</Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                        {dayjs(record.startDate).format('DD.MM.YYYY')} - {dayjs(record.endDate).format('DD.MM.YYYY')}
                    </Text>
                    {record.grade && <Tag>{record.grade}. ročník</Tag>}
                </Space>
            )
        },
        {
            title: 'Účasť',
            key: 'attendance',
            width: 80,
            align: 'center' as const,
            render: (_: any, record: EventData) => getAttendanceIcon(record.attendance)
        },
        {
            title: 'Domáca úloha',
            key: 'homework',
            width: 120,
            align: 'center' as const,
            render: (_: any, record: EventData) => (
                <Space direction="vertical" size={0} style={{ textAlign: 'center' }}>
                    {getHomeworkIcon(record.homework, record._id)}
                    {getHomeworkStatus(record.homework)}
                </Space>
            )
        },
        {
            title: 'Dátumy',
            key: 'dates',
            width: 150,
            render: (_: any, record: EventData) => (
                <Space direction="vertical" size={0}>
                    {record.attendance.registrationDate && (
                        <Text style={{ fontSize: '11px' }}>
                            Reg: {dayjs(record.attendance.registrationDate).format('DD.MM HH:mm')}
                        </Text>
                    )}
                    {record.homework.submissionDate && (
                        <Text style={{ fontSize: '11px' }}>
                            DÚ: {dayjs(record.homework.submissionDate).format('DD.MM HH:mm')}
                        </Text>
                    )}
                </Space>
            )
        }
    ]

    return (
        <>
            <Modal
                title={data ? `Prehľad užívateľa: ${data.user.first_name} ${data.user.last_name}` : 'Prehľad užívateľa'}
                open={visible}
                onCancel={onClose}
                width={900}
                footer={[
                    <Button key="close" onClick={onClose}>
                        Zavrieť
                    </Button>
                ]}
            >
                {data && (
                    <Space direction="vertical" size="large" style={{ width: '100%' }}>
                        {/* User Info */}
                        <Card size="small">
                            <Space>
                                <UserOutlined style={{ fontSize: 20 }} />
                                <div>
                                    <Text strong>{data.user.first_name} {data.user.last_name}</Text><br />
                                    <Text type="secondary">{data.user.email}</Text><br />
                                    <Tag color="blue">{data.user.role}</Tag>
                                </div>
                            </Space>
                        </Card>

                        {/* Stats */}
                        <Row gutter={16}>
                            <Col span={6}>
                                <Statistic
                                    title="Celkom termínov"
                                    value={data.stats.totalEvents}
                                    prefix={<CalendarOutlined />}
                                />
                            </Col>
                            <Col span={6}>
                                <Statistic
                                    title="Zaregistrovaných"
                                    value={data.stats.registeredEvents}
                                    valueStyle={{ color: '#1677ff' }}
                                />
                            </Col>
                            <Col span={6}>
                                <Statistic
                                    title="Zúčastnených"
                                    value={data.stats.attendedEvents}
                                    valueStyle={{ color: '#52c41a' }}
                                />
                            </Col>
                            <Col span={6}>
                                <Statistic
                                    title="Domácich úloh"
                                    value={data.stats.submittedHomeworks}
                                    valueStyle={{ color: '#722ed1' }}
                                />
                            </Col>
                        </Row>

                        {/* Events Table */}
                        <Table
                            columns={columns}
                            dataSource={data.events}
                            rowKey="_id"
                            loading={loading}
                            pagination={{ pageSize: 10 }}
                            size="small"
                            scroll={{ y: 400 }}
                        />
                    </Space>
                )}
            </Modal>

            {/* Homework Modal */}
            <Modal
                title={homeworkModal.title}
                open={homeworkModal.visible}
                onCancel={() => setHomeworkModal({ ...homeworkModal, visible: false })}
                footer={[
                    homeworkModal.eventId && (
                        <Link key="review" href={`/events/${homeworkModal.eventId}`}>
                            <Button type="primary" icon={<EditOutlined />}>
                                Posúdiť domácu úlohu
                            </Button>
                        </Link>
                    ),
                    <Button key="close" onClick={() => setHomeworkModal({ ...homeworkModal, visible: false })}>
                        Zavrieť
                    </Button>
                ]}
                width={600}
            >
                <Paragraph style={{ whiteSpace: 'pre-wrap' }}>
                    {homeworkModal.content}
                </Paragraph>
            </Modal>
        </>
    )
}
