'use client'

import { useState } from 'react'
import {
    Button,
    Card,
    Form,
    Input,
    Select,
    Switch,
    InputNumber,
    Space,
    message,
    Modal,
    Divider
} from 'antd'
import { WorksheetQuestion } from '@/models/worksheet'

interface WorksheetBuilderProps {
    eventId?: string // optional for standalone worksheet creation
    onSave?: (worksheetId: string) => void
    existingWorksheet?: any
    isTemplate?: boolean // whether this is a reusable template
}

export default function WorksheetBuilder({ eventId, onSave, existingWorksheet, isTemplate }: WorksheetBuilderProps) {
    const [form] = Form.useForm()
    const [loading, setLoading] = useState(false)

    const questionTypes = [
        { value: 'text', label: 'Krátky text' },
        { value: 'textarea', label: 'Dlhý text (Odstavec)' },
        { value: 'multiple_choice', label: 'Výber z možností' },
        { value: 'checkbox', label: 'Zaškrtávacie políčka' },
        { value: 'scale', label: 'Stupnica (1-10)' },
        { value: 'date', label: 'Dátum' }
    ]

    const handleSave = async (values: any) => {
        setLoading(true)
        try {
            const isEditing = existingWorksheet && existingWorksheet._id
            const endpoint = isEditing
                ? `/api/worksheets/${existingWorksheet._id}`
                : eventId ? '/api/worksheets' : '/api/worksheets/library'

            const payload: any = {
                title: values.title,
                description: values.description,
                questions: values.questions || [],
                is_template: isTemplate || false
            }

            if (eventId && !isEditing) {
                payload.event_id = eventId
            }

            const response = await fetch(endpoint, {
                method: isEditing ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload)
            })

            if (response.ok) {
                const result = await response.json()
                message.success(isEditing ? 'Pracovný list bol úspešne aktualizovaný' : 'Pracovný list bol úspešne vytvorený')
                onSave?.(isEditing ? existingWorksheet._id : result.worksheetId)
            } else {
                const error = await response.text()
                message.error(`Chyba: ${error}`)
            }
        } catch (error) {
            console.error('Chyba pri ukladaní pracovného listu:', error)
            message.error('Nepodarilo sa uložiť pracovný list')
        }
        setLoading(false)
    }

    const renderQuestionPreview = (question: WorksheetQuestion) => {
        switch (question.type) {
            case 'text':
                return <Input placeholder="Krátka odpoveď" disabled />
            case 'textarea':
                return <Input.TextArea rows={3} placeholder="Dlhá odpoveď" disabled />
            case 'multiple_choice':
                return (
                    <div>
                        {question.options?.map((option, index) => (
                            <div key={index} className="flex items-center mb-2">
                                <input type="radio" disabled className="mr-2" />
                                <span>{option}</span>
                            </div>
                        ))}
                    </div>
                )
            case 'checkbox':
                return (
                    <div>
                        {question.options?.map((option, index) => (
                            <div key={index} className="flex items-center mb-2">
                                <input type="checkbox" disabled className="mr-2" />
                                <span>{option}</span>
                            </div>
                        ))}
                    </div>
                )
            case 'scale':
                return (
                    <div className="flex items-center space-x-2">
                        <span>{question.scale_labels?.min || question.scale_min}</span>
                        <div className="flex space-x-1">
                            {Array.from({ length: (question.scale_max || 10) - (question.scale_min || 1) + 1 }, (_, i) => (
                                <Button key={i} size="small" disabled>
                                    {(question.scale_min || 1) + i}
                                </Button>
                            ))}
                        </div>
                        <span>{question.scale_labels?.max || question.scale_max}</span>
                    </div>
                )
            case 'date':
                return <Input type="date" disabled />
            default:
                return null
        }
    }

    return (
        <Card title={existingWorksheet ? "Upraviť pracovný list" : "Vytvoriť pracovný list"} className="max-w-4xl mx-auto">
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSave}
                initialValues={existingWorksheet}
            >
                <Form.Item
                    name="title"
                    label="Názov pracovného listu"
                    rules={[{ required: true, message: 'Prosím zadajte názov pracovného listu' }]}
                >
                    <Input placeholder="napr. Víkendový reflexný pracovný list" />
                </Form.Item>

                <Form.Item
                    name="description"
                    label="Popis (voliteľné)"
                >
                    <Input.TextArea
                        rows={2}
                        placeholder="Stručný popis účelu pracovného listu"
                    />
                </Form.Item>

                <Divider />

                <Form.List name="questions">
                    {(fields, { add, remove }) => (
                        <>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold">Otázky</h3>
                            </div>

                            {fields.map(({ key, name, ...restField }) => (
                                <Card
                                    key={key}
                                    size="small"
                                    className="mb-4"
                                    title={`Otázka ${name + 1}`}
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
                                            name={[name, 'question']}
                                            label="Text otázky"
                                            rules={[{ required: true, message: 'Zadajte text otázky' }]}
                                        >
                                            <Input.TextArea
                                                placeholder="Zadajte svoju otázku"
                                                rows={2}
                                            />
                                        </Form.Item>

                                        <Form.Item
                                            {...restField}
                                            name={[name, 'type']}
                                            label="Typ otázky"
                                            rules={[{ required: true, message: 'Vyberte typ otázky' }]}
                                        >
                                            <Select
                                                placeholder="Vyberte typ otázky"
                                                options={questionTypes}
                                            />
                                        </Form.Item>

                                        <Form.Item
                                            {...restField}
                                            name={[name, 'required']}
                                            valuePropName="checked"
                                        >
                                            <Switch /> Povinné
                                        </Form.Item>

                                        <Form.Item dependencies={[['questions', name, 'type']]} noStyle>
                                            {({ getFieldValue }) => {
                                                const questionType = getFieldValue(['questions', name, 'type'])

                                                if (questionType === 'multiple_choice' || questionType === 'checkbox') {
                                                    return (
                                                        <Form.List name={[name, 'options']}>
                                                            {(optionFields, { add: addOption, remove: removeOption }) => (
                                                                <>
                                                                    <label className="block mb-2 font-medium">Možnosti:</label>
                                                                    {optionFields.map(({ key: optionKey, name: optionName }) => (
                                                                        <div key={optionKey} className="flex items-center mb-2">
                                                                            <Form.Item
                                                                                name={optionName}
                                                                                className="flex-1 mb-0 mr-2"
                                                                                rules={[{ required: true, message: 'Zadajte text možnosti' }]}
                                                                            >
                                                                                <Input placeholder="Text možnosti" />
                                                                            </Form.Item>
                                                                            <Button
                                                                                type="link"
                                                                                danger
                                                                                onClick={() => removeOption(optionName)}
                                                                            >
                                                                                Odstrániť
                                                                            </Button>
                                                                        </div>
                                                                    ))}
                                                                    <Button
                                                                        type="dashed"
                                                                        onClick={() => addOption()}
                                                                        className="mb-2"
                                                                    >
                                                                        + Pridať možnosť
                                                                    </Button>
                                                                </>
                                                            )}
                                                        </Form.List>
                                                    )
                                                }

                                                if (questionType === 'scale') {
                                                    return (
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <Form.Item
                                                                {...restField}
                                                                name={[name, 'scale_min']}
                                                                label="Minimálna hodnota"
                                                                initialValue={1}
                                                            >
                                                                <InputNumber min={1} max={10} />
                                                            </Form.Item>
                                                            <Form.Item
                                                                {...restField}
                                                                name={[name, 'scale_max']}
                                                                label="Maximálna hodnota"
                                                                initialValue={10}
                                                            >
                                                                <InputNumber min={1} max={10} />
                                                            </Form.Item>
                                                            <Form.Item
                                                                {...restField}
                                                                name={[name, 'scale_labels', 'min']}
                                                                label="Minimálny popis (voliteľné)"
                                                            >
                                                                <Input placeholder="napr. Úplne nesúhlasím" />
                                                            </Form.Item>
                                                            <Form.Item
                                                                {...restField}
                                                                name={[name, 'scale_labels', 'max']}
                                                                label="Maximálny popis (voliteľné)"
                                                            >
                                                                <Input placeholder="napr. Úplne súhlasím" />
                                                            </Form.Item>
                                                        </div>
                                                    )
                                                }

                                                return null
                                            }}
                                        </Form.Item>

                                        {/* Preview */}
                                        <Form.Item dependencies={[['questions', name, 'type'], ['questions', name, 'question'], ['questions', name, 'options'], ['questions', name, 'required']]} noStyle>
                                            {({ getFieldValue }) => {
                                                const question = getFieldValue(['questions', name])
                                                if (question?.type && question?.question) {
                                                    return (
                                                        <div className="p-3 bg-gray-50 rounded">
                                                            <strong>Náhľad:</strong>
                                                            <div className="mt-2">
                                                                <div className="mb-2">
                                                                    {question.question}
                                                                    {question.required && <span className="text-red-500 ml-1">*</span>}
                                                                </div>
                                                                {renderQuestionPreview(question)}
                                                            </div>
                                                        </div>
                                                    )
                                                }
                                                return null
                                            }}
                                        </Form.Item>
                                    </Space>
                                </Card>
                            ))}
                        </>
                    )}
                </Form.List>

                <Form.List name="questions">
                    {(fields, { add }) => (
                        <Form.Item className="text-center">
                            <Space size="middle">
                                <Button
                                    type="dashed"
                                    onClick={() => add()}
                                    size="large"
                                >
                                    + Pridať otázku
                                </Button>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    loading={loading}
                                    size="large"
                                >
                                    {existingWorksheet ? 'Aktualizovať pracovný list' : 'Vytvoriť pracovný list'}
                                </Button>
                            </Space>
                        </Form.Item>
                    )}
                </Form.List>
            </Form>
        </Card>
    )
}
