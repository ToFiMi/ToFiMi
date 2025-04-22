
import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';

export async function POST(req: Request) {
    const { email, password } = await req.json();

    // Check for backoffice user


    let isValid = false;
    const options: any[] = [];



    // Check for school user (UserAccount + memberships)




    if (!isValid) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (options.length === 1) {
        return NextResponse.json({ redirectTo: options[0].url });
    }

    return NextResponse.json({ options });
}
