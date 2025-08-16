'use client'

import { Card, Typography, Space, Tag, Divider } from 'antd'
import { WorksheetQuestion } from '@/models/worksheet'

const { Title, Text } = Typography

interface WorksheetPreviewProps {
    worksheet: {
        title: string
        description?: string
        questions: WorksheetQuestion[]
        school_name?: string
        creator_name?: string
        is_template: boolean
        created: string
    }
}

export default function WorksheetPreview({ worksheet }: WorksheetPreviewProps) {
    const renderQuestionPreview = (question: WorksheetQuestion, index: number) => {
        const renderAnswerArea = () => {
            switch (question.type) {
                case 'text':
                    return (
                        <div className="border rounded p-2 bg-gray-50 text-gray-500">
                            Short text answer...
                        </div>
                    )
                case 'textarea':
                    return (
                        <div className="border rounded p-2 bg-gray-50 text-gray-500 min-h-20">
                            Long text answer...
                        </div>
                    )
                case 'multiple_choice':
                    return (
                        <div className="space-y-2">
                            {question.options?.map((option, idx) => (
                                <div key={idx} className="flex items-center">
                                    <div className="w-4 h-4 border border-gray-300 rounded-full mr-2"></div>
                                    <span>{option}</span>
                                </div>
                            ))}
                        </div>
                    )
                case 'checkbox':
                    return (
                        <div className="space-y-2">
                            {question.options?.map((option, idx) => (
                                <div key={idx} className="flex items-center">
                                    <div className="w-4 h-4 border border-gray-300 rounded mr-2"></div>
                                    <span>{option}</span>
                                </div>
                            ))}
                        </div>
                    )
                case 'scale':
                    const min = question.scale_min || 1
                    const max = question.scale_max || 10
                    return (
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-500">
                                    {question.scale_labels?.min || min}
                                </span>
                                <span className="text-sm text-gray-500">
                                    {question.scale_labels?.max || max}
                                </span>
                            </div>
                            <div className="flex space-x-1">
                                {Array.from({ length: max - min + 1 }, (_, i) => (
                                    <div 
                                        key={i} 
                                        className="w-8 h-8 border border-gray-300 rounded text-center leading-8 text-sm"
                                    >
                                        {min + i}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )
                case 'date':
                    return (
                        <div className="border rounded p-2 bg-gray-50 text-gray-500">
                            Select date...
                        </div>
                    )
                default:
                    return <div className="text-gray-500">Unknown question type</div>
            }
        }

        return (
            <Card key={question.id} size="small" className="mb-4">
                <div className="mb-3">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <Text strong className="text-base">
                                {index + 1}. {question.question}
                            </Text>
                            {question.required && (
                                <span className="text-red-500 ml-1">*</span>
                            )}
                        </div>
                        <Tag color="blue" className="ml-2">
                            {question.type.replace('_', ' ')}
                        </Tag>
                    </div>
                </div>
                
                <div className="mt-3">
                    {renderAnswerArea()}
                </div>
            </Card>
        )
    }

    return (
        <div>
            <div className="mb-6">
                <Title level={3}>{worksheet.title}</Title>
                
                <Space className="mb-3">
                    <Tag color={worksheet.is_template ? 'green' : 'orange'}>
                        {worksheet.is_template ? 'Template' : 'Worksheet'}
                    </Tag>
                    {worksheet.school_name && (
                        <Tag color="blue">{worksheet.school_name}</Tag>
                    )}
                </Space>

                {worksheet.description && (
                    <Text type="secondary" className="block mb-3">
                        {worksheet.description}
                    </Text>
                )}

                <div className="text-sm text-gray-500">
                    Created by {worksheet.creator_name} • {worksheet.questions.length} questions
                </div>
            </div>

            <Divider />

            <div className="space-y-4">
                <Title level={4}>Questions Preview</Title>
                {worksheet.questions.length === 0 ? (
                    <Text type="secondary">No questions in this worksheet</Text>
                ) : (
                    worksheet.questions.map((question, index) => 
                        renderQuestionPreview(question, index)
                    )
                )}
            </div>
        </div>
    )
}