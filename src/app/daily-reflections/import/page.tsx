'use client'

import {useEffect, useState} from 'react'
import {Button, Card, Form, Input, Space, Typography, message, Select} from 'antd'
import {useRouter} from 'next/navigation'
import ImportModal from "@/app/daily-reflections/import/modal";

const {Title} = Typography


export default function ImportDailyReflectionsPage() {
    const [form] = Form.useForm()
    const [events, setEvents] = useState([])
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    useEffect(() => {
        async function fetchEvents() {
            try {
                const res = await fetch('/api/events', { credentials: 'include' })
                if (!res.ok)return
                const data = await res.json()
                setEvents(data)
            } catch (e) {
                console.error(e)
                message.error('Nepodarilo sa načítať zoznam termínov')
            }
        }

        fetchEvents()
    }, [])

    const handleSubmit = async (values: any) => {
        setLoading(true)
        try {
            const res = await fetch('/api/daily-reflections/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(values),
            })

            if (res.ok) {
                message.success('Zamyslenia boli importované')
                router.push('/daily-reflections')
            } else {
                const err = await res.text()
                message.error(err || 'Chyba pri importe')
            }
        } catch (e) {
            console.error(e)
            message.error('Chyba pri komunikácii so serverom')
        } finally {
            setLoading(false)
        }
    }

    return (
        <main className="max-w-3xl mx-auto py-10 px-4">
            <Card>
                <Title level={3}>Import zamyslení</Title>

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    initialValues={{ reflections: [{ verse_reference: [{ reference: '', verse: '' }], content: '' }] }}
                >
                    <Form.Item name="event_id" label="Termín (event)" rules={[{ required: true }]}>
                        <Select
                            placeholder="Vyber termín"
                            options={events.map((e: any) => ({
                                label: e.title,
                                value: e._id,
                            }))}
                            showSearch
                            filterOption={(input, option) =>
                                (option?.label as string).toLowerCase().includes(input.toLowerCase())
                            }
                        />
                    </Form.Item>

                    <Form.Item name="start_date" label="Začiatok zamyslení (nepovinné) ak ostane prádne zvolí sa deň po ukončení víkendu">
                        <Input type="date" />
                    </Form.Item>

                    <Form.List name="reflections">
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map(({ key, name, ...restField }) => (
                                    <Card key={key} type="inner" title={`Zamyslenie #${name + 1}`} style={{ marginBottom: 16 }}>
                                        <Form.List name={[name, 'verse_reference']}>
                                            {(verseFields, { add: addVerse, remove: removeVerse }) => (
                                                <>
                                                    {verseFields.map((vf, i) => (
                                                        <Space key={vf.key} align="baseline" style={{ display: 'flex', marginBottom: 8 }}>
                                                            <Form.Item
                                                                {...vf}
                                                                name={[vf.name, 'reference']}
                                                                rules={[{ required: true, message: 'Zadaj odkaz' }]}
                                                            >
                                                                <Input placeholder="Napr. Rim 1, 11-12" />
                                                            </Form.Item>
                                                            <Form.Item
                                                                {...vf}
                                                                name={[vf.name, 'verse']}
                                                                rules={[{ required: true, message: 'Zadaj text verša' }]}
                                                            >
                                                                <Input.TextArea placeholder="Text verša" autoSize />
                                                            </Form.Item>
                                                            <Button type="link" onClick={() => removeVerse(vf.name)} danger>Vymazať</Button>
                                                        </Space>
                                                    ))}
                                                    <Form.Item>
                                                        <Button type="dashed" onClick={() => addVerse()} block>
                                                            Pridať verš
                                                        </Button>
                                                    </Form.Item>
                                                </>
                                            )}
                                        </Form.List>
                                        <Form.Item
                                            {...restField}
                                            name={[name, 'content']}
                                            label="Text zamyslenia"
                                            rules={[{ required: true, message: 'Zadaj obsah zamyslenia' }]}
                                        >
                                            <Input.TextArea rows={4} placeholder="Napíš zamyslenie" />
                                        </Form.Item>
                                        <Button type="link" danger onClick={() => remove(name)}>
                                            Odstrániť celé zamyslenie
                                        </Button>
                                    </Card>
                                ))}
                                <Form.Item>
                                    <Button type="dashed" onClick={() => add()} block>
                                        Pridať ďalšie zamyslenie
                                    </Button>
                                </Form.Item>
                            </>
                        )}
                    </Form.List>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading}>
                            Importovať zamyslenia
                        </Button>
                    </Form.Item>
                </Form>
            </Card>

        </main>
    )
}
