'use client'

import { useState, useEffect } from 'react'
import {
    Card,
    List,
    Button,
    Tag,
    Typography,
    Modal,
    Space,
    Empty
} from 'antd'
import { ClockCircleOutlined, FileTextOutlined, CheckCircleOutlined } from '@ant-design/icons'
import WorksheetSubmission from './worksheet-submission'
import dayjs from 'dayjs'

const { Title, Text } = Typography

interface MissedEvent {
    _id: string
    title: string
    description?: string
    startDate: string
    endDate: string
    worksheet?: any
    hasSubmission: boolean
    submission?: any
}

interface MissedEventsDashboardProps {
    userId: string
}

export default function MissedEventsDashboard({ userId }: MissedEventsDashboardProps) {
    const [missedEvents, setMissedEvents] = useState<MissedEvent[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedEvent, setSelectedEvent] = useState<MissedEvent | null>(null)
    const [worksheetModalOpen, setWorksheetModalOpen] = useState(false)

    useEffect(() => {
        fetchMissedEvents()
    }, [userId])

    const fetchMissedEvents = async () => {
        setLoading(true)
        try {
            const response = await fetch(`/api/users/${userId}/missed-events`, {
                credentials: 'include'
            })
            
            if (response.ok) {
                const data = await response.json()
                setMissedEvents(data)
            }
        } catch (error) {
            console.error('Error fetching missed events:', error)
        }
        setLoading(false)
    }

    const handleWorksheetSubmit = () => {
        setWorksheetModalOpen(false)
        setSelectedEvent(null)
        fetchMissedEvents() // Refresh to show updated submission status
    }

    const openWorksheet = (event: MissedEvent) => {
        setSelectedEvent(event)
        setWorksheetModalOpen(true)
    }

    const getStatusTag = (event: MissedEvent) => {
        if (!event.worksheet) {
            return <Tag color="orange">No Worksheet Available</Tag>
        }
        
        if (event.hasSubmission) {
            const status = event.submission?.status || 'pending'
            const statusColors = {
                pending: 'blue',
                approved: 'green',
                rejected: 'red'
            }
            return (
                <Tag color={statusColors[status as keyof typeof statusColors]} icon={<CheckCircleOutlined />}>
                    Worksheet {status.charAt(0).toUpperCase() + status.slice(1)}
                </Tag>
            )
        }
        
        return <Tag color="red">Worksheet Pending</Tag>
    }

    const renderEventCard = (event: MissedEvent) => (
        <Card 
            key={event._id}
            className="mb-4"
            size="small"
        >
            <div className="flex justify-between items-start">
                <div className="flex-1">
                    <Title level={4} className="mb-2">{event.title}</Title>
                    {event.description && (
                        <Text type="secondary" className="block mb-3">
                            {event.description}
                        </Text>
                    )}
                    
                    <Space className="mb-3">
                        <Text className="flex items-center">
                            <ClockCircleOutlined className="mr-1" />
                            {dayjs(event.startDate).format('DD.MM.YYYY')} - {dayjs(event.endDate).format('DD.MM.YYYY')}
                        </Text>
                        {getStatusTag(event)}
                    </Space>
                    
                    {event.worksheet && !event.hasSubmission && (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded mb-3">
                            <Text strong>📝 Worksheet Available</Text>
                            <Text className="block text-sm mt-1">
                                You missed this event. Please complete the worksheet to fulfill your homework requirement.
                            </Text>
                        </div>
                    )}
                    
                    {event.hasSubmission && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded mb-3">
                            <Text strong>✅ Worksheet Submitted</Text>
                            <Text className="block text-sm mt-1">
                                Status: {event.submission?.status || 'pending'}
                            </Text>
                        </div>
                    )}
                </div>
                
                <div className="ml-4">
                    {event.worksheet && (
                        <Button 
                            type={event.hasSubmission ? "default" : "primary"}
                            icon={<FileTextOutlined />}
                            onClick={() => openWorksheet(event)}
                        >
                            {event.hasSubmission ? 'View Submission' : 'Fill Worksheet'}
                        </Button>
                    )}
                    
                    {!event.worksheet && (
                        <Text type="secondary" className="text-sm">
                            No worksheet created for this event
                        </Text>
                    )}
                </div>
            </div>
        </Card>
    )

    if (loading) {
        return <Card loading={true} />
    }

    if (missedEvents.length === 0) {
        return (
            <Card>
                <Empty 
                    description="No missed events"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
            </Card>
        )
    }

    return (
        <>
            <Card title="Missed Events - Complete Your Worksheets">
                <Text type="secondary" className="block mb-4">
                    You missed the following events. Please complete the available worksheets to fulfill your homework requirements.
                </Text>
                
                {missedEvents.map(renderEventCard)}
            </Card>

            <Modal
                title={selectedEvent ? `Worksheet: ${selectedEvent.title}` : 'Worksheet'}
                open={worksheetModalOpen}
                onCancel={() => {
                    setWorksheetModalOpen(false)
                    setSelectedEvent(null)
                }}
                footer={null}
                width={800}
                className="worksheet-modal"
            >
                {selectedEvent && (
                    <WorksheetSubmission
                        eventId={selectedEvent._id}
                        onSubmit={handleWorksheetSubmit}
                    />
                )}
            </Modal>
        </>
    )
}