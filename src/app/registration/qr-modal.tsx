'use client'
import { Button, Card, Modal, QRCode, Typography, Space } from 'antd'
import { useState } from 'react'

const { Text } = Typography

export default function QrModal({ existing_token }: { existing_token?: string }) {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [token, setToken] = useState(existing_token)

    const handleGenerate = async () => {
        if(token){
            setIsModalOpen(true)
            return
        }
        try {
            const res = await fetch("/api/create_account/token", {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                }
            })

            const data = await res.json()
            setToken(data.token)
            setIsModalOpen(true)
        } catch (error) {
            console.error("Token creation failed", error)
        }
    }

    const qrUrl = `${process.env.NEXT_PUBLIC_APP_URL}/create_account/${token}`

    return (
        <>
            <Card
                title="Pozvi používateľa cez QR kód"
                style={{ maxWidth: 400, margin: '0 auto', textAlign: 'center' }}
                actions={[
                    <Button type="primary" onClick={handleGenerate} key="open">
                        Vygenerovať registračný link a QR
                    </Button>,
                ]}
            >
                <Text type="secondary">Naskenuj kód alebo ho otvor na mobile pre rýchlu registráciu</Text>
            </Card>

            <Modal
                title="Registrácia cez QR kód"
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                centered
            >
                <Space direction="vertical" align="center" style={{ width: '100%' }}>
                    <QRCode value={qrUrl} size={200} />
                    <Text copyable style={{ marginTop: 8 }}>
                        {qrUrl}
                    </Text>
                </Space>
            </Modal>
        </>
    )
}
