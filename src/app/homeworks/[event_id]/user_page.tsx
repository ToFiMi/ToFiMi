"use client"

import { Homework } from "@/models/homework"
import { Button, Form, Input, message, Typography } from "antd"
import { useEffect } from "react"


const { Title, Paragraph } = Typography

export default function HomeworkUserPage({ homework, event_id, event_name }: { homework: Homework | null, event_id: string, event_name?: string }) {
    const [form] = Form.useForm()


    useEffect(() => {
        if (homework?.content) {
            form.setFieldsValue({ content: homework.content })
        }

    }, [homework, form, event_name, event_id])



    const handleSubmit = async (values: any) => {

        try {
            const res = await fetch(`/api/homeworks`, {
                method: homework ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({
                    content: values.content,
                    event_id: event_id
                })
            })

            if (res.ok) {
                message.success("Domáca úloha bola uložená")
            } else {
                const err = await res.text()
                message.error(`Chyba: ${err}`)
            }
        } catch (err) {
            console.error(err)
            message.error("Nepodarilo sa uložiť úlohu")
        }
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-sm">
            <Title level={4}>Tvoja domáca úloha</Title>

            <Paragraph>
                Sem môžeš vložiť svoju odpoveď. Animátor si ju neskôr pozrie a môže ti zanechať komentár.
            </Paragraph>

            <Form layout="vertical" form={form} onFinish={handleSubmit}>
                <Form.Item
                    name="content"
                    label="Tvoja odpoveď"
                    rules={[{ required: true, message: "Prosím, zadaj svoju odpoveď." }]}
                >
                    <Input.TextArea
                        placeholder="Napíš svoju domácu úlohu..."

                        rows={6}
                        showCount
                        style={{ resize: 'vertical' }}
                    />
                </Form.Item>

                <Form.Item>
                    <Button type="primary" htmlType="submit">
                        Uložiť
                    </Button>
                </Form.Item>
            </Form>
        </div>
    )
}
