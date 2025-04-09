import { NextRequest, NextResponse } from 'next/server';

let subscriptions: any[] = []; // Replace with DB later

export async function POST(req: NextRequest) {
    const sub = await req.json();
    subscriptions.push(sub);
    console.log('New subscription:', sub);
    return NextResponse.json({ success: true });
}

// Optional: Export subscriptions to use in /push
export { subscriptions };
