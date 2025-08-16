"use client"

import {Button, Card, Form, List, message, Modal, Typography, Space, Tag} from "antd"
import {useState, useEffect} from "react"
import {ObjectId} from "mongodb";
import CommentsThread from "@/components/comments/thread";
import {useSearchParams} from "next/navigation";
import {CheckCircleOutlined, CloseCircleOutlined} from "@ant-design/icons";

const {Title, Text, Paragraph} = Typography


export interface HomeworkWithUser {
    _id: ObjectId
    event_id: ObjectId
    user_id: ObjectId
    content: string
    status: "approved" | "pending" | "rejected"
    created: Date
    updated: Date
    user: {
        _id: ObjectId
        first_name: string
        last_name: string
        email: string
    }
}

export default function HomeworkAnimatorPage({homeworks, event_id, event_name}: {
    homeworks: HomeworkWithUser[] | unknown,
    event_id?: string,
    event_name?: string
}) {
    const [selectedHomework, setSelectedHomework] = useState<HomeworkWithUser | null>(null)
    const [modalOpen, setModalOpen] = useState(false)
    const [form] = Form.useForm()
    const searchParams = useSearchParams()
    const userIdParam = searchParams.get('userId')

    // Auto-open homework modal if userId parameter is provided
    useEffect(() => {
        if (userIdParam && homeworks && Array.isArray(homeworks)) {
            const targetHomework = (homeworks as HomeworkWithUser[]).find(
                hw => hw.user_id.toString() === userIdParam
            )
            if (targetHomework) {
                handleOpen(targetHomework)
            }
        }
    }, [userIdParam, homeworks])

    const handleOpen = (homework: HomeworkWithUser) => {
        setSelectedHomework(homework)
        setModalOpen(true)
        form.resetFields()
    }


    const handleCommentSubmit = async (values: any) => {
        message.success("Komentár zatiaľ len UI – backend neskôr :)")
        form.resetFields()
    }

    const handleStatusUpdate = async (status: 'approved' | 'rejected') => {
        if (!selectedHomework) return

        try {
            const response = await fetch(`/api/homeworks/${selectedHomework._id}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ status })
            })

            if (response.ok) {
                message.success(`Domáca úloha bola ${status === 'approved' ? 'schválená' : 'zamietnutá'}`)

                // Update the local state to reflect the change
                setSelectedHomework(prev => prev ? { ...prev, status } : null)

                // Optionally close the modal after a short delay
                setTimeout(() => {
                    setModalOpen(false)
                }, 1500)
            } else {
                message.error('Nepodarilo sa aktualizovať stav domácej úlohy')
            }
        } catch (error) {
            console.error('Error updating homework status:', error)
            message.error('Chyba pri aktualizácii stavu')
        }
    }

    return (
        <div className="grid grid-cols-1 gap-4 mt-6">
            <Title level={4}>Domáce úlohy účastníkov</Title>
            <List
                dataSource={homeworks as unknown as HomeworkWithUser[]}
                renderItem={(homework) => {
                    const isHighlighted = userIdParam && homework.user_id.toString() === userIdParam
                    return (
                        <Card
                            key={homework?._id.toString()}
                            title={`${homework.user?.first_name} ${homework.user?.last_name}`}
                            style={isHighlighted ? {
                                border: '2px solid #1677ff',
                                backgroundColor: '#f6ffed'
                            } : {}}
                            extra={
                                <Button onClick={() => handleOpen(homework)} type="link">
                                    Zobraziť
                                </Button>
                            }
                        >
                            <Space direction="vertical" size="small">
                                <Text type="secondary">
                                    Odovzdané: {homework.created ? new Date(homework.created).toLocaleDateString() : '---'}
                                </Text>
                                <div>
                                    <Text strong>Stav: </Text>
                                    <Tag color={
                                        homework.status === 'approved' ? 'green' :
                                        homework.status === 'rejected' ? 'red' : 'orange'
                                    }>
                                        {homework.status === 'approved' ? 'Schválené' :
                                         homework.status === 'rejected' ? 'Zamietnuté' : 'Čaká na posúdenie'}
                                    </Tag>
                                </div>
                            </Space>
                        </Card>
                    )
                }}
            />

            <Modal
                title={`${selectedHomework?.user?.first_name} ${selectedHomework?.user.last_name}`}
                open={modalOpen}
                onCancel={() => setModalOpen(false)}
                footer={[
                    <Space key="actions">
                        <Button
                            type="primary"
                            icon={<CheckCircleOutlined />}
                            onClick={() => handleStatusUpdate('approved')}
                            disabled={selectedHomework?.status === 'approved'}
                        >
                            Schváliť
                        </Button>
                        <Button
                            danger
                            icon={<CloseCircleOutlined />}
                            onClick={() => handleStatusUpdate('rejected')}
                            disabled={selectedHomework?.status === 'rejected'}
                        >
                            Zamietnuť
                        </Button>
                        <Button onClick={() => setModalOpen(false)}>
                            Zavrieť
                        </Button>
                    </Space>
                ]}
                width={700}
            >
                <div style={{ marginBottom: 16 }}>
                    <Text strong>Stav: </Text>
                    <Tag color={
                        selectedHomework?.status === 'approved' ? 'green' :
                        selectedHomework?.status === 'rejected' ? 'red' : 'orange'
                    }>
                        {selectedHomework?.status === 'approved' ? 'Schválené' :
                         selectedHomework?.status === 'rejected' ? 'Zamietnuté' : 'Čaká na posúdenie'}
                    </Tag>
                </div>
                <Paragraph>
                    <Text strong>Odpoveď:</Text>
                </Paragraph>
                <Paragraph style={{whiteSpace: 'pre-line', background: '#fafafa', padding: 12, borderRadius: 6}}>
                    {selectedHomework?.content || "Bez odpovede"}
                </Paragraph>
                <CommentsThread entity="homework" entityId={selectedHomework?._id.toString() || ""}/>

                {/*<Form form={form} layout="vertical" onFinish={handleCommentSubmit}>*/}
                {/*    <Form.Item name="comment" label="Komentár pre účastníka" rules={[{required: true}]}>*/}
                {/*        <Input.TextArea rows={3} placeholder="Napíš pripomienku alebo spätnú väzbu..."/>*/}
                {/*    </Form.Item>*/}
                {/*    <Form.Item>*/}
                {/*        <Button htmlType="submit" type="primary">Odoslať komentár</Button>*/}
                {/*    </Form.Item>*/}
                {/*</Form>*/}
            </Modal>
        </div>
    )
}
