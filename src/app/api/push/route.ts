import webpush from 'web-push';
import { NextRequest, NextResponse } from 'next/server';
import { subscriptions } from '../subscribe/route';

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const privateKey = process.env.NEXT_PUBLIC_VAPID_PRIVATE_KEY!;

webpush.setVapidDetails('mailto:you@example.com', publicKey, privateKey);
// todo: poriešiť aj notifikácie zo servra napr z admin portalu
export async function POST(req: NextRequest) {
    const payload = JSON.stringify({
        title: 'Hello from Next.js!',
        body: 'This is a push message 🎉',
    });

    for (const sub of subscriptions) {
        try {
            await webpush.sendNotification(sub, payload);
        } catch (err) {
            console.error('Push failed:', err);
        }
    }

    return NextResponse.json({ sent: true });
}
