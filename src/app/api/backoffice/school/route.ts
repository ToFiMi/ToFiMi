import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import { prismaBackoffice } from '../../../../lib/prisma-backoffice';
import { nanoid } from 'nanoid';

export async function POST(req: Request) {
    const body = await req.json();
    const { name } = body;

    if (!name) {
        return NextResponse.json({ error: 'Missing school name' }, { status: 400 });
    }

    const schoolId = `school_${nanoid(8)}`;
    const dbName = `das_${schoolId}`;
    const dbUrl = `postgresql://postgres:postgres@localhost:5432/${dbName}`;

    try {
        // ✅ 1. Vytvor novú databázu
        execSync(`createdb ${dbName}`);

        // ✅ 2. Spusti migráciu pre tenant
        execSync(
            `DATABASE_URL="${dbUrl}" npx prisma migrate deploy --schema=prisma/das.schema.prisma`
        );

        // ✅ 3. Zapíš do backoffice DB
        const school = await prismaBackoffice.school.create({
            data: {
                id: schoolId,
                name,
                db_url: dbUrl,
            },
        });

        return NextResponse.json({ school });
    } catch (error: any) {
        console.error('Create school error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
