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
        { value: 'text', label: 'Short Text' },
        { value: 'textarea', label: 'Long Text (Paragraph)' },
        { value: 'multiple_choice', label: 'Multiple Choice' },
        { value: 'checkbox', label: 'Checkboxes' },
        { value: 'scale', label: 'Scale (1-10)' },
        { value: 'date', label: 'Date' }
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
                message.success(isEditing ? 'Worksheet updated successfully' : 'Worksheet created successfully')
                onSave?.(isEditing ? existingWorksheet._id : result.worksheetId)
            } else {
                const error = await response.text()
                message.error(`Error: ${error}`)
            }
        } catch (error) {
            console.error('Error saving worksheet:', error)
            message.error('Failed to save worksheet')
        }
        setLoading(false)
    }

    const renderQuestionPreview = (question: WorksheetQuestion) => {
        switch (question.type) {
            case 'text':
                return <Input placeholder="Short answer" disabled />
            case 'textarea':
                return <Input.TextArea rows={3} placeholder="Long answer" disabled />
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
        <Card title={existingWorksheet ? "Edit Worksheet" : "Create Worksheet"} className="max-w-4xl mx-auto">
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSave}
                initialValues={existingWorksheet}
            >
                <Form.Item
                    name="title"
                    label="Worksheet Title"
                    rules={[{ required: true, message: 'Please enter worksheet title' }]}
                >
                    <Input placeholder="e.g., Weekend Reflection Worksheet" />
                </Form.Item>

                <Form.Item
                    name="description"
                    label="Description (Optional)"
                >
                    <Input.TextArea 
                        rows={2} 
                        placeholder="Brief description of the worksheet purpose" 
                    />
                </Form.Item>

                <Divider />

                <Form.List name="questions">
                    {(fields, { add, remove }) => (
                        <>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold">Questions</h3>
                                <Button type="dashed" onClick={() => add()}>
                                    + Add Question
                                </Button>
                            </div>

                            {fields.map(({ key, name, ...restField }) => (
                                <Card 
                                    key={key} 
                                    size="small" 
                                    className="mb-4"
                                    title={`Question ${name + 1}`}
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
                                            name={[name, 'question']}
                                            label="Question Text"
                                            rules={[{ required: true, message: 'Enter question text' }]}
                                        >
                                            <Input.TextArea 
                                                placeholder="Enter your question here" 
                                                rows={2}
                                            />
                                        </Form.Item>

                                        <Form.Item
                                            {...restField}
                                            name={[name, 'type']}
                                            label="Question Type"
                                            rules={[{ required: true, message: 'Select question type' }]}
                                        >
                                            <Select 
                                                placeholder="Select question type"
                                                options={questionTypes}
                                            />
                                        </Form.Item>

                                        <Form.Item
                                            {...restField}
                                            name={[name, 'required']}
                                            valuePropName="checked"
                                        >
                                            <Switch /> Required
                                        </Form.Item>

                                        <Form.Item dependencies={[name, 'type']} noStyle>
                                            {({ getFieldValue }) => {
                                                const questionType = getFieldValue(['questions', name, 'type'])
                                                
                                                if (questionType === 'multiple_choice' || questionType === 'checkbox') {
                                                    return (
                                                        <Form.List name={[name, 'options']}>
                                                            {(optionFields, { add: addOption, remove: removeOption }) => (
                                                                <>
                                                                    <label className="block mb-2 font-medium">Options:</label>
                                                                    {optionFields.map(({ key: optionKey, name: optionName }) => (
                                                                        <div key={optionKey} className="flex items-center mb-2">
                                                                            <Form.Item
                                                                                name={optionName}
                                                                                className="flex-1 mb-0 mr-2"
                                                                                rules={[{ required: true, message: 'Enter option text' }]}
                                                                            >
                                                                                <Input placeholder="Option text" />
                                                                            </Form.Item>
                                                                            <Button 
                                                                                type="link" 
                                                                                danger 
                                                                                onClick={() => removeOption(optionName)}
                                                                            >
                                                                                Remove
                                                                            </Button>
                                                                        </div>
                                                                    ))}
                                                                    <Button 
                                                                        type="dashed" 
                                                                        onClick={() => addOption()} 
                                                                        className="mb-2"
                                                                    >
                                                                        + Add Option
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
                                                                label="Min Value"
                                                                initialValue={1}
                                                            >
                                                                <InputNumber min={1} max={10} />
                                                            </Form.Item>
                                                            <Form.Item
                                                                {...restField}
                                                                name={[name, 'scale_max']}
                                                                label="Max Value"
                                                                initialValue={10}
                                                            >
                                                                <InputNumber min={1} max={10} />
                                                            </Form.Item>
                                                            <Form.Item
                                                                {...restField}
                                                                name={[name, 'scale_labels', 'min']}
                                                                label="Min Label (Optional)"
                                                            >
                                                                <Input placeholder="e.g., Strongly Disagree" />
                                                            </Form.Item>
                                                            <Form.Item
                                                                {...restField}
                                                                name={[name, 'scale_labels', 'max']}
                                                                label="Max Label (Optional)"
                                                            >
                                                                <Input placeholder="e.g., Strongly Agree" />
                                                            </Form.Item>
                                                        </div>
                                                    )
                                                }

                                                return null
                                            }}
                                        </Form.Item>

                                        {/* Preview */}
                                        <Form.Item dependencies={[name]} noStyle>
                                            {({ getFieldValue }) => {
                                                const question = getFieldValue(['questions', name])
                                                if (question?.type && question?.question) {
                                                    return (
                                                        <div className="p-3 bg-gray-50 rounded">
                                                            <strong>Preview:</strong>
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

                <Form.Item className="text-center">
                    <Button 
                        type="primary" 
                        htmlType="submit" 
                        loading={loading}
                        size="large"
                    >
                        {existingWorksheet ? 'Update Worksheet' : 'Create Worksheet'}
                    </Button>
                </Form.Item>
            </Form>
        </Card>
    )
}