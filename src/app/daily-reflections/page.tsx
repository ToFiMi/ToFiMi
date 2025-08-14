// src/app/daily-reflections/page.tsx
import { connectToDatabase } from '@/lib/mongo'
import { getToken } from 'next-auth/jwt'
import { cookies } from 'next/headers'
import { Button, Space} from 'antd'
import Link from 'next/link'
import ReflectionsList from "@/app/daily-reflections/reflections-list";
import { DailyReflection } from "@/models/daliy-reflections";
import { ObjectId } from 'mongodb';
import ImportModal from "@/app/daily-reflections/import/modal";

export default async function DailyReflectionsPage() {
    const db = await connectToDatabase()
    const token = await getToken({
        req: { cookies: await cookies() } as any,
        secret: process.env.NEXTAUTH_SECRET,
    })

    const role = token?.role
    const school_id = token?.school_id

    if (!school_id) {
        return (
            <main className="max-w-4xl mx-auto py-10 px-4">
                <div>Neautorizovaný prístup - chýba škola</div>
            </main>
        )
    }

    const reflections = await db.collection<DailyReflection>('daily_reflections')
        .find({ school_id: new ObjectId(school_id) })
        .sort({ date: -1 })
        .toArray()

    return (
        <main className="max-w-4xl mx-auto py-10 px-4">
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
                <div className="flex justify-between items-center mb-4">
                    <h2>Denné zamyslenia</h2>
                    {(role === 'leader' || role === 'animator') && (
                        <><Link href="/daily-reflections/import">
                            <Button type="primary">Importovať</Button>
                        </Link><ImportModal/></>
                    )}
                </div>

                <ReflectionsList reflections={reflections} />
            </Space>
        </main>
    )
}
