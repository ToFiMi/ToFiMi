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
    Popconfirm,
    Grid
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
const { useBreakpoint } = Grid

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
    const screens = useBreakpoint()
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
            message.error('Nepodarilo sa načítať pracovné listy')
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
                message.success('Pracovný list bol úspešne duplikovaný')
                fetchWorksheets()
            } else {
                const error = await response.text()
                message.error(`Error: ${error}`)
            }
        } catch (error) {
            console.error('Error duplicating worksheet:', error)
            message.error('Nepodarilo sa duplikovať pracovný list')
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
                message.success('Šablóna bola úspešne vytvorená')
                fetchWorksheets()
            } else {
                const error = await response.text()
                message.error(`Error: ${error}`)
            }
        } catch (error) {
            console.error('Error creating template:', error)
            message.error('Nepodarilo sa vytvoriť šablónu')
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
                message.error('Nepodarilo sa načítať pracovný list na úpravu')
            }
        } catch (error) {
            console.error('Error loading worksheet:', error)
            message.error('Nepodarilo sa načítať pracovný list')
        }
    }

    const handleDelete = async (worksheet: WorksheetLibraryItem) => {
        try {
            const response = await fetch(`/api/worksheets/${worksheet._id}`, {
                method: 'DELETE',
                credentials: 'include'
            })

            if (response.ok) {
                message.success('Pracovný list bol úspešne vymazaný')
                fetchWorksheets()
            } else {
                const error = await response.text()
                message.error(`Error: ${error}`)
            }
        } catch (error) {
            console.error('Error deleting worksheet:', error)
            message.error('Nepodarilo sa vymazať pracovný list')
        }
    }

    const renderMobileCards = () => {
        if (loading) {
            return (
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    {[1, 2, 3].map((i) => (
                        <Card key={i} loading style={{ width: '100%' }} />
                    ))}
                </Space>
            )
        }

        if (worksheets.length === 0) {
            return (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                    <Text type="secondary">
                        Žiadne pracovné listy neboli nájdené
                    </Text>
                </div>
            )
        }

        return (
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                {worksheets.map((worksheet) => (
                    <Card
                        key={worksheet._id}
                        size="small"
                        style={{
                            width: '100%',
                            borderRadius: '8px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                        bodyStyle={{ padding: '16px' }}
                    >
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            gap: '12px'
                        }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                                    <div>
                                        <Text strong style={{ fontSize: '16px', display: 'block' }}>
                                            {worksheet.title}
                                        </Text>
                                        {worksheet.description && (
                                            <Text type="secondary" style={{
                                                fontSize: '12px',
                                                display: 'block',
                                                marginTop: '4px'
                                            }}>
                                                {worksheet.description}
                                            </Text>
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                                        <Tag color="blue" style={{ fontSize: '11px' }}>
                                            {worksheet.school_name || 'Neznáma škola'}
                                        </Tag>
                                        <Tag color={worksheet.is_template ? 'green' : 'orange'} style={{ fontSize: '11px' }}>
                                            {worksheet.is_template ? 'Šablóna' : 'Pracovný list'}
                                        </Tag>
                                        <Text type="secondary" style={{ fontSize: '11px' }}>
                                            <FileTextOutlined /> {worksheet.question_count} otázok
                                        </Text>
                                    </div>

                                    <div>
                                        <Text type="secondary" style={{ fontSize: '11px' }}>
                                            Vytvorené: {dayjs(worksheet.created).format('DD.MM.YYYY')} | {worksheet.creator_name}
                                        </Text>
                                    </div>
                                </Space>
                            </div>

                            <div style={{ minWidth: '120px' }}>
                                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                                    <Button
                                        type="primary"
                                        size="small"
                                        icon={<EyeOutlined />}
                                        onClick={() => {
                                            setSelectedWorksheet(worksheet)
                                            setPreviewModalOpen(true)
                                        }}
                                        style={{ width: '100%', fontSize: '11px' }}
                                    >
                                        Náhľad
                                    </Button>

                                    {worksheet.can_edit !== false && (
                                        <Button
                                            size="small"
                                            icon={<EditOutlined />}
                                            onClick={() => handleEdit(worksheet)}
                                            style={{ width: '100%', fontSize: '11px' }}
                                        >
                                            Upraviť
                                        </Button>
                                    )}

                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        <Button
                                            size="small"
                                            icon={<CopyOutlined />}
                                            onClick={() => handleDuplicate(worksheet)}
                                            style={{ flex: 1, fontSize: '10px' }}
                                            title="Duplikovať"
                                        />

                                        {!worksheet.is_template && (
                                            <Button
                                                size="small"
                                                icon={<PlusOutlined />}
                                                onClick={() => handleCreateTemplate(worksheet)}
                                                style={{ flex: 1, fontSize: '10px' }}
                                                title="Vytvoriť šablónu"
                                            />
                                        )}

                                        {worksheet.can_delete !== false && (
                                            <Popconfirm
                                                title="Vymazať pracovný list"
                                                description="Ste si istí, že chcete vymazať tento pracovný list? Táto akcia sa nedá vrátiť."
                                                onConfirm={() => handleDelete(worksheet)}
                                                okText="Áno, vymazať"
                                                cancelText="Zrušiť"
                                                okButtonProps={{ danger: true }}
                                            >
                                                <Button
                                                    size="small"
                                                    danger
                                                    icon={<DeleteOutlined />}
                                                    style={{ fontSize: '10px' }}
                                                    title="Vymazať"
                                                />
                                            </Popconfirm>
                                        )}
                                    </div>
                                </Space>
                            </div>
                        </div>
                    </Card>
                ))}
            </Space>
        )
    }

    const columns = [
        {
            title: 'Názov',
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
            title: 'Škola',
            dataIndex: 'school_name',
            key: 'school_name',
            render: (school_name: string) => (
                <Tag color="blue">{school_name || 'Neznáma škola'}</Tag>
            )
        },
        {
            title: 'Typ',
            key: 'type',
            render: (record: WorksheetLibraryItem) => (
                <Tag color={record.is_template ? 'green' : 'orange'}>
                    {record.is_template ? 'Šablóna' : 'Pracovný list'}
                </Tag>
            )
        },
        {
            title: 'Otázky',
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
            title: 'Vytvorené',
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
            title: 'Akcie',
            key: 'actions',
            render: (record: WorksheetLibraryItem) => {
                // Determine if user can edit/delete this worksheet
                // This should be calculated on the backend, but for now we'll check here
                const canEdit = record.can_edit !== false // Assume can edit unless explicitly false
                const canDelete = record.can_delete !== false // Assume can delete unless explicitly false

                const menuItems = [
                    {
                        key: 'preview',
                        label: 'Náhľad',
                        icon: <EyeOutlined />,
                        onClick: () => {
                            setSelectedWorksheet(record)
                            setPreviewModalOpen(true)
                        }
                    },
                    {
                        key: 'duplicate',
                        label: 'Duplikovať',
                        icon: <CopyOutlined />,
                        onClick: () => handleDuplicate(record)
                    }
                ]

                // Add edit option if user can edit
                if (canEdit) {
                    menuItems.push({
                        key: 'edit',
                        label: 'Upraviť',
                        icon: <EditOutlined />,
                        onClick: () => handleEdit(record)
                    })
                }

                // Add template creation option if not already a template
                if (!record.is_template) {
                    menuItems.push({
                        key: 'template',
                        label: 'Vytvoriť šablónu',
                        icon: <PlusOutlined />,
                        onClick: () => handleCreateTemplate(record)
                    })
                }

                // Add delete option if user can delete
                if (canDelete) {
                    // @ts-ignore
                    menuItems.push({
                        key: 'delete',
                        label: 'Vymazať',
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
                            Náhľad
                        </Button>

                        {canEdit && (
                            <Button
                                size="small"
                                icon={<EditOutlined />}
                                onClick={() => handleEdit(record)}
                            >
                                Upraviť
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
                                title="Vymazať pracovný list"
                                description="Ste si istí, že chcete vymazať tento pracovný list? Táto akcia sa nedá vrátiť."
                                onConfirm={() => handleDelete(record)}
                                okText="Áno, vymazať"
                                cancelText="Zrušiť"
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
                <div className={`${screens.md ? 'flex justify-between items-center' : 'space-y-4'} mb-6`}>
                    <div>
                        <Title level={2}>Knižnica pracovných listov</Title>
                        <Text type="secondary">
                            Vytvárajte, spravujte a opätovne používajte pracovné listy na akcie
                        </Text>
                    </div>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setCreateModalOpen(true)}
                        block={!screens.md}
                    >
                        Vytvoriť pracovný list
                    </Button>
                </div>

                <div className="mb-4">
                    <Search
                        placeholder="Hľadať pracovné listy..."
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

                {/* Show table on desktop, cards on mobile */}
                {screens.md ? (
                    <Table
                        dataSource={worksheets}
                        columns={columns}
                        rowKey="_id"
                        loading={loading}
                        pagination={{
                            showSizeChanger: true,
                            showQuickJumper: true,
                            showTotal: (total, range) =>
                                `${range[0]}-${range[1]} z ${total} pracovných listov`
                        }}
                        scroll={{ x: true }} // Allow horizontal scroll on smaller screens
                    />
                ) : (
                    <>
                        {renderMobileCards()}
                        {worksheets.length > 0 && (
                            <div style={{ marginTop: '16px', textAlign: 'center' }}>
                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                    Zobrazených: {worksheets.length} pracovných listov
                                </Text>
                            </div>
                        )}
                    </>
                )}
            </Card>

            {/* Create Worksheet Modal */}
            <Modal
                title="Vytvoriť nový pracovný list"
                open={createModalOpen}
                onCancel={() => setCreateModalOpen(false)}
                footer={null}
                width={1000}
            >
                <WorksheetBuilder
                    eventId="" // No event - creating template
                    onSave={(worksheetId) => {
                        message.success('Pracovný list bol úspešne vytvorený')
                        setCreateModalOpen(false)
                        fetchWorksheets()
                    }}
                />
            </Modal>

            {/* Preview Worksheet Modal */}
            <Modal
                title={`Náhľad: ${selectedWorksheet?.title}`}
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
                            message.success('Pracovný list bol úspešne aktualizovaný')
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
