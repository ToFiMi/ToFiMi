'use client'

import { useEffect, useState } from 'react'
import {
    Button,
    DatePicker,
    Form,
    Input,
    InputNumber,
    message,
    Modal,
    Table,
    Checkbox, Divider
} from 'antd'
import dayjs, {Dayjs} from 'dayjs'
import { Event } from '@/models/events'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'

dayjs.extend(isSameOrBefore)

export default function SchoolEvents({ schoolId }: { schoolId: string }) {
    const [events, setEvents] = useState<Event[]>([])
    const [loading, setLoading] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [mealDays, setMealDays] = useState<string[]>([])
    const [editingEvent, setEditingEvent] = useState<Event | null>(null)
    const [form] = Form.useForm()
    const dateRange: Dayjs[] | null = Form.useWatch('dateRange', form);



    useEffect(() => {
        if (dateRange && dateRange.length === 2 && dateRange[1].isAfter(dateRange[0])) {
            const [start, end] = dateRange;
            const days: string[] = [];
            let current = start.startOf('day');
            const last = end.startOf('day');
            while (current.isSameOrBefore(last)) {
                days.push(current.format('YYYY-MM-DD'));
                current = current.add(1, 'day');
            }
            setMealDays(days);
        } else {
            setMealDays([]);
        }
    }, [dateRange]);



    const fetchEvents = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/schools/${schoolId}/events`, { credentials: 'include' })
            if (res.ok) {
                const data = await res.json()
                setEvents(data)
            } else {
                message.error('Nepodarilo sa načítať termíny')
            }
        } catch (error) {
            console.error(error)
            message.error('Chyba pri načítavaní termínov')
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchEvents()
    }, [schoolId])

    const handleAddEvent = async (values: any) => {
        const meals = Object.entries(values.meals || {}).map(([date, mealList]) => ({
            date,
            times: (mealList as string[]).sort(),
        }))
        const [startDate, endDate] = values.dateRange;


        const res = await fetch(`/api/schools/${schoolId}/events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                title: values.title,
                description: values.description,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                grade: values.grade,
                meals
            })
        })

        if (res.ok) {
            message.success('Termín bol pridaný')
            setIsModalOpen(false)
            form.resetFields()
            fetchEvents()
        } else {
            const err = await res.text()
            message.error(`Chyba: ${err}`)
        }
    }


    const columns = [
        { title: 'Názov', dataIndex: 'title', key: 'title' },
        { title: 'Popis', dataIndex: 'description', key: 'description' },
        {
            title: 'Začiatok',
            dataIndex: 'startDate',
            key: 'startDate',
            render: (d: string) => dayjs(d).format('DD.MM.YYYY')
        },
        {
            title: 'Koniec',
            dataIndex: 'endDate',
            key: 'endDate',
            render: (d: string) => dayjs(d).format('DD.MM.YYYY')
        },
        { title: 'Ročník', dataIndex: 'grade', key: 'grade', render: (g: number) => `${g}. ročník` },
    ]
    const handleUpdateEvent = async (eventId: string, values: any) => {
        const meals = Object.entries(values.meals || {}).map(([date, mealList]) => ({
            date,
            times: (mealList as string[]).sort(),
        }))
        const [startDate, endDate] = values.dateRange;

        const res = await fetch(`/api/schools/${schoolId}/events/${eventId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
                title: values.title,
                description: values.description,
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                grade: values.grade,
                meals,
            }),
        })

        if (res.ok) {
            message.success('Termín bol upravený')
        } else {
            const err = await res.text()
            message.error(`Chyba: ${err}`)
        }
    }

    return (
        <div className="mt-8">
            <div className="flex justify-between items-center mb-2">
                <h2 className="text-xl font-semibold">Termíny</h2>
                <Button type="primary" onClick={() => setIsModalOpen(true)}>Pridať termín</Button>
            </div>

            <Table
                dataSource={events}
                columns={columns}
                rowKey="_id"
                loading={loading}
                rowHoverable
                onRow={(record) => ({
                    onClick: () => {
                        setEditingEvent(record)
                        form.setFieldsValue({
                            ...record,
                            dateRange: [dayjs(record.startDate), dayjs(record.endDate)],
                            meals: Object.fromEntries(
                                (record.meals || []).map((m) => [m.date, m.times])
                            )
                        })
                        setIsModalOpen(true)
                    }
                })}
            />
            <Modal
                title={editingEvent ? 'Upraviť termín' : 'Pridať nový termín'}
                open={isModalOpen}
                onCancel={() => {
                    setIsModalOpen(false)
                    setEditingEvent(null)
                    form.resetFields()
                }}
                onOk={async () => {
                    try {
                        const values = await form.validateFields()
                        if (editingEvent) {
                            await handleUpdateEvent(String(editingEvent._id), values)
                        } else {
                            await handleAddEvent(values)
                        }
                        form.resetFields()
                        setEditingEvent(null)
                        setIsModalOpen(false)
                        await fetchEvents()
                    } catch (err) {
                        console.warn('❌ Validation failed:', err)
                    }
                }}
                okText={editingEvent ? 'Uložiť' : 'Vytvoriť'}
                width={700}
            >
                <Form layout="vertical" form={form} onFinish={handleAddEvent}>
                    <Form.Item name="title" label="Názov termínu" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>

                    <Form.Item name="description" label="Popis">
                        <Input.TextArea rows={2} />
                    </Form.Item>

                    <Form.Item
                        name="dateRange"
                        label="Dátum konania"
                        rules={[{ required: true, message: 'Vyber dátum začiatku a konca' }]}
                    >
                        <DatePicker.RangePicker  style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item name="grade" label="Ročník" rules={[{ required: true }]}>
                        <InputNumber min={0} max={10} style={{ width: '100%' }} />
                    </Form.Item>

                    {mealDays.length > 0 && (
                        <>
                            <Divider />
                            <h4 className="mb-2 font-semibold">Jedlá pre jednotlivé dni</h4>
                            {mealDays.map(date => (
                                <Form.Item
                                    key={date}
                                    label={`${dayjs(date).format('dddd DD.MM.YYYY')}`}
                                    name={['meals', date]}
                                >
                                    <Checkbox.Group>
                                        <Checkbox value="08:00">Raňajky (08:00)</Checkbox>
                                        <Checkbox value="12:30">Obed (12:30)</Checkbox>
                                        <Checkbox value="18:00">Večera (18:00)</Checkbox>
                                    </Checkbox.Group>
                                </Form.Item>
                            ))}
                        </>
                    )}

                </Form>
            </Modal>
        </div>
    )
}
