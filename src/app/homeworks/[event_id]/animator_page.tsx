"use client"

import {Button, Card, Form, Input, List, message, Modal, Typography} from "antd"
import {useState} from "react"
import {ObjectId} from "mongodb";

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

    const handleOpen = (homework: HomeworkWithUser) => {
        setSelectedHomework(homework)
        setModalOpen(true)
        form.resetFields()
    }


    const handleCommentSubmit = async (values: any) => {
        message.success("Komentár zatiaľ len UI – backend neskôr :)")
        form.resetFields()
    }

    return (
        <div className="grid grid-cols-1 gap-4 mt-6">
            <Title level={4}>Domáce úlohy účastníkov</Title>
            <List
                dataSource={homeworks as unknown as HomeworkWithUser[]}
                renderItem={(homework) => (
                    <Card
                        key={homework?._id.toString()}
                        title={`${homework.user?.first_name} ${homework.user?.last_name}`}
                        extra={
                            <Button onClick={() => handleOpen(homework)} type="link">
                                Zobraziť
                            </Button>
                        }
                    >
                        <Text type="secondary">
                            Odovzdané: {homework.created ? new Date(homework.created).toLocaleDateString() : '---'}
                        </Text>
                    </Card>
                )}
            />

            <Modal
                title={`${selectedHomework?.user?.first_name} ${selectedHomework?.user.last_name}`}
                open={modalOpen}
                onCancel={() => setModalOpen(false)}
                footer={null}
                width={700}
            >
                <Paragraph>
                    <Text strong>Odpoveď:</Text>
                </Paragraph>
                <Paragraph style={{whiteSpace: 'pre-line', background: '#fafafa', padding: 12, borderRadius: 6}}>
                    {selectedHomework?.content || "Bez odpovede"}
                </Paragraph>

                <Form form={form} layout="vertical" onFinish={handleCommentSubmit}>
                    <Form.Item name="comment" label="Komentár pre účastníka" rules={[{required: true}]}>
                        <Input.TextArea rows={3} placeholder="Napíš pripomienku alebo spätnú väzbu..."/>
                    </Form.Item>
                    <Form.Item>
                        <Button htmlType="submit" type="primary">Odoslať komentár</Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    )
}
