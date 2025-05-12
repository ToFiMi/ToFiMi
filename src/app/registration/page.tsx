import Members from '@/app/registration/members'
import QrModal from '@/app/registration/qr-modal'
import {getToken} from 'next-auth/jwt'
import {cookies} from 'next/headers'
import {Layout, Space} from "antd";

export default async function RegistrationPage() {
    const token = await getToken({req: {cookies: await cookies()} as any, secret: process.env.NEXTAUTH_SECRET})
    const schoolId = token?.school_id

    return (
        <Layout>
            <Space direction={"vertical"} size="middle">
                <header className="bg-white shadow-sm px-8 py-6">
                    <h1 className="text-2xl font-bold">Správa členov školy</h1>
                </header>

                <main>
                    <section>
                        <QrModal school_id={schoolId as string}/>
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
