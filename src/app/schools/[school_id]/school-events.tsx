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
    Checkbox,
    Divider,
    Switch,
    Card,
    Space,
    Select
} from 'antd'
import dayjs, {Dayjs} from 'dayjs'
import { Event } from '@/models/events'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import WorksheetBuilder from '@/components/worksheet-builder'

dayjs.extend(isSameOrBefore)

export default function SchoolEvents({ schoolId }: { schoolId: string }) {
    const [events, setEvents] = useState<Event[]>([])
    const [loading, setLoading] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [mealDays, setMealDays] = useState<string[]>([])
    const [editingEvent, setEditingEvent] = useState<Event | null>(null)
    const [form] = Form.useForm()
    const dateRange: Dayjs[] | null = Form.useWatch('dateRange', form);
    const [homeworkTypes, setHomeworkTypes] = useState<{id: string, name: string, description?: string, required: boolean, dueDate?: Date}[]>([])
    const [worksheetModalOpen, setWorksheetModalOpen] = useState(false)
    const [availableWorksheets, setAvailableWorksheets] = useState<any[]>([])

    const predefinedHomeworkTypes = [
        { id: 'text-essay', name: 'Text Essay', description: 'Written essay assignment' },
        { id: 'project', name: 'Project', description: 'Project work assignment' },
        { id: 'evangelist-discussion', name: 'Evangelist Discussion', description: 'Discussion about evangelism' },
        { id: 'testimony', name: 'Testimony', description: 'Personal testimony sharing' }
    ]



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
        fetchAvailableWorksheets()
    }, [schoolId])

    const fetchAvailableWorksheets = async () => {
        try {
            const response = await fetch('/api/worksheets/library', {
                credentials: 'include'
            })
            if (response.ok) {
                const data = await response.json()
                setAvailableWorksheets(data)
            }
        } catch (error) {
            console.error('Error fetching worksheets:', error)
        }
    }

    const handleAddEvent = async (values: any) => {
        const meals = Object.entries(values.meals || {}).map(([date, mealList]) => ({
            date,
            times: (mealList as string[]).sort(),
        }))
        const [startDate, endDate] = values.dateRange;

        // Process homework types
        const homeworkTypesData = (values.homeworkTypes || []).map((hw: any) => ({
            id: hw.id,
            name: hw.name,
            description: hw.description,
            required: hw.required || false,
            dueDate: hw.dueDate ? hw.dueDate.toISOString() : undefined
        }))

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
                meals,
                homeworkTypes: homeworkTypesData,
                worksheet_id: values.worksheet_id && values.worksheet_id !== 'create_new' ? values.worksheet_id : undefined
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

        // Process homework types
        const homeworkTypesData = (values.homeworkTypes || []).map((hw: any) => ({
            id: hw.id,
            name: hw.name,
            description: hw.description,
            required: hw.required || false,
            dueDate: hw.dueDate ? hw.dueDate.toISOString() : undefined
        }))

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
                homeworkTypes: homeworkTypesData,
                worksheet_id: values.worksheet_id && values.worksheet_id !== 'create_new' ? values.worksheet_id : undefined
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
                            ),
                            homeworkTypes: (record.homeworkTypes || []).map(hw => ({
                                ...hw,
                                dueDate: hw.dueDate ? dayjs(hw.dueDate) : undefined
                            }))
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

                    <Divider />
                    <h4 className="mb-2 font-semibold">Domáce úlohy</h4>
                    <Form.List name="homeworkTypes">
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map(({ key, name, ...restField }) => (
                                    <Card
                                        key={key}
                                        size="small"
                                        className="mb-3"
                                        title={`Typ domacej úlohy ${name + 1}`}
                                        extra={
                                            <Button
                                                type="link"
                                                danger
                                                onClick={() => remove(name)}
                                            >
                                                Remove
                                            </Button>
                                        }
                                    >
                                        <Space direction="vertical" className="w-full">
                                            <Form.Item
                                                {...restField}
                                                name={[name, 'id']}
                                                label="Type"
                                                rules={[{ required: true, message: 'Vyber typ domacej úlohy' }]}
                                            >
                                                <Select
                                                    placeholder="Vyber typ domacej úlohy"
                                                    onChange={(value) => {
                                                        const selectedType = predefinedHomeworkTypes.find(t => t.id === value)
                                                        if (selectedType) {
                                                            form.setFieldValue(['homeworkTypes', name, 'name'], selectedType.name)
                                                            form.setFieldValue(['homeworkTypes', name, 'description'], selectedType.description)
                                                        }
                                                    }}
                                                >
                                                    {predefinedHomeworkTypes.map(type => (
                                                        <Select.Option key={type.id} value={type.id}>
                                                            {type.name}
                                                        </Select.Option>
                                                    ))}
                                                    <Select.Option value="custom">Custom Type</Select.Option>
                                                </Select>
                                            </Form.Item>

                                            <Form.Item
                                                {...restField}
                                                name={[name, 'name']}
                                                label="Name"
                                            >
                                                <Input placeholder="e.g., Text Essay" />
                                            </Form.Item>

                                            <Form.Item
                                                {...restField}
                                                name={[name, 'description']}
                                                label="Description"
                                            >
                                                <Input.TextArea rows={2} placeholder="Optional description" />
                                            </Form.Item>

                                            <Form.Item
                                                {...restField}
                                                name={[name, 'required']}
                                                valuePropName="checked"
                                            >
                                                <Switch /> Required
                                            </Form.Item>

                                            <Form.Item
                                                {...restField}
                                                name={[name, 'dueDate']}
                                                label="Due Date (Optional)"
                                            >
                                                <DatePicker style={{ width: '100%' }} />
                                            </Form.Item>
                                        </Space>
                                    </Card>
                                ))}
                                <Form.Item>
                                    <Button
                                        type="dashed"
                                        onClick={() => add()}
                                        block
                                        className="mb-3"
                                    >
                                        + Pridať domácu úlohu
                                    </Button>
                                </Form.Item>
                            </>
                        )}
                    </Form.List>

                    <Divider />
                    <h4 className="mb-2 font-semibold">Worksheet for Missed Participants</h4>
                    <p className="text-sm text-gray-600 mb-4">
                        Assign a worksheet that participants who missed the event can fill out instead of writing homework essays.
                    </p>

                    <Form.Item
                        name="worksheet_id"
                        label="Select Worksheet"
                    >
                        <Select
                            placeholder="Choose an existing worksheet or create new"
                            allowClear
                            options={[
                                { value: 'create_new', label: '+ Create New Worksheet' },
                                ...availableWorksheets.map(worksheet => ({
                                    value: worksheet._id,
                                    label: `${worksheet.title} ${worksheet.school_name ? `(${worksheet.school_name})` : ''}${worksheet.is_template ? ' [Template]' : ''}`,
                                    disabled: false
                                }))
                            ]}
                            onChange={(value) => {
                                if (value === 'create_new') {
                                    setWorksheetModalOpen(true)
                                }
                            }}
                            showSearch
                            filterOption={(input, option) =>
                                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                            }
                        />
                    </Form.Item>

                </Form>
            </Modal>

            {/* Worksheet Builder Modal */}
            <Modal
                title={`Create Worksheet for: ${editingEvent?.title || 'Event'}`}
                open={worksheetModalOpen}
                onCancel={() => setWorksheetModalOpen(false)}
                footer={null}
                width={1000}
                className="worksheet-builder-modal"
            >
                {editingEvent && (
                    <WorksheetBuilder
                        eventId={String(editingEvent._id)}
                        onSave={(worksheetId) => {
                            message.success('Worksheet created successfully')
                            setWorksheetModalOpen(false)
                        }}
                    />
                )}
            </Modal>
        </div>
    )
}
