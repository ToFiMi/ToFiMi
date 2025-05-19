'use client'

import { Button, Card, Typography, message, Layout } from 'antd'

export default function NotificationsPage() {
    const handleSendNotification = async () => {
        try {
            const res = await fetch('/api/push', {
                method: 'POST',
            })

            if (res.ok) {
                message.success('🔔 Notifikácia bola odoslaná')
                console.log(res)
            } else {
                const text = await res.text()
                message.error(`Chyba pri odosielaní: ${text}`)
            }
        } catch (error) {
            console.error('❌ Chyba pri push notifikácii:', error)
            message.error('Chyba pri odosielaní notifikácie')
        }
    }

    return (
        <Layout>
            <Card title="Push notifikácie">
                <Typography.Paragraph>
                    Táto stránka slúži na testovanie odosielania push notifikácií na všetky uložené subscriptiony.
                </Typography.Paragraph>

                <Button type="primary" onClick={handleSendNotification}>
                    Poslať testovaciu notifikáciu
                </Button>
            </Card>
        </Layout>
    )
}
