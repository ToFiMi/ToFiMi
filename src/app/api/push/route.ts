// app/api/push/route.ts
import webpush from 'web-push'
import { NextRequest, NextResponse } from 'next/server'
import { subscriptions } from '../subscribe/route'

// ───────────────────────────────────────────────────────────
// 1️⃣  Lazy init – vykoná sa len pri prvom volaní POST
// ───────────────────────────────────────────────────────────
let vapidReady = false

function ensureVapid () {
    if (!vapidReady) {
        const publicKey  = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        const privateKey = process.env.NEXT_PUBLIC_VAPID_PRIVATE_KEY

        if (!publicKey || !privateKey) {
            throw new Error('VAPID keys are missing in env')
        }

        webpush.setVapidDetails('mailto:you@example.com', publicKey, privateKey)
        vapidReady = true
    }
}

// ───────────────────────────────────────────────────────────
// 2️⃣  Route handler
// ───────────────────────────────────────────────────────────
export async function POST (req: NextRequest) {
    ensureVapid()                       // ← inicializuje sa prvý-krát

    const payload = JSON.stringify({
        title: 'Hello from Next.js!',
        body:  'This is a push message 🎉',
    })

    for (const sub of subscriptions) {
        try {
            await webpush.sendNotification(sub, payload)
        } catch (err) {
            console.error('Push failed:', err)
        }
    }

    return NextResponse.json({ sent: true })
}
// todo: poriešiť aj notifikácie zo servra napr z admin portalu
