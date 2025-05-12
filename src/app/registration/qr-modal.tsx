'use client'
import { Button, Card, Modal, QRCode, Typography, Space } from 'antd'
import { useState } from 'react'

const { Text, Title } = Typography

export default function QrModal({ school_id }: { school_id?: string }) {
    const [isModalOpen, setIsModalOpen] = useState(false)

    const app = `${process.env.NEXT_PUBLIC_APP_URL}/create_account/${school_id}`

    return (
        <>
            <Card
                title="Pozvi používateľa cez QR kód"

                style={{ maxWidth: 400, margin: '0 auto', textAlign: 'center' }}
                actions={[
                    <Button type="primary" onClick={() => setIsModalOpen(true)} key="open">
                        Zobraziť QR kód
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
                    <QRCode value={app} size={200} />
                    <Text copyable style={{ marginTop: 8 }}>
                        {app}
                    </Text>
                </Space>
            </Modal>
        </>
    )
}
