'use client'

import {Button, Card, Checkbox, Divider, Form, Input, message, Modal} from 'antd'
import {Event} from '@/models/events'
import {useEffect, useState} from 'react'
import dayjs from 'dayjs'
import {Registration} from "@/models/registrations";

export const RegistrationCard = ({next_event, userRole}: { next_event: Event | null, userRole:string }) => {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [registration, setRegistration] = useState<Registration>(undefined)
    const [editing, setEditing] = useState(false)
    const [isFetching, setIsFetching] = useState(true)
    const [form] = Form.useForm()


    useEffect(() => {
        fetchRegistration()
    }, []);

    const fetchRegistration = async () => {
        if (!next_event?._id) return
        setIsFetching(true)
        try {
            const res = await fetch(`/api/registration?event_id=${next_event._id}`)
            if (!res.ok) return

            const data = await res.json()
            const registration = data[0]
            setRegistration(registration)

            if (registration?.going === false) {
                message.info('Zaznamenaná neúčasť – môžeš zmeniť svoju odpoveď.')
            }

            if (data.length > 1) {
                setRegistration(null)
            }

            if (registration?.meals?.length) {
                form.setFieldsValue({
                    meals: registration.meals.map((m: any) =>
                        JSON.stringify({
                            date: dayjs(m.date).format('YYYY-MM-DD'), // format as simple date string
                            time: m.time
                        })
                    )
                })
            }

        } catch (e) {
            console.error('Chyba pri načítaní registrácie:', e)
        } finally {
            setIsFetching(false)
        }
    }

    const onFinish = async (values: any) => {
        setLoading(true)
        const parsedMeals = Array.isArray(values.meals)
            ? values.meals.map((entry: string) => JSON.parse(entry))
            : []

        const res = await fetch('/api/registration', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                event_id: next_event?._id,
                going: true,
                meals: parsedMeals
            }),
        })

        if (res.ok) {
            message.success('Registrácia prebehla úspešne')
            setOpen(false)
            await fetchRegistration()
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
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                event_id: next_event?._id,
                going: false
            }),
        })

        if (res.ok) {
            message.success('Tvoja neúčasť bola zaznamenaná')
            setOpen(false)
            await fetchRegistration()
        } else {
            const error = await res.text()
            message.error(error || 'Nepodarilo sa odoslať odpoveď')
        }

        setLoading(false)
    }

    return (
        <>
            <Card title={next_event?.title} variant="borderless">
                {!next_event ? (
                    "Neni víkend"
                ) : isFetching ? (
                    <span>Načítavam...</span>
                ) : (
                    <>
                        {registration ? (
                            <div style={{marginBottom: 8}}>
                                {registration.going ? (
                                    <span style={{color: 'green'}}>✅ Zúčastníš sa</span>
                                ) : (
                                    <span style={{color: 'red'}}>❌ Nezúčastníš sa</span>
                                )}
                            </div>
                        ) : (
                            <div style={{marginBottom: 8}}>
                                <span style={{color: 'gray'}}>❓ Zatiaľ si sa nezaregistroval/a</span>
                            </div>
                        )}
                        { (userRole !== 'leader' && userRole !== 'animator' && next_event?.instructions) && (
                            <div style={{ marginBottom: 16 }}>
                                <strong>Inštrukcie:</strong>
                                <div style={{ whiteSpace: 'pre-wrap' }}>{next_event?.instructions}</div>
                            </div>
                        )}


                        {(userRole === 'leader' || userRole === 'animator') && next_event && (
                            <div style={{ marginTop: 16 }}>
                                <Form
                                    layout="vertical"
                                    onFinish={async (values) => {
                                        try {
                                            const res = await fetch(`/api/events/${next_event._id}`, {
                                                method: 'PUT',
                                                headers: {
                                                    'Content-Type': 'application/json',
                                                },
                                                body: JSON.stringify({ instructions: values.instructions }),
                                            })

                                            if (res.ok) {
                                                message.success('Inštrukcie boli uložené')
                                                setEditing(false)
                                            } else {
                                                const error = await res.text()
                                                message.error(error || 'Nepodarilo sa uložiť inštrukcie')
                                            }
                                        } catch (e) {
                                            console.error(e)
                                            message.error('Chyba pri ukladaní inštrukcií')
                                        }
                                    }}
                                    initialValues={{ instructions: next_event?.instructions || '' }}
                                >
                                    <Form.Item label="Poznámka / inštrukcia pre účastníkov" name="instructions">
                                        <div onClick={() => setEditing(true)}>
                                            <Input.TextArea
                                                rows={4}
                                                placeholder="Napíš poznámku alebo inštrukciu..."
                                                readOnly={!editing}
                                                autoSize={{ minRows: 4 }}
                                                defaultValue={next_event?.instructions}
                                                onFocus={() => setEditing(true)}
                                                style={{
                                                    cursor: editing ? 'text' : 'pointer',
                                                    backgroundColor: editing ? '#fff' : '#f5f5f5',
                                                    borderColor: editing ? undefined : '#d9d9d9',
                                                }}
                                            />
                                        </div>
                                    </Form.Item>

                                    {editing && (
                                        <Form.Item>
                                            <Button htmlType="submit" type="primary" size="small">
                                                Uložiť inštrukcie
                                            </Button>
                                        </Form.Item>
                                    )}
                                </Form>
                            </div>
                        )}

                        <Button onClick={() => setOpen(true)} disabled={isFetching}>
                            {registration ? 'Upraviť registráciu' : 'Registrovať'}
                        </Button>
                    </>
                )}
            </Card>

            <Modal
                open={open}
                title={`Účasť na ${next_event?.title}`}
                onCancel={() => setOpen(false)}
                footer={null}
            >
                <Form layout="vertical" onFinish={onFinish} form={form} initialValues={{meals: []}}>
                    <Form.Item name="meals" label="Výber jedál">
                        <Checkbox.Group style={{display: 'flex', flexDirection: 'column'}}>
                            {next_event?.meals?.map((meal, i) => (
                                <div key={i} style={{marginBottom: 12}}>
                                    <strong>{dayjs(meal.date).format('dddd, DD.MM.YYYY')}</strong>
                                    {meal.times.map((time) => {
                                        const value = JSON.stringify({
                                            date: dayjs(meal.date).format('YYYY-MM-DD'), // format as simple date string
                                            time
                                        })

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

                    <Divider/>


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
