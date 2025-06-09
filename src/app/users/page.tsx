import {getToken} from 'next-auth/jwt'
import {cookies} from 'next/headers'
import {connectToDatabase} from '@/lib/mongo'
import {ObjectId} from 'mongodb'
import UsersPageClient from './users-table'
import QrModal from "@/app/users/qr-modal";
import {Layout, Space} from "antd";
import {Users} from "@/lib/class/Users";

export default async function UsersPage() {
    const cookieStore = await cookies()
    const token = await getToken({req: {cookies: cookieStore} as any, secret: process.env.NEXTAUTH_SECRET})
    if (!token) return <p>Neautorizovaný prístup</p>

    const db = await connectToDatabase()
    const isAdmin = token.isAdmin
    const school_id = token.school_id ? new ObjectId(token.school_id) : null
    const role = token.role

    if (isAdmin || school_id) {
        const usersInstance = await Users.init()

        const rawUserSchools = isAdmin? await usersInstance.getUsersWithSchool(): await usersInstance.getUsersBySchoolId(school_id.toString())


        function normalizeUserSchools(data: any[]) {
            return data.map((record) => ({
                ...record,
                _id: record._id?.toString(),
                school_id: record.school_id?.toString(),
                user_id: record.user_id?.toString(),
                user: {
                    ...record.user,
                    _id: record.user._id?.toString(),
                },
                school: {
                    ...record.school,
                    _id: record.school._id?.toString(),
                },
            }))
        }

        const userSchools = (rawUserSchools)
        const token = await getToken({req: {cookies: await cookies()} as any, secret: process.env.NEXTAUTH_SECRET})
        const schoolId = token?.school_id
        const registration_token = await db.collection('registration-tokens').findOne(
            {
                school_id: new ObjectId(schoolId as string),
                expiresAt: { $gte: new Date() },
            },
            { sort: { created: -1 } }
        )
        let schools = []
        if(isAdmin) {
            schools =await db.collection('schools').find().toArray()

        }


        return <Layout>
            <Space direction={"vertical"} size="middle">
                <header className="bg-white shadow-sm px-8 py-6">
                    <h1 className="text-2xl font-bold">Správa členov školy</h1>
                </header>
                <main>
                    {!token.isAdmin &&
                       <section>
                           <QrModal existing_token={registration_token?.token || ""}/>
                       </section>
                    }

                    <br/>
                    <section>
                        <UsersPageClient
                            school_id={String(school_id) as string}
                            userRole={role}
                            initialUsers={userSchools as any} isAdmin={isAdmin} schools={schools}/>
                    </section>
                </main>
            </Space>
        </Layout>
    }

    return <p>Neautorizovaný prístup</p>
}
