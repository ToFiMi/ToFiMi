import { NextResponse } from 'next/server';
import { prismaBackoffice } from '@/lib/prisma-backoffice';
import { nanoid } from 'nanoid';
import { Client } from 'pg';
import { execSync } from 'child_process';

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
        // 1. Connect to the default "postgres" DB as admin
        const adminClient = new Client({
            host: 'localhost', // or use "db" if inside Docker Compose
            user: 'postgres',
            password: 'postgres',
            port: 5432,
            database: 'postgres', // must connect to an existing db
        });

        await adminClient.connect();
        await adminClient.query(`CREATE DATABASE "${dbName}"`);
        await adminClient.end();

        // 2. Run Prisma migrations on the new DB
        execSync(
            `DATABASE_URL="${dbUrl}" npx prisma migrate deploy --schema=prisma/das.schema.prisma`,
            { stdio: 'inherit' }
        );

        // 3. Save the school metadata to central backoffice DB
        const school = await prismaBackoffice.school.create({
            data: {
                id: schoolId,
                name,
                db_url: dbUrl,
            },
        });

        return NextResponse.json({ school });
    } catch (error: any) {
        console.error('❌ Error creating school DB:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
