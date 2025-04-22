import { NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { Client } from 'pg';

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
        // 1. Vytvor databázu
        const adminClient = new Client({
            host: 'localhost',
            user: 'postgres',
            password: 'postgres',
            port: 5432,
            database: 'postgres',
        });

        await adminClient.connect();
        await adminClient.query(`CREATE DATABASE "${dbName}"`);
        await adminClient.end();
        console.log(`✅ Created DB ${dbName}`);


        // 3. Over tabuľky
        const checkClient = new Client({ connectionString: dbUrl });
        await checkClient.connect();
        const result = await checkClient.query(`
            SELECT table_name FROM information_schema.tables 
            WHERE table_schema = 'public';
        `);
        await checkClient.end();
        console.log(`📦 Tables created in ${dbName}:`, result.rows.map(r => r.table_name));

        // 4. Ulož školu do backoffice DB


        return NextResponse.json({});
    } catch (error: any) {
        console.error('❌ Error creating school DB:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
