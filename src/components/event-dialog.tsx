'use client'

import { useEffect, useState } from 'react'
import {
    DatePicker,
    Form,
    Input,
    InputNumber,
    message,
    Modal,
    Checkbox,
    Divider,
    Switch,
    Card,
    Space,
    Select,
    Button
} from 'antd'
import dayjs, { Dayjs } from 'dayjs'
import { Event } from '@/models/events'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'

dayjs.extend(isSameOrBefore)

interface EventDialogProps {
    open: boolean
    onClose: () => void
    onSuccess: () => void
    schoolId: string
    editingEvent?: Event | null
}

export default function EventDialog({ open, onClose, onSuccess, schoolId, editingEvent }: EventDialogProps) {
    const [form] = Form.useForm()
    const [mealDays, setMealDays] = useState<string[]>([])
    const dateRange: Dayjs[] | null = Form.useWatch('dateRange', form)
    const [availableWorksheets, setAvailableWorksheets] = useState<any[]>([])

    const predefinedHomeworkTypes = [
        { id: 'text-essay', name: 'Textová esej', description: 'Písomná esejová úloha' },
        { id: 'project', name: 'Projekt', description: 'Projektová práca' },
        { id: 'evangelist-discussion', name: 'Evanjelijový rozhovor', description: 'Diskusia o evanjelizácii' },
        { id: 'testimony', name: 'Svedectvo', description: 'Zdieľanie osobného svedectva' }
    ]

    useEffect(() => {
        if (dateRange && dateRange.length === 2 && dateRange[1].isAfter(dateRange[0])) {
            const [start, end] = dateRange
            const days: string[] = []
            let current = start.startOf('day')
            const last = end.startOf('day')
            while (current.isSameOrBefore(last)) {
                days.push(current.format('YYYY-MM-DD'))
                current = current.add(1, 'day')
            }
            setMealDays(days)

            // Set default meals for new events (not editing)
            if (!editingEvent) {
                const mealPresets: Record<string, string[]> = {}
                days.forEach((day, index) => {
                    if (index === 0) {
                        // First day: only dinner
                        mealPresets[day] = ['18:00']
                    } else if (index === days.length - 1) {
                        // Last day: breakfast and lunch
                        mealPresets[day] = ['08:00', '12:30']
                    } else {
                        // Middle days: all meals
                        mealPresets[day] = ['08:00', '12:30', '18:00']
                    }
                })
                form.setFieldsValue({ meals: mealPresets })
            }
        } else {
            setMealDays([])
        }
    }, [dateRange, editingEvent, form])

    useEffect(() => {
        fetchAvailableWorksheets()
    }, [])

    useEffect(() => {
        if (editingEvent) {
            form.setFieldsValue({
                ...editingEvent,
                dateRange: [dayjs(editingEvent.startDate), dayjs(editingEvent.endDate)],
                meals: Object.fromEntries(
                    (editingEvent.meals || []).map((m) => [m.date, m.times])
                ),
                homeworkTypes: (editingEvent.homeworkTypes || []).map(hw => ({
                    ...hw,
                    dueDate: hw.dueDate ? dayjs(hw.dueDate) : undefined
                }))
            })
        } else {
            form.resetFields()
        }
    }, [editingEvent, form])

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

    const handleSubmit = async (values: any) => {
        const meals = Object.entries(values.meals || {}).map(([date, mealList]) => ({
            date,
            times: (mealList as string[]).sort(),
        }))
        const [startDate, endDate] = values.dateRange

        const homeworkTypesData = (values.homeworkTypes || []).map((hw: any) => ({
            id: hw.id,
            name: hw.name,
            description: hw.description,
            required: hw.required || false,
            dueDate: hw.dueDate ? hw.dueDate.toISOString() : undefined
        }))

        const url = editingEvent
            ? `/api/schools/${schoolId}/events/${editingEvent._id}`
            : `/api/schools/${schoolId}/events`

        const res = await fetch(url, {
            method: editingEvent ? 'PUT' : 'POST',
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
            message.success(editingEvent ? 'Termín bol upravený' : 'Termín bol pridaný')
            form.resetFields()
            onSuccess()
            onClose()
        } else {
            const err = await res.text()
            message.error(`Chyba: ${err}`)
        }
    }

    return (
        <Modal
            title={editingEvent ? 'Upraviť termín' : 'Pridať nový termín'}
            open={open}
            onCancel={() => {
                form.resetFields()
                onClose()
            }}
            onOk={() => form.submit()}
            okText={editingEvent ? 'Uložiť' : 'Vytvoriť'}
            width={700}
        >
            <Form layout="vertical" form={form} onFinish={handleSubmit}>
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
                    <DatePicker.RangePicker style={{ width: '100%' }} />
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
                                            Odstrániť
                                        </Button>
                                    }
                                >
                                    <Space direction="vertical" className="w-full">
                                        <Form.Item
                                            {...restField}
                                            name={[name, 'id']}
                                            label="Typ"
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
                                                <Select.Option value="custom">Vlastný typ</Select.Option>
                                            </Select>
                                        </Form.Item>

                                        <Form.Item
                                            {...restField}
                                            name={[name, 'name']}
                                            label="Názov"
                                        >
                                            <Input placeholder="napr. Textová esáž" />
                                        </Form.Item>

                                        <Form.Item
                                            {...restField}
                                            name={[name, 'description']}
                                            label="Popis"
                                        >
                                            <Input.TextArea rows={2} placeholder="Voľiteľný popis" />
                                        </Form.Item>

                                        <Form.Item
                                            {...restField}
                                            name={[name, 'required']}
                                            valuePropName="checked"
                                        >
                                            <Switch /> Povinné
                                        </Form.Item>

                                        <Form.Item
                                            {...restField}
                                            name={[name, 'dueDate']}
                                            label="Termín odovzdania (voliteľné)"
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
                <h4 className="mb-2 font-semibold">Pracovný list pre absentujúcich účastníkov</h4>
                <p className="text-sm text-gray-600 mb-4">
                    Priraďte pracovný list, ktorý môžu vyplniť účastníci, ktorí sa nezúčastnili termínu namiesto písania domácich esejí.
                </p>

                <Form.Item
                    name="worksheet_id"
                    label="Vyberte pracovný list"
                >
                    <Select
                        placeholder="Vyberte existujúci pracovný list"
                        allowClear
                        options={[
                            ...availableWorksheets.map(worksheet => ({
                                value: worksheet._id,
                                label: `${worksheet.title} ${worksheet.school_name ? `(${worksheet.school_name})` : ''}${worksheet.is_template ? ' [Šablóna]' : ''}`,
                                disabled: false
                            }))
                        ]}
                        showSearch
                        filterOption={(input, option) =>
                            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                        }
                    />
                </Form.Item>

            </Form>
        </Modal>
    )
}