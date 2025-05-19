'use client'
import { Card, Typography, Divider, Button, message } from 'antd'
import { useEffect, useState } from 'react'
import TagsInput from './tags-input'
import { subscribeToPush } from '@/lib/subscribePush'

const { Title, Text } = Typography

export default function UserCard({ user }: { user: any }) {
    const [hasPush, setHasPush] = useState(false)
    const [checking, setChecking] = useState(true)

    useEffect(() => {

        navigator.serviceWorker?.ready
            .then(reg => reg.pushManager.getSubscription())
            .then(sub => {
                setHasPush(!!sub)
            })
            .catch(err => console.warn('Push check failed', err))
            .finally(() => setChecking(false))
    }, [])

    const handleEnablePush = async () => {
        try {
            if (Notification.permission !== 'granted') {
                const permission = await Notification.requestPermission()
                if (permission !== 'granted') {
                    message.warning('Notifikácie neboli povolené.')
                    return
                }
            }

            await subscribeToPush(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!)
            message.success('Notifikácie boli zapnuté 🎉')
            setHasPush(true)
        } catch (e) {
            console.error(e)
            message.error('Nepodarilo sa zapnúť notifikácie')
        }
    }

    return (
        <Card>
            <Title level={3}>Môj profil</Title>
            <Text strong>Meno:</Text> <Text>{user.first_name} {user.last_name}</Text><br/>
            <Text strong>Email:</Text> <Text>{user.email}</Text><br/>

            <Text strong>Notifikácie:</Text>{' '}
            {checking ? 'Načítavam...' : hasPush ? (
                <Text type="success">Zapnuté</Text>
            ) : (
                <>
                    <Text type="secondary">Vypnuté</Text>{' '}
                    <Button type="link" onClick={handleEnablePush}>Zapnúť</Button>
                </>
            )}

            <Divider />
            <Title level={4}>Alergie a intolerancie</Title>
            <TagsInput userId={user._id.toString()} />
        </Card>
    )
}
