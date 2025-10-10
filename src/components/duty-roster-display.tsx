'use client'

import { useEffect, useState, useRef } from 'react'
import { Card, message, Table, Alert, Button } from 'antd'
import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'

interface DutyType {
    _id: string
    name: string
}

interface Group {
    _id: string
    name: string
}

interface DutyAssignment {
    _id: string
    group_id: string
    duty_type_id: string
    date: string
}

interface DutyRosterEvent {
    _id: string
    school_id: string
    title: string
    startDate: string
    endDate: string
}

export default function DutyRosterDisplay({
    event,
    userGroupId,
    showEmptyState = false
}: {
    event: DutyRosterEvent
    userGroupId?: string
    showEmptyState?: boolean
}) {
    const [dutyTypes, setDutyTypes] = useState<DutyType[]>([])
    const [groups, setGroups] = useState<Group[]>([])
    const [assignments, setAssignments] = useState<DutyAssignment[]>([])
    const [loading, setLoading] = useState(false)
    const [currentDayIndex, setCurrentDayIndex] = useState(0)

    const eventDays: Date[] = []
    let currentDate = dayjs(event.startDate)
    const endDate = dayjs(event.endDate)
    while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, 'day')) {
        eventDays.push(currentDate.toDate())
        currentDate = currentDate.add(1, 'day')
    }

    // Find today's index in the event days
    const todayIndex = eventDays.findIndex(date => dayjs(date).isSame(dayjs(), 'day'))
    const initialDayIndex = todayIndex >= 0 ? todayIndex : 0

    useEffect(() => {
        fetchData()
        setCurrentDayIndex(initialDayIndex)
    }, [event._id, event.school_id])

    const fetchData = async () => {
        setLoading(true)
        try {
            if (!event.school_id || !event._id) {
                console.warn('Missing school_id or event._id, skipping duty roster fetch')
                setLoading(false)
                return
            }

            const [dutyTypesRes, groupsRes, assignmentsRes] = await Promise.all([
                fetch(`/api/schools/${event.school_id}/duty-types`),
                fetch(`/api/schools/${event.school_id}/groups`),
                fetch(`/api/events/${event._id}/duty-assignments`)
            ])

            if (dutyTypesRes.ok) {
                const data = await dutyTypesRes.json()
                setDutyTypes(Array.isArray(data) ? data : [])
            }

            if (groupsRes.ok) {
                const data = await groupsRes.json()
                setGroups(Array.isArray(data) ? data : [])
            }

            if (assignmentsRes.ok) {
                const data = await assignmentsRes.json()
                setAssignments(Array.isArray(data) ? data : [])
            }
        } catch (err) {
            console.error(err)
            message.error('Chyba pri načítaní rozvrhu služieb')
        }
        setLoading(false)
    }

    const getAssignment = (groupId: string, date: Date): string => {
        const dateStr = dayjs(date).format('YYYY-MM-DD')
        const assignment = assignments.find(
            a => a.group_id === groupId && dayjs(a.date).format('YYYY-MM-DD') === dateStr
        )

        if (!assignment) return '-'

        const dutyType = dutyTypes.find(dt => dt._id === assignment.duty_type_id)
        return dutyType?.name || '-'
    }

    const isUserGroupAndToday = (groupId: string, date: Date): boolean => {
        const isToday = dayjs(date).isSame(dayjs(), 'day')
        return isToday && groupId === userGroupId
    }

    const columns = [
        {
            title: 'Skupina',
            dataIndex: 'name',
            key: 'name',
            fixed: 'left' as const,
            width: 150,
            render: (name: string, group: Group) => (
                <span style={{
                    fontWeight: group._id === userGroupId ? 'bold' : 'normal',
                    color: group._id === userGroupId ? '#1890ff' : 'inherit'
                }}>
                    {name}
                    {group._id === userGroupId && ' (tvoja skupina)'}
                </span>
            )
        },
        ...eventDays.map((date, index) => ({
            title: dayjs(date).format('ddd DD.MM'),
            key: `day-${index}`,
            width: 150,
            render: (_: any, group: Group) => {
                const duty = getAssignment(group._id, date)
                const isHighlight = isUserGroupAndToday(group._id, date)

                return (
                    <span style={{
                        fontWeight: isHighlight ? 'bold' : 'normal',
                        color: isHighlight ? '#52c41a' : 'inherit',
                        backgroundColor: isHighlight ? '#f6ffed' : 'transparent',
                        padding: isHighlight ? '4px 8px' : '0',
                        borderRadius: isHighlight ? '4px' : '0',
                        display: 'inline-block'
                    }}>
                        {duty}
                    </span>
                )
            }
        }))
    ]

    if (assignments.length === 0 && !loading) {
        if (!showEmptyState) {
            return null // Don't show if no assignments
        }

        return (
            <Card title={`Rozvrh služieb - ${event.title}`} variant="borderless">
                <Alert
                    message="Rozvrh služieb zatiaľ nebol vytvorený"
                    description="Prejdite na detail podujatia a kliknite na 'Generovať rotáciu' alebo vytvorte rozvrh manuálne."
                    type="info"
                    showIcon
                />
            </Card>
        )
    }

    const currentDay = eventDays[currentDayIndex]
    const isToday = dayjs(currentDay).isSame(dayjs(), 'day')

    const goToPreviousDay = () => {
        if (currentDayIndex > 0) {
            setCurrentDayIndex(currentDayIndex - 1)
        }
    }

    const goToNextDay = () => {
        if (currentDayIndex < eventDays.length - 1) {
            setCurrentDayIndex(currentDayIndex + 1)
        }
    }

    const goToToday = () => {
        if (todayIndex >= 0) {
            setCurrentDayIndex(todayIndex)
        }
    }

    // Single day column for current view
    const singleDayColumns = [
        {
            title: 'Skupina',
            dataIndex: 'name',
            key: 'name',
            width: 200,
            render: (name: string, group: Group) => (
                <span style={{
                    fontWeight: group._id === userGroupId ? 'bold' : 'normal',
                    color: group._id === userGroupId ? '#1890ff' : 'inherit'
                }}>
                    {name}
                    {group._id === userGroupId && ' (tvoja skupina)'}
                </span>
            )
        },
        {
            title: dayjs(currentDay).format('dddd, DD.MM.YYYY'),
            key: 'duty',
            render: (_: any, group: Group) => {
                const duty = getAssignment(group._id, currentDay)
                const isHighlight = isUserGroupAndToday(group._id, currentDay)

                return (
                    <span style={{
                        fontWeight: isHighlight ? 'bold' : 'normal',
                        color: isHighlight ? '#52c41a' : 'inherit',
                        backgroundColor: isHighlight ? '#f6ffed' : 'transparent',
                        padding: isHighlight ? '4px 8px' : '0',
                        borderRadius: isHighlight ? '4px' : '0',
                        display: 'inline-block',
                        fontSize: '16px'
                    }}>
                        {duty}
                    </span>
                )
            }
        }
    ]

    return (
        <Card
            title={`Rozvrh služieb - ${event.title}`}
            variant="borderless"
            extra={
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <Button
                        icon={<LeftOutlined />}
                        onClick={goToPreviousDay}
                        disabled={currentDayIndex === 0}
                        size="small"
                    />
                    {!isToday && todayIndex >= 0 && (
                        <Button onClick={goToToday} size="small">
                            Dnes
                        </Button>
                    )}
                    <Button
                        icon={<RightOutlined />}
                        onClick={goToNextDay}
                        disabled={currentDayIndex === eventDays.length - 1}
                        size="small"
                    />
                </div>
            }
        >
            <Table
                dataSource={groups}
                columns={singleDayColumns}
                rowKey="_id"
                loading={loading}
                pagination={false}
                size="small"
            />
        </Card>
    )
}