"use client"

import { useState, useEffect } from 'react'
import { Card, Table, Tag, Typography, Space, Tooltip, Button, Modal, Statistic, Row, Col, Switch, message, Select, Popconfirm, Grid } from 'antd'
import { CheckCircleOutlined, CloseCircleOutlined, FileTextOutlined, CalendarOutlined, UserOutlined, EditOutlined, SettingOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import Link from 'next/link'

const { Title, Text, Paragraph } = Typography
const { useBreakpoint } = Grid

interface UserOverviewProps {
    userId: string
    visible: boolean
    onClose: () => void
    currentUserRole?: string // Role of the user viewing the modal
}

interface EventData {
    _id: string
    title: string
    startDate: string
    endDate: string
    description?: string
    grade?: number
    registrationId?: string
    attendance: {
        registered: boolean
        going: boolean
        attended?: boolean | null
        attendanceMarkedBy?: string
        attendanceMarkedAt?: string
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

export default function UserOverviewCard({ userId, visible, onClose, currentUserRole }: UserOverviewProps) {
    const screens = useBreakpoint()
    const [data, setData] = useState<UserOverviewData | null>(null)
    const [loading, setLoading] = useState(false)
    const [roleInfo, setRoleInfo] = useState<{
        currentRole: string
        assignableRoles: string[]
        canChangeRole: boolean
        permissions: {
            canActivate: boolean
            canDeactivate: boolean
        }
    } | null>(null)
    const [changingRole, setChangingRole] = useState(false)
    const [homeworkModal, setHomeworkModal] = useState<{ visible: boolean; content: string; title: string; eventId?: string }>({
        visible: false,
        content: '',
        title: '',
        eventId: undefined
    })

    useEffect(() => {
        if (visible && userId) {
            fetchUserData()
            fetchRoleInfo()
        }
    }, [visible, userId])

    const fetchRoleInfo = async () => {
        // Only fetch role info if current user can manage roles
        if (!currentUserRole || !['ADMIN', 'leader'].includes(currentUserRole)) {
            return
        }

        try {
            const response = await fetch(`/api/users/${userId}/role`, {
                credentials: 'include'
            })
            if (response.ok) {
                const roleData = await response.json()
                setRoleInfo(roleData)
            }
        } catch (error) {
            console.error('Error fetching role info:', error)
        }
    }

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

    const handleRoleChange = async (newRole: string) => {
        setChangingRole(true)
        try {
            const response = await fetch(`/api/users/${userId}/role`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ newRole }),
                credentials: 'include'
            })

            if (response.ok) {
                const result = await response.json()
                message.success(`Rola používateľa zmenená na ${newRole}`)
                fetchUserData() // Refresh user data
                fetchRoleInfo() // Refresh role info
            } else {
                const error = await response.text()
                message.error(error || 'Chyba pri zmene role')
            }
        } catch (error) {
            console.error('Error changing role:', error)
            message.error('Chyba pri komunikácii so serverom')
        } finally {
            setChangingRole(false)
        }
    }

    const handleAttendanceToggle = async (registrationId: string, attended: boolean) => {
        try {
            const response = await fetch('/api/attendance', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ registrationId, attended }),
                credentials: 'include'
            })

            if (response.ok) {
                message.success(`Účasť ${attended ? 'označená' : 'odobraná'}`)
                fetchUserData() // Refresh data
            } else {
                const error = await response.text()
                message.error(error || 'Chyba pri aktualizácii účasti')
            }
        } catch (error) {
            console.error('Error updating attendance:', error)
            message.error('Chyba pri komunikácii so serverom')
        }
    }

    const handleManualAttendance = async (eventId: string, attended: boolean) => {
        try {
            const response = await fetch('/api/attendance/manual', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, eventId, attended }),
                credentials: 'include'
            })

            if (response.ok) {
                message.success(`Účasť ${attended ? 'označená' : 'odobraná'}`)
                fetchUserData() // Refresh data
            } else {
                const error = await response.text()
                message.error(error || 'Chyba pri manuálnej registrácii')
            }
        } catch (error) {
            console.error('Error with manual attendance:', error)
            message.error('Chyba pri komunikácii so serverom')
        }
    }

    const getAttendanceIcon = (attendance: EventData['attendance']) => {
        if (!attendance.registered) {
            return <Tooltip title="Nezaregistrovaný"><CloseCircleOutlined style={{ color: '#ff4d4f' }} /></Tooltip>
        }
        if (!attendance.going) {
            return <Tooltip title="Zaregistrovaný ale nejde"><CloseCircleOutlined style={{ color: '#faad14' }} /></Tooltip>
        }
        if (attendance.attended === true) {
            return <Tooltip title="Zúčastnil sa"><CheckCircleOutlined style={{ color: '#52c41a' }} /></Tooltip>
        }
        if (attendance.attended === false) {
            return <Tooltip title="Nezúčastnil sa"><CloseCircleOutlined style={{ color: '#ff4d4f' }} /></Tooltip>
        }
        // attended is null/undefined - not marked yet
        return <Tooltip title="Plánuje sa zúčastniť - účasť neoznačená"><CheckCircleOutlined style={{ color: '#1677ff' }} /></Tooltip>
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

    const renderMobileEventCards = () => {
        if (loading) {
            return (
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    {[1, 2, 3].map((i) => (
                        <Card key={i} loading style={{ width: '100%' }} />
                    ))}
                </Space>
            )
        }

        if (!data?.events || data.events.length === 0) {
            return (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                    <Text type="secondary">
                        Žiadne termíny neboli nájdené
                    </Text>
                </div>
            )
        }

        return (
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                {data.events.map((event) => (
                    <Card
                        key={event._id}
                        size="small"
                        style={{
                            width: '100%',
                            borderRadius: '8px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                        bodyStyle={{ padding: '12px' }}
                    >
                        <Space direction="vertical" size="small" style={{ width: '100%' }}>
                            {/* Event Title and Date */}
                            <div>
                                <Text strong style={{ fontSize: '14px', display: 'block' }}>
                                    {event.title}
                                </Text>
                                <Text type="secondary" style={{ fontSize: '11px' }}>
                                    {dayjs(event.startDate).format('DD.MM.YYYY')} - {dayjs(event.endDate).format('DD.MM.YYYY')}
                                </Text>
                                {event.grade && (
                                    <div style={{ marginTop: '4px' }}>
                                        <Tag size="small">{event.grade}. ročník</Tag>
                                    </div>
                                )}
                            </div>

                            {/* Attendance Section */}
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '8px',
                                backgroundColor: '#f5f5f5',
                                borderRadius: '4px'
                            }}>
                                <Space size="small">
                                    <Text strong style={{ fontSize: '12px' }}>Účasť:</Text>
                                    {getAttendanceIcon(event.attendance)}
                                </Space>
                                {/* Show attendance toggle only for registered users who are going */}
                                {event.attendance.registered && event.attendance.going && event.registrationId && (
                                    <Switch
                                        size="small"
                                        checked={event.attendance.attended === true}
                                        onChange={(checked) => handleAttendanceToggle(event.registrationId!, checked)}
                                        checkedChildren="✓"
                                        unCheckedChildren="✗"
                                    />
                                )}
                            </div>

                            {/* Homework Section - Only for regular users */}
                            {data?.user.role === 'user' && (
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '8px',
                                    backgroundColor: '#f5f5f5',
                                    borderRadius: '4px'
                                }}>
                                    <Space size="small">
                                        <Text strong style={{ fontSize: '12px' }}>DÚ:</Text>
                                        {getHomeworkIcon(event.homework, event._id)}
                                        {getHomeworkStatus(event.homework)}
                                    </Space>
                                </div>
                            )}

                            {/* Dates Section */}
                            <div style={{ fontSize: '10px', color: '#8c8c8c' }}>
                                {event.attendance.registrationDate && (
                                    <div>
                                        Reg: {dayjs(event.attendance.registrationDate).format('DD.MM HH:mm')}
                                    </div>
                                )}
                                {data?.user.role === 'user' && event.homework.submissionDate && (
                                    <div>
                                        DÚ: {dayjs(event.homework.submissionDate).format('DD.MM HH:mm')}
                                    </div>
                                )}
                            </div>
                        </Space>
                    </Card>
                ))}
            </Space>
        )
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
            width: 150,
            align: 'center' as const,
            render: (_: any, record: EventData) => (
                <Space direction="vertical" size={2} style={{ textAlign: 'center' }}>
                    {getAttendanceIcon(record.attendance)}
                    {/* Show attendance toggle only for registered users who are going */}
                    {record.attendance.registered && record.attendance.going && record.registrationId && (
                        <Switch
                            size="small"
                            checked={record.attendance.attended === true}
                            onChange={(checked) => handleAttendanceToggle(record.registrationId!, checked)}
                            checkedChildren="✓"
                            unCheckedChildren="✗"
                        />
                    )}
                    {/* Show manual attendance button for unregistered users */}
                    {!record.attendance.registered && (
                        <Popconfirm
                            title="Označiť účasť?"
                            description="Vytvoríte manuálnu registráciu a označíte účastníka ako prítomného."
                            onConfirm={() => handleManualAttendance(record._id, true)}
                            okText="Áno"
                            cancelText="Nie"
                        >
                            <Button type="primary" size="small">
                                Označiť účasť
                            </Button>
                        </Popconfirm>
                    )}
                </Space>
            )
        },
        // Only show homework column for regular users
        ...(data?.user.role === 'user' ? [{
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
        }] : []),
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
                    {/* Only show homework date for regular users */}
                    {data?.user.role === 'user' && record.homework.submissionDate && (
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
                width={screens.md ? 900 : '95%'}
                style={!screens.md ? { top: 20 } : {}}
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
                                <div style={{ flex: 1 }}>
                                    <Text strong>{data.user.first_name} {data.user.last_name}</Text><br />
                                    <Text type="secondary">{data.user.email}</Text><br />
                                    <Space>
                                        <Tag 
                                            color={data.user.role === 'inactive' ? 'red' : 
                                                   data.user.role === 'leader' ? 'gold' :
                                                   data.user.role === 'animator' ? 'blue' : 'green'}
                                        >
                                            {data.user.role}
                                        </Tag>
                                        
                                        {/* Role Management */}
                                        {roleInfo?.canChangeRole && (
                                            <Space>
                                                <Select
                                                    value={roleInfo.currentRole}
                                                    onChange={handleRoleChange}
                                                    loading={changingRole}
                                                    size="small"
                                                    style={{ minWidth: 100 }}
                                                >
                                                    {roleInfo.assignableRoles.map(role => (
                                                        <Select.Option key={role} value={role}>
                                                            <Tag 
                                                                color={role === 'inactive' ? 'red' : 
                                                                       role === 'leader' ? 'gold' :
                                                                       role === 'animator' ? 'blue' : 'green'}
                                                                style={{ margin: 0 }}
                                                            >
                                                                {role}
                                                            </Tag>
                                                        </Select.Option>
                                                    ))}
                                                </Select>
                                                
                                                {/* Quick Actions */}
                                                {roleInfo.permissions.canActivate && (
                                                    <Popconfirm
                                                        title="Aktivovať používateľa?"
                                                        description="Používateľ získa späť prístup do systému."
                                                        onConfirm={() => handleRoleChange('user')}
                                                        okText="Áno"
                                                        cancelText="Nie"
                                                    >
                                                        <Button type="primary" size="small" loading={changingRole}>
                                                            Aktivovať
                                                        </Button>
                                                    </Popconfirm>
                                                )}
                                                
                                                {roleInfo.permissions.canDeactivate && (
                                                    <Popconfirm
                                                        title="Deaktivovať používateľa?"
                                                        description="Používateľ stratí prístup do systému."
                                                        onConfirm={() => handleRoleChange('inactive')}
                                                        okText="Áno"
                                                        cancelText="Nie"
                                                    >
                                                        <Button type="default" danger size="small" loading={changingRole}>
                                                            Deaktivovať
                                                        </Button>
                                                    </Popconfirm>
                                                )}
                                            </Space>
                                        )}
                                    </Space>
                                </div>
                            </Space>
                        </Card>

                        {/* Stats */}
                        <Row gutter={[16, screens.md ? 0 : 16]}>
                            <Col xs={12} sm={data.user.role === 'user' ? 6 : 8}>
                                <Statistic
                                    title="Celkom termínov"
                                    value={data.stats.totalEvents}
                                    prefix={<CalendarOutlined />}
                                />
                            </Col>
                            <Col xs={12} sm={data.user.role === 'user' ? 6 : 8}>
                                <Statistic
                                    title="Zaregistrovaných"
                                    value={data.stats.registeredEvents}
                                    valueStyle={{ color: '#1677ff' }}
                                />
                            </Col>
                            <Col xs={12} sm={data.user.role === 'user' ? 6 : 8}>
                                <Statistic
                                    title="Zúčastnených"
                                    value={data.stats.attendedEvents}
                                    valueStyle={{ color: '#52c41a' }}
                                />
                            </Col>
                            {/* Only show homework stats for regular users */}
                            {data.user.role === 'user' && (
                                <Col xs={12} sm={6}>
                                    <Statistic
                                        title="Domácich úloh"
                                        value={data.stats.submittedHomeworks}
                                        valueStyle={{ color: '#722ed1' }}
                                    />
                                </Col>
                            )}
                        </Row>

                        {/* Events - Table on desktop, cards on mobile */}
                        <div>
                            <Title level={4} style={{ marginBottom: 16 }}>História termínov</Title>
                            {screens.md ? (
                                <Table
                                    columns={columns}
                                    dataSource={data.events}
                                    rowKey="_id"
                                    loading={loading}
                                    pagination={{ pageSize: 10 }}
                                    size="small"
                                    scroll={{ y: 400, x: true }}
                                />
                            ) : (
                                <>
                                    {renderMobileEventCards()}
                                    {data.events.length > 0 && (
                                        <div style={{ marginTop: '16px', textAlign: 'center' }}>
                                            <Text type="secondary" style={{ fontSize: '12px' }}>
                                                Zobrazených: {data.events.length} termínov
                                            </Text>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
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
                        <Link key="review" href={`/events/${homeworkModal.eventId}?userId=${userId}`}>
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
