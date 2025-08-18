'use client'

import { useState, useEffect } from 'react'
import {
    Button,
    Card,
    Form,
    Input,
    Radio,
    Checkbox,
    Rate,
    DatePicker,
    message,
    Divider,
    Space,
    Typography
} from 'antd'
import { Worksheet, WorksheetQuestion } from '@/models/worksheet'
import dayjs from 'dayjs'

const { Title, Text } = Typography

interface WorksheetSubmissionProps {
    eventId: string
    onSubmit?: () => void
}

export default function WorksheetSubmission({ eventId, onSubmit }: WorksheetSubmissionProps) {
    const [form] = Form.useForm()
    const [worksheet, setWorksheet] = useState<Worksheet | null>(null)
    const [loading, setLoading] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [existingSubmission, setExistingSubmission] = useState<any>(null)

    useEffect(() => {
        fetchWorksheet()
        checkExistingSubmission()
    }, [eventId])

    const fetchWorksheet = async () => {
        setLoading(true)
        try {
            const response = await fetch(`/api/worksheets?event_id=${eventId}`, {
                credentials: 'include'
            })
            
            if (response.ok) {
                const data = await response.json()
                setWorksheet(data)
            }
        } catch (error) {
            console.error('Error fetching worksheet:', error)
        }
        setLoading(false)
    }

    const checkExistingSubmission = async () => {
        try {
            const response = await fetch(`/api/worksheets/submissions?event_id=${eventId}`, {
                credentials: 'include'
            })
            
            if (response.ok) {
                const data = await response.json()
                if (data) {
                    setExistingSubmission(data)
                    // Pre-fill form with existing answers
                    const formValues: any = { essay_content: data.essay_content }
                    data.answers?.forEach((answer: any) => {
                        formValues[`answer_${answer.question_id}`] = answer.answer
                    })
                    form.setFieldsValue(formValues)
                }
            }
        } catch (error) {
            console.error('Error checking existing submission:', error)
        }
    }

    const handleSubmit = async (values: any) => {
        if (!worksheet) return

        setSubmitting(true)
        try {
            // Transform form values to answers array
            const answers = worksheet.questions.map(question => ({
                question_id: question.id,
                answer: values[`answer_${question.id}`]
            })).filter(answer => answer.answer !== undefined && answer.answer !== '')

            const response = await fetch('/api/worksheets/submissions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    worksheet_id: worksheet._id,
                    event_id: eventId,
                    answers,
                    essay_content: values.essay_content
                })
            })

            if (response.ok) {
                message.success('Pracovný list bol úspešne odovzdaný')
                onSubmit?.()
            } else {
                const error = await response.text()
                message.error(`Chyba: ${error}`)
            }
        } catch (error) {
            console.error('Error submitting worksheet:', error)
            message.error('Nepodarilo sa odovzdať pracovný list')
        }
        setSubmitting(false)
    }

    const renderQuestion = (question: WorksheetQuestion) => {
        const fieldName = `answer_${question.id}`
        
        const rules = question.required ? [{ required: true, message: 'Toto pole je povinné' }] : []

        switch (question.type) {
            case 'text':
                return (
                    <Form.Item
                        name={fieldName}
                        label={
                            <span>
                                {question.question}
                                {question.required && <span className="text-red-500 ml-1">*</span>}
                            </span>
                        }
                        rules={rules}
                    >
                        <Input placeholder="Vaša odpoveď" />
                    </Form.Item>
                )

            case 'textarea':
                return (
                    <Form.Item
                        name={fieldName}
                        label={
                            <span>
                                {question.question}
                                {question.required && <span className="text-red-500 ml-1">*</span>}
                            </span>
                        }
                        rules={rules}
                    >
                        <Input.TextArea rows={4} placeholder="Vaša odpoveď" />
                    </Form.Item>
                )

            case 'multiple_choice':
                return (
                    <Form.Item
                        name={fieldName}
                        label={
                            <span>
                                {question.question}
                                {question.required && <span className="text-red-500 ml-1">*</span>}
                            </span>
                        }
                        rules={rules}
                    >
                        <Radio.Group>
                            <Space direction="vertical">
                                {question.options?.map((option, index) => (
                                    <Radio key={index} value={option}>
                                        {option}
                                    </Radio>
                                ))}
                            </Space>
                        </Radio.Group>
                    </Form.Item>
                )

            case 'checkbox':
                return (
                    <Form.Item
                        name={fieldName}
                        label={
                            <span>
                                {question.question}
                                {question.required && <span className="text-red-500 ml-1">*</span>}
                            </span>
                        }
                        rules={rules}
                    >
                        <Checkbox.Group>
                            <Space direction="vertical">
                                {question.options?.map((option, index) => (
                                    <Checkbox key={index} value={option}>
                                        {option}
                                    </Checkbox>
                                ))}
                            </Space>
                        </Checkbox.Group>
                    </Form.Item>
                )

            case 'scale':
                const min = question.scale_min || 1
                const max = question.scale_max || 10
                return (
                    <Form.Item
                        name={fieldName}
                        label={
                            <span>
                                {question.question}
                                {question.required && <span className="text-red-500 ml-1">*</span>}
                            </span>
                        }
                        rules={rules}
                    >
                        <div>
                            <div className="flex items-center space-x-4 mb-2">
                                <span className="text-sm text-gray-500">
                                    {question.scale_labels?.min || min}
                                </span>
                                <Rate 
                                    count={max - min + 1} 
                                    character={(index) => (
                                        <span className="text-sm font-medium px-2 py-1 border rounded">
                                            {min + index}
                                        </span>
                                    )}
                                />
                                <span className="text-sm text-gray-500">
                                    {question.scale_labels?.max || max}
                                </span>
                            </div>
                            {/* Alternative slider for better UX */}
                            <div className="flex items-center space-x-2 mt-2">
                                <span className="text-sm">{min}</span>
                                <div className="flex space-x-1">
                                    {Array.from({ length: max - min + 1 }, (_, i) => {
                                        const value = min + i
                                        return (
                                            <Button 
                                                key={value} 
                                                size="small"
                                                type={form.getFieldValue(fieldName) === value ? 'primary' : 'default'}
                                                onClick={() => form.setFieldValue(fieldName, value)}
                                            >
                                                {value}
                                            </Button>
                                        )
                                    })}
                                </div>
                                <span className="text-sm">{max}</span>
                            </div>
                        </div>
                    </Form.Item>
                )

            case 'date':
                return (
                    <Form.Item
                        name={fieldName}
                        label={
                            <span>
                                {question.question}
                                {question.required && <span className="text-red-500 ml-1">*</span>}
                            </span>
                        }
                        rules={rules}
                    >
                        <DatePicker style={{ width: '100%' }} />
                    </Form.Item>
                )

            default:
                return null
        }
    }

    if (loading) {
        return <Card loading={true} />
    }

    if (!worksheet) {
        return (
            <Card>
                <Text type="secondary">Žiaden pracovný list nie je dostupný pre túto udalosť.</Text>
            </Card>
        )
    }

    return (
        <Card className="max-w-4xl mx-auto">
            <div className="mb-6">
                <Title level={3}>{worksheet.title}</Title>
                {worksheet.description && (
                    <Text type="secondary" className="block mb-4">
                        {worksheet.description}
                    </Text>
                )}
                
                {existingSubmission && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded mb-4">
                        <Text strong>Tento pracovný list ste už odovzdali. </Text>
                        <Text>Stav: {existingSubmission.status}</Text>
                    </div>
                )}
            </div>

            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                disabled={!!existingSubmission}
            >
                {worksheet.questions.map((question) => (
                    <div key={question.id} className="mb-6">
                        {renderQuestion(question)}
                    </div>
                ))}

                <Divider />

                <Form.Item
                    name="essay_content"
                    label="Dodatočná esáž (Voľiteľné)"
                    help="Môžete napísať dodatočnú esáž, ak sa chcete podeliť o ďalšie myšlienky o tejto udalosti."
                >
                    <Input.TextArea 
                        rows={6} 
                        placeholder="Tu napíšte svoje dodatočné myšlienky..." 
                    />
                </Form.Item>

                {!existingSubmission && (
                    <Form.Item className="text-center">
                        <Button 
                            type="primary" 
                            htmlType="submit" 
                            loading={submitting}
                            size="large"
                        >
                            Odovzdať pracovný list
                        </Button>
                    </Form.Item>
                )}
            </Form>
        </Card>
    )
}