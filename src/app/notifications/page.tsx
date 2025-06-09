'use client'

import { Button, Card, Typography, message, Layout, Input, Space } from 'antd'
import { useState } from 'react'

export default function NotificationsPage() {
    const [content, setContent] = useState('')
    const [subject, setSubject] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSendNotification = async () => {
        if (!subject || !content) {
            message.warning('Vyplň predmet aj obsah notifikácie')
            return
        }

        setLoading(true)

        try {
            const res = await fetch('/api/push', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ content, subject }),
            })

            if (res.ok) {
                message.success('🔔 Notifikácia bola odoslaná')
                setContent('')
                setSubject('')
            } else {
                const text = await res.text()
                message.error(`❌ Chyba: ${text}`)
            }
        } catch (error) {
            console.error('❌ Chyba pri push notifikácii:', error)
            message.error('Nastala chyba pri odosielaní')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Layout style={{ padding: '2rem' }}>
            <Card title="Push notifikácie">
                <Typography.Paragraph>
                    Pošle notifikáciu na všetky uložené subscriptiony.
                </Typography.Paragraph>

                <Space direction="vertical" style={{ width: '100%' }}>
                    <Input
                        placeholder="Predmet notifikácie"
                        value={subject}
                        onChange={e => setSubject(e.target.value)}
                    />
                    <Input.TextArea
                        placeholder="Obsah správy"
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        rows={4}
                    />

                    <Button type="primary" onClick={handleSendNotification} loading={loading}>
                        Poslať notifikáciu
                    </Button>
                </Space>
            </Card>
        </Layout>
    )
}
