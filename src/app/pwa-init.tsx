'use client'

import { useEffect } from 'react'
import { subscribeToPush } from '@/lib/subscribePush'

export function PwaInit() {
    useEffect(() => {
        // ✅ Zaregistruj service worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker
                .register('/sw.js')
                .then(() => console.log('✅ SW registered'))
                .catch(console.error)
        }

        // ✅ Požiadaj o povolenie a subscribni
        async function setupPush() {
            const alreadyAsked = localStorage.getItem('push_asked') === 'true'

            if (!alreadyAsked) {
                const permission = await Notification.requestPermission()
                localStorage.setItem('push_asked', 'true')

                if (permission !== 'granted') {
                    console.log('🔕 Notifikácie boli zamietnuté')
                    return
                }
            }

            if (Notification.permission === 'granted') {
                try {
                    await subscribeToPush(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!)
                    console.log('✅ Subscribed to push')
                } catch (err) {
                    console.error('❌ Subscribing to push failed', err)
                }
            }
        }

        if ('Notification' in window) {
            setupPush()
        }
    }, [])

    return null
}
