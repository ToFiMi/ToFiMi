'use client'

import { Button, Card, Checkbox, Divider, Form, Modal, message } from 'antd'
import { Event } from '../../models/events'
import { useState } from 'react'
import dayjs from 'dayjs'

export const RegistrationCard = ({ next_event }: { next_event: Event | null }) => {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [form] = Form.useForm()

    const onFinish = async (values: any) => {
        setLoading(true)
        const parsedMeals = Array.isArray(values.meals)
            ? values.meals.map((entry: string) => JSON.parse(entry))
            : []

        const res = await fetch('/api/registration', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                event_id: next_event?._id,
                going: true,
                meals: parsedMeals
            }),
        })

        if (res.ok) {
            message.success('Registrácia prebehla úspešne')
            setOpen(false)
        } else {
            const error = await res.text()
            message.error(error || 'Nepodarilo sa registrovať')
        }

        setLoading(false)
    }

    const notGoing = async () => {
        setLoading(true)
        const res = await fetch('/api/registration', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                event_id: next_event?._id,
                going: false
            }),
        })

        if (res.ok) {
            message.success('Tvoja neúčasť bola zaznamenaná')
            setOpen(false)
        } else {
            const error = await res.text()
            message.error(error || 'Nepodarilo sa odoslať odpoveď')
        }

        setLoading(false)
    }


    return (
        <>
            <Card title={next_event?.title} variant="borderless">
                <Button onClick={() => setOpen(true)}>Registrovať</Button>
            </Card>

            <Modal
                open={open}
                title={`Účasť na ${next_event?.title}`}
                onCancel={() => setOpen(false)}
                footer={null}
            >
                <Form layout="vertical" onFinish={onFinish} form={form} initialValues={{ meals: [] }}>
                    <Form.Item name="meals" label="Výber jedál">
                        <Checkbox.Group style={{ display: 'flex', flexDirection: 'column' }}>
                            {next_event?.meals?.map((meal, i) => (
                                <div key={i} style={{ marginBottom: 12 }}>
                                    <strong>{dayjs(meal.date).format('dddd, DD.MM.YYYY')}</strong>
                                    {meal.times.map((time) => {
                                        const value = JSON.stringify({ date: meal.date, time })
                                        return (
                                            <Checkbox key={value} value={value}>
                                                {time}
                                            </Checkbox>
                                        )
                                    })}
                                </div>
                            ))}
                        </Checkbox.Group>
                    </Form.Item>

                    <Divider />



                    <Button htmlType="submit" type="primary" block loading={loading} className="mt-2">
                        Zúčastním sa
                    </Button>

                    <Button
                        danger
                        type="default"
                        onClick={notGoing}
                        block
                        loading={loading}
                        className="mt-2"
                    >
                        Nezúčastním sa
                    </Button>
                </Form>
            </Modal>
        </>
    )
}
