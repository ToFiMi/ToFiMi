'use client'

import { useState, useEffect } from 'react'
import {
    Card,
    Table,
    Button,
    Input,
    Modal,
    Space,
    Tag,
    Dropdown,
    message,
    Typography,
    Tooltip,
    Popconfirm
} from 'antd'
import {
    PlusOutlined,
    SearchOutlined,
    CopyOutlined,
    EditOutlined,
    EyeOutlined,
    MoreOutlined,
    FileTextOutlined,
    DeleteOutlined
} from '@ant-design/icons'
import WorksheetBuilder from '@/components/worksheet-builder'
import WorksheetPreview from '@/components/worksheet-preview'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { Search } = Input

interface WorksheetLibraryItem {
    _id: string
    school_id: string
    event_id?: string
    title: string
    description?: string
    questions: any[]
    created_by: string
    is_template: boolean
    created: string
    updated: string
    school_name?: string
    creator_name?: string
    question_count: number
    can_edit?: boolean
    can_delete?: boolean
}

export default function WorksheetsPage() {
    const [worksheets, setWorksheets] = useState<WorksheetLibraryItem[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [createModalOpen, setCreateModalOpen] = useState(false)
    const [previewModalOpen, setPreviewModalOpen] = useState(false)
    const [editModalOpen, setEditModalOpen] = useState(false)
    const [selectedWorksheet, setSelectedWorksheet] = useState<WorksheetLibraryItem | null>(null)
    const [editingWorksheet, setEditingWorksheet] = useState<any>(null)

    useEffect(() => {
        fetchWorksheets()
    }, [searchTerm])

    const fetchWorksheets = async () => {
        setLoading(true)
        try {
            const response = await fetch(`/api/worksheets/library?search=${encodeURIComponent(searchTerm)}`, {
                credentials: 'include'
            })

            if (response.ok) {
                const data = await response.json()
                setWorksheets(data)
            }
        } catch (error) {
            console.error('Error fetching worksheets:', error)
            message.error('Failed to load worksheets')
        }
        setLoading(false)
    }

    const handleDuplicate = async (worksheet: WorksheetLibraryItem) => {
        try {
            const response = await fetch(`/api/worksheets/${worksheet._id}/duplicate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    title: `${worksheet.title} (Copy)`,
                    is_template: false
                })
            })

            if (response.ok) {
                message.success('Worksheet duplicated successfully')
                fetchWorksheets()
            } else {
                const error = await response.text()
                message.error(`Error: ${error}`)
            }
        } catch (error) {
            console.error('Error duplicating worksheet:', error)
            message.error('Failed to duplicate worksheet')
        }
    }

    const handleCreateTemplate = async (worksheet: WorksheetLibraryItem) => {
        try {
            const response = await fetch(`/api/worksheets/${worksheet._id}/duplicate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    title: `${worksheet.title} (Template)`,
                    is_template: true
                })
            })

            if (response.ok) {
                message.success('Template created successfully')
                fetchWorksheets()
            } else {
                const error = await response.text()
                message.error(`Error: ${error}`)
            }
        } catch (error) {
            console.error('Error creating template:', error)
            message.error('Failed to create template')
        }
    }

    const handleEdit = async (worksheet: WorksheetLibraryItem) => {
        try {
            const response = await fetch(`/api/worksheets/${worksheet._id}`, {
                credentials: 'include'
            })

            if (response.ok) {
                const data = await response.json()
                setEditingWorksheet(data)
                setEditModalOpen(true)
            } else {
                message.error('Failed to load worksheet for editing')
            }
        } catch (error) {
            console.error('Error loading worksheet:', error)
            message.error('Failed to load worksheet')
        }
    }

    const handleDelete = async (worksheet: WorksheetLibraryItem) => {
        try {
            const response = await fetch(`/api/worksheets/${worksheet._id}`, {
                method: 'DELETE',
                credentials: 'include'
            })

            if (response.ok) {
                message.success('Worksheet deleted successfully')
                fetchWorksheets()
            } else {
                const error = await response.text()
                message.error(`Error: ${error}`)
            }
        } catch (error) {
            console.error('Error deleting worksheet:', error)
            message.error('Failed to delete worksheet')
        }
    }

    const columns = [
        {
            title: 'Title',
            dataIndex: 'title',
            key: 'title',
            render: (title: string, record: WorksheetLibraryItem) => (
                <div>
                    <div className="font-medium">{title}</div>
                    {record.description && (
                        <Text type="secondary" className="text-sm">{record.description}</Text>
                    )}
                </div>
            )
        },
        {
            title: 'School',
            dataIndex: 'school_name',
            key: 'school_name',
            render: (school_name: string) => (
                <Tag color="blue">{school_name || 'Unknown School'}</Tag>
            )
        },
        {
            title: 'Type',
            key: 'type',
            render: (record: WorksheetLibraryItem) => (
                <Tag color={record.is_template ? 'green' : 'orange'}>
                    {record.is_template ? 'Template' : 'Worksheet'}
                </Tag>
            )
        },
        {
            title: 'Questions',
            dataIndex: 'question_count',
            key: 'question_count',
            render: (count: number) => (
                <div className="flex items-center">
                    <FileTextOutlined className="mr-1" />
                    {count}
                </div>
            )
        },
        {
            title: 'Created',
            dataIndex: 'created',
            key: 'created',
            render: (created: string, record: WorksheetLibraryItem) => (
                <div>
                    <div>{dayjs(created).format('DD.MM.YYYY')}</div>
                    <Text type="secondary" className="text-sm">by {record.creator_name}</Text>
                </div>
            )
        },
        {
            title: 'Actions',
            key: 'actions',
            render: (record: WorksheetLibraryItem) => {
                // Determine if user can edit/delete this worksheet
                // This should be calculated on the backend, but for now we'll check here
                const canEdit = record.can_edit !== false // Assume can edit unless explicitly false
                const canDelete = record.can_delete !== false // Assume can delete unless explicitly false

                const menuItems = [
                    {
                        key: 'preview',
                        label: 'Preview',
                        icon: <EyeOutlined />,
                        onClick: () => {
                            setSelectedWorksheet(record)
                            setPreviewModalOpen(true)
                        }
                    },
                    {
                        key: 'duplicate',
                        label: 'Duplicate',
                        icon: <CopyOutlined />,
                        onClick: () => handleDuplicate(record)
                    }
                ]

                // Add edit option if user can edit
                if (canEdit) {
                    menuItems.push({
                        key: 'edit',
                        label: 'Edit',
                        icon: <EditOutlined />,
                        onClick: () => handleEdit(record)
                    })
                }

                // Add template creation option if not already a template
                if (!record.is_template) {
                    menuItems.push({
                        key: 'template',
                        label: 'Create Template',
                        icon: <PlusOutlined />,
                        onClick: () => handleCreateTemplate(record)
                    })
                }

                // Add delete option if user can delete
                if (canDelete) {
                    // @ts-ignore
                    menuItems.push({
                        key: 'delete',
                        label: 'Delete',
                        icon: <DeleteOutlined />,
                        // @ts-ignore
                        danger: true,
                        onClick: () => {} // Handled separately with Popconfirm
                    })
                }

                return (
                    <Space>
                        <Button
                            type="primary"
                            size="small"
                            icon={<EyeOutlined />}
                            onClick={() => {
                                setSelectedWorksheet(record)
                                setPreviewModalOpen(true)
                            }}
                        >
                            Preview
                        </Button>

                        {canEdit && (
                            <Button
                                size="small"
                                icon={<EditOutlined />}
                                onClick={() => handleEdit(record)}
                            >
                                Edit
                            </Button>
                        )}

                        <Dropdown
                            menu={{
                                items: menuItems.filter(item => item.key !== 'edit' && item.key !== 'delete')
                            }}
                            trigger={['click']}
                        >
                            <Button size="small" icon={<MoreOutlined />} />
                        </Dropdown>

                        {canDelete && (
                            <Popconfirm
                                title="Delete worksheet"
                                description="Are you sure you want to delete this worksheet? This action cannot be undone."
                                onConfirm={() => handleDelete(record)}
                                okText="Yes, delete"
                                cancelText="Cancel"
                                okButtonProps={{ danger: true }}
                            >
                                <Button
                                    size="small"
                                    danger
                                    icon={<DeleteOutlined />}
                                />
                            </Popconfirm>
                        )}
                    </Space>
                )
            }
        }
    ]

    return (
        <div className="p-6">
            <Card>
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <Title level={2}>Worksheet Library</Title>
                        <Text type="secondary">
                            Create, manage, and reuse worksheets for events
                        </Text>
                    </div>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setCreateModalOpen(true)}
                    >
                        Create Worksheet
                    </Button>
                </div>

                <div className="mb-4">
                    <Search
                        placeholder="Search worksheets..."
                        allowClear
                        enterButton={<SearchOutlined />}
                        size="large"
                        onSearch={setSearchTerm}
                        onChange={(e) => {
                            if (!e.target.value) {
                                setSearchTerm('')
                            }
                        }}
                    />
                </div>

                <Table
                    dataSource={worksheets}
                    columns={columns}
                    rowKey="_id"
                    loading={loading}
                    pagination={{
                        showSizeChanger: true,
                        showQuickJumper: true,
                        showTotal: (total, range) =>
                            `${range[0]}-${range[1]} of ${total} worksheets`
                    }}
                />
            </Card>

            {/* Create Worksheet Modal */}
            <Modal
                title="Create New Worksheet"
                open={createModalOpen}
                onCancel={() => setCreateModalOpen(false)}
                footer={null}
                width={1000}
            >
                <WorksheetBuilder
                    eventId="" // No event - creating template
                    onSave={(worksheetId) => {
                        message.success('Worksheet created successfully')
                        setCreateModalOpen(false)
                        fetchWorksheets()
                    }}
                />
            </Modal>

            {/* Preview Worksheet Modal */}
            <Modal
                title={`Preview: ${selectedWorksheet?.title}`}
                open={previewModalOpen}
                onCancel={() => {
                    setPreviewModalOpen(false)
                    setSelectedWorksheet(null)
                }}
                footer={null}
                width={800}
            >
                {selectedWorksheet && (
                    <WorksheetPreview worksheet={selectedWorksheet} />
                )}
            </Modal>

            {/* Edit Worksheet Modal */}
            <Modal
                title={`Upraviť pracovný list: ${editingWorksheet?.title}`}
                open={editModalOpen}
                onCancel={() => {
                    setEditModalOpen(false)
                    setEditingWorksheet(null)
                }}
                footer={null}
                width={1000}
            >
                {editingWorksheet && (
                    <WorksheetBuilder
                        existingWorksheet={editingWorksheet}
                        isTemplate={editingWorksheet.is_template}
                        onSave={(worksheetId) => {
                            message.success('Worksheet updated successfully')
                            setEditModalOpen(false)
                            setEditingWorksheet(null)
                            fetchWorksheets()
                        }}
                    />
                )}
            </Modal>
        </div>
    )
}
