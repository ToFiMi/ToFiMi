import webpush from 'web-push';
import { NextRequest, NextResponse } from 'next/server';
import { subscriptions } from '../subscribe/route';

const publicKey = 'BOjNZBW9hQTTZw1ck3LPxMpCWhIQh65fg6Ymd6OSDTaBn5TV4ep6gEsZTpY0gepiwtvQajp_Y497oRntc6Tf6dc';
const privateKey = 'LZ6gd_4FwADmqAEAsv9lLf--SWnkxn3-Dfqrhi4CYgs';

webpush.setVapidDetails('mailto:you@example.com', publicKey, privateKey);

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
