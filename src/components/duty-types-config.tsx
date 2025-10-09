'use client'

import { useEffect, useState } from 'react'
import { Button, Form, Input, message, Modal, Popconfirm, Table } from 'antd'
import { DeleteOutlined, MenuOutlined } from '@ant-design/icons'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface DutyType {
    _id: string
    school_id: string
    name: string
    order: number
    created: string
    updated: string
}

interface DraggableRowProps {
    'data-row-key': string
    [key: string]: any
}

const DraggableRow = ({ 'data-row-key': key, ...props }: DraggableRowProps) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: key })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        cursor: 'move',
        opacity: isDragging ? 0.5 : 1,
    }

    return <tr ref={setNodeRef} style={style} {...props} {...attributes} {...listeners} />
}

export default function DutyTypesConfig({ schoolId }: { schoolId: string }) {
    const [dutyTypes, setDutyTypes] = useState<DutyType[]>([])
    const [loading, setLoading] = useState(false)
    const [createModalOpen, setCreateModalOpen] = useState(false)
    const [editModalOpen, setEditModalOpen] = useState(false)
    const [selectedDutyType, setSelectedDutyType] = useState<DutyType | null>(null)

    const [form] = Form.useForm()
    const [editForm] = Form.useForm()

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const fetchDutyTypes = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/schools/${schoolId}/duty-types`)
            if (res.ok) {
                const data = await res.json()
                setDutyTypes(data)
            } else {
                message.error('Nepodarilo sa načítať typy služieb')
            }
        } catch (err) {
            console.error(err)
            message.error('Chyba pri načítaní typov služieb')
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchDutyTypes()
    }, [schoolId])

    const handleCreate = async () => {
        try {
            const values = await form.validateFields()

            const res = await fetch(`/api/schools/${schoolId}/duty-types`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: values.name }),
            })

            if (res.ok) {
                message.success('Typ služby vytvorený')
                setCreateModalOpen(false)
                form.resetFields()
                fetchDutyTypes()
            } else {
                const err = await res.text()
                message.error(`Chyba: ${err}`)
            }
        } catch (e) {
            console.error(e)
        }
    }

    const handleEdit = async () => {
        try {
            const values = await editForm.validateFields()

            const res = await fetch(`/api/schools/${schoolId}/duty-types`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    dutyTypeId: selectedDutyType?._id,
                    name: values.name,
                }),
            })

            if (res.ok) {
                message.success('Typ služby upravený')
                setEditModalOpen(false)
                setSelectedDutyType(null)
                editForm.resetFields()
                fetchDutyTypes()
            } else {
                const err = await res.text()
                message.error(`Chyba: ${err}`)
            }
        } catch (e) {
            console.error(e)
        }
    }

    const handleDelete = async (dutyTypeId: string) => {
        try {
            const res = await fetch(`/api/schools/${schoolId}/duty-types`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dutyTypeId }),
            })

            if (res.ok) {
                message.success('Typ služby zmazaný')
                fetchDutyTypes()
            } else {
                const err = await res.text()
                message.error(`Chyba: ${err}`)
            }
        } catch (e) {
            console.error(e)
        }
    }

    const handleDragEnd = async (event: any) => {
        const { active, over } = event

        if (active.id !== over.id) {
            const oldIndex = dutyTypes.findIndex((item) => item._id === active.id)
            const newIndex = dutyTypes.findIndex((item) => item._id === over.id)

            const newOrder = arrayMove(dutyTypes, oldIndex, newIndex)
            setDutyTypes(newOrder)

            // Save new order to backend
            try {
                const reorderedIds = newOrder.map(dt => dt._id)
                const res = await fetch(`/api/schools/${schoolId}/duty-types`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ reorderedIds }),
                })

                if (!res.ok) {
                    message.error('Nepodarilo sa uložiť nové poradie')
                    fetchDutyTypes() // Reload on error
                }
            } catch (e) {
                console.error(e)
                message.error('Chyba pri ukladaní poradia')
                fetchDutyTypes()
            }
        }
    }

    const columns = [
        {
            title: <MenuOutlined />,
            dataIndex: 'drag',
            width: 40,
            render: () => <MenuOutlined style={{ cursor: 'move' }} />,
        },
        {
            title: 'Názov služby',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: '',
            key: 'edit',
            render: (_: any, record: DutyType) => (
                <Button
                    type="link"
                    onClick={() => {
                        setSelectedDutyType(record)
                        editForm.setFieldsValue({ name: record.name })
                        setEditModalOpen(true)
                    }}
                >
                    Upraviť
                </Button>
            ),
        },
        {
            title: '',
            key: 'action',
            width: 40,
            render: (_: any, record: DutyType) => (
                <Popconfirm
                    title="Naozaj chceš zmazať tento typ služby?"
                    onConfirm={() => handleDelete(record._id)}
                    okText="Áno"
                    cancelText="Nie"
                >
                    <Button type="text" danger icon={<DeleteOutlined />} />
                </Popconfirm>
            ),
        },
    ]

    return (
        <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Typy služieb</h2>
                <Button onClick={() => setCreateModalOpen(true)}>Pridať typ služby</Button>
            </div>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={dutyTypes.map(dt => dt._id)} strategy={verticalListSortingStrategy}>
                    <Table
                        components={{
                            body: {
                                row: DraggableRow,
                            },
                        }}
                        dataSource={dutyTypes}
                        columns={columns}
                        rowKey="_id"
                        loading={loading}
                        pagination={false}
                    />
                </SortableContext>
            </DndContext>

            <Modal
                title="Nový typ služby"
                open={createModalOpen}
                onCancel={() => setCreateModalOpen(false)}
                onOk={handleCreate}
                okText="Vytvoriť"
            >
                <Form layout="vertical" form={form}>
                    <Form.Item
                        name="name"
                        label="Názov služby"
                        rules={[{ required: true, message: 'Zadajte názov služby' }]}
                    >
                        <Input placeholder="napr. Kuchyňa, Liturgia, Upratovanie" />
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title="Upraviť typ služby"
                open={editModalOpen}
                onCancel={() => setEditModalOpen(false)}
                onOk={handleEdit}
                okText="Uložiť"
            >
                <Form layout="vertical" form={editForm}>
                    <Form.Item
                        name="name"
                        label="Názov služby"
                        rules={[{ required: true, message: 'Zadajte názov služby' }]}
                    >
                        <Input />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}