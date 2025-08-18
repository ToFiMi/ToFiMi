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
        const usersInstance = await Users.init();

        const rawUserSchools = isAdmin
            ? await usersInstance.getUsersWithSchool()
            : await usersInstance.getUsersBySchoolId(school_id.toString());

        const userSchools = rawUserSchools.map(normalizeUserRecord);


        function normalizeUserRecord(record: any) {
            return {
                _id: record._id?.toString(),
                user_id: record.user_id?.toString() ?? record._id?.toString(), // fallback for admin
                school_id: record.school_id?.toString() ?? record.school?._id?.toString(),
                role: record.role || (record.isAdmin ? 'admin' : 'user'),
                user: {
                    _id: record.user?._id?.toString() ?? record._id?.toString(),
                    first_name: record.user?.first_name ?? record.first_name,
                    last_name: record.user?.last_name ?? record.last_name,
                    email: record.user?.email ?? record.email,
                },
                school: record.school?._id
                    ? {
                        _id: record.school._id?.toString(),
                        name: record.school.name,
                    }
                    : undefined,
            };
        }


        const token = await getToken({req: {cookies: await cookies()} as any, secret: process.env.NEXTAUTH_SECRET})
        const schoolId = token?.school_id
        const registration_token = await db.collection('registration-tokens').findOne(
            {
                school_id: new ObjectId(schoolId as string),
                expiresAt: { $gte: new Date() },
                type: 'qr' // Only QR tokens for multiple use
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
