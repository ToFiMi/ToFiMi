import { prismaBackoffice } from '@/lib/prisma-backoffice';
import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';

export async function POST(req: Request) {
    const { email, password } = await req.json();

    // Check for backoffice user
    const adminUser = await prismaBackoffice.backofficeUser.findUnique({
        where: { email },
    });

    let isValid = false;
    const options: any[] = [];

    if (adminUser && await bcrypt.compare(password, adminUser.password)) {
        isValid = true;
        options.push({
            type: 'admin',
            name: 'Backoffice Admin',
            url: '/admin/dashboard',
        });
    }

    // Check for school user (UserAccount + memberships)
    const schoolUser = await prismaBackoffice.userAccount.findUnique({
        where: { email },
        include: {
            memberships: {
                include: { school: true },
            },
        },
    });

    if (schoolUser && await bcrypt.compare(password, schoolUser.password)) {
        isValid = true;

        for (const m of schoolUser.memberships) {
            options.push({
                type: 'school',
                name: m.school.name,
                schoolId: m.school.id,
                role: m.role,
                url: `/${m.school.id}/app`,
            });
        }
    }

    if (!isValid) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    if (options.length === 1) {
        return NextResponse.json({ redirectTo: options[0].url });
    }

    return NextResponse.json({ options });
}
