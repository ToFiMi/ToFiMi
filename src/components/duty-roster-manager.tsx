'use client'

import { useEffect, useState } from 'react'
import { Button, message, Select, Table } from 'antd'
import dayjs from 'dayjs'

interface DutyType {
    _id: string
    name: string
    order: number
}

interface Group {
    _id: string
    name: string
}

interface DutyAssignment {
    _id?: string
    school_id: string
    event_id: string
    group_id: string
    duty_type_id: string
    date: string
}

interface Event {
    _id: string
    school_id: string
    startDate: string
    endDate: string
}

export default function DutyRosterManager({ event }: { event: Event }) {
    const [dutyTypes, setDutyTypes] = useState<DutyType[]>([])
    const [groups, setGroups] = useState<Group[]>([])
    const [assignments, setAssignments] = useState<DutyAssignment[]>([])
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)

    const eventDays: Date[] = []
    let currentDate = dayjs(event.startDate)
    const endDate = dayjs(event.endDate)
    while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, 'day')) {
        eventDays.push(currentDate.toDate())
        currentDate = currentDate.add(1, 'day')
    }

    useEffect(() => {
        fetchData()
    }, [event._id, event.school_id])

    const fetchData = async () => {
        setLoading(true)
        try {
            const [dutyTypesRes, groupsRes, assignmentsRes] = await Promise.all([
                fetch(`/api/schools/${event.school_id}/duty-types`),
                fetch(`/api/schools/${event.school_id}/groups`),
                fetch(`/api/events/${event._id}/duty-assignments`)
            ])

            if (dutyTypesRes.ok) {
                const data = await dutyTypesRes.json()
                setDutyTypes(data)
            }

            if (groupsRes.ok) {
                const data = await groupsRes.json()
                setGroups(data)
            }

            if (assignmentsRes.ok) {
                const data = await assignmentsRes.json()
                setAssignments(data)
            }
        } catch (err) {
            console.error(err)
            message.error('Chyba pri načítaní údajov')
        }
        setLoading(false)
    }

    const handleGenerateRotation = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/events/${event._id}/duty-assignments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'generate' })
            })

            if (res.ok) {
                message.success('Rotácia vygenerovaná')
                fetchData()
            } else {
                const err = await res.text()
                message.error(`Chyba: ${err}`)
            }
        } catch (err) {
            console.error(err)
            message.error('Chyba pri generovaní rotácie')
        }
        setLoading(false)
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const res = await fetch(`/api/events/${event._id}/duty-assignments`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ assignments })
            })

            if (res.ok) {
                message.success('Rozvrh služieb uložený')
                fetchData()
            } else {
                const err = await res.text()
                message.error(`Chyba: ${err}`)
            }
        } catch (err) {
            console.error(err)
            message.error('Chyba pri ukladaní')
        }
        setSaving(false)
    }

    const getAssignment = (groupId: string, date: Date): string | undefined => {
        const dateStr = dayjs(date).format('YYYY-MM-DD')
        const assignment = assignments.find(
            a => a.group_id === groupId && dayjs(a.date).format('YYYY-MM-DD') === dateStr
        )
        return assignment?.duty_type_id
    }

    const updateAssignment = (groupId: string, date: Date, dutyTypeId: string) => {
        const dateStr = dayjs(date).toISOString()
        const existingIndex = assignments.findIndex(
            a => a.group_id === groupId && dayjs(a.date).format('YYYY-MM-DD') === dayjs(date).format('YYYY-MM-DD')
        )

        if (existingIndex >= 0) {
            const updated = [...assignments]
            updated[existingIndex] = {
                ...updated[existingIndex],
                duty_type_id: dutyTypeId,
                date: dateStr
            }
            setAssignments(updated)
        } else {
            setAssignments([
                ...assignments,
                {
                    school_id: event.school_id,
                    event_id: event._id,
                    group_id: groupId,
                    duty_type_id: dutyTypeId,
                    date: dateStr
                }
            ])
        }
    }

    const columns = [
        {
            title: 'Skupina',
            dataIndex: 'name',
            key: 'name',
            fixed: 'left' as const,
            width: 150,
        },
        ...eventDays.map((date, index) => ({
            title: dayjs(date).format('ddd DD.MM'),
            key: `day-${index}`,
            width: 150,
            render: (_: any, group: Group) => (
                <Select
                    style={{ width: '100%' }}
                    placeholder="Služba"
                    value={getAssignment(group._id, date)}
                    onChange={(value) => updateAssignment(group._id, date, value)}
                    options={dutyTypes.map(dt => ({ label: dt.name, value: dt._id }))}
                />
            )
        }))
    ]

    return (
        <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Rozvrh služieb</h2>
                <div className="space-x-2">
                    <Button onClick={handleGenerateRotation} loading={loading}>
                        Generovať rotáciu
                    </Button>
                    <Button type="primary" onClick={handleSave} loading={saving}>
                        Uložiť zmeny
                    </Button>
                </div>
            </div>

            {dutyTypes.length === 0 ? (
                <p className="text-gray-500">
                    Najprv nakonfigurujte typy služieb v nastaveniach školy.
                </p>
            ) : groups.length === 0 ? (
                <p className="text-gray-500">
                    Najprv vytvorte skupiny v škole.
                </p>
            ) : (
                <Table
                    dataSource={groups}
                    columns={columns}
                    rowKey="_id"
                    loading={loading}
                    pagination={false}
                    scroll={{ x: 'max-content' }}
                />
            )}
        </div>
    )
}