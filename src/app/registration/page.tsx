import Members from '@/app/users/members'
import QrModal from '@/app/users/qr-modal'
import {getToken} from 'next-auth/jwt'
import {cookies} from 'next/headers'
import {Layout, Space} from "antd";
import {connectToDatabase} from "@/lib/mongo";
import {ObjectId} from "mongodb";

export default async function RegistrationPage() {
    const token = await getToken({req: {cookies: await cookies()} as any, secret: process.env.NEXTAUTH_SECRET})
    const schoolId = token?.school_id
    const db = await connectToDatabase()

    const now = new Date()

    const registration_token = await db.collection('registration-tokens').findOne(
        {
            school_id: new ObjectId(schoolId as string),
            expiresAt: { $gte: now },
        },
        { sort: { created: -1 } }
    )

    return (
        <Layout>
            <Space direction={"vertical"} size="middle">
                <header className="bg-white shadow-sm px-8 py-6">
                    <h1 className="text-2xl font-bold">Správa členov školy</h1>
                </header>

                <main>
                    <section>
                        <QrModal existing_token={registration_token?.token || ""} />
                    </section>
                    <br/>
                    <section>
                        <h2 className="text-xl font-semibold mb-2">Zoznam členov</h2>
                        <Members school_id={schoolId as string}/>
                    </section>
                </main>
            </Space>
        </Layout>
    )
}
