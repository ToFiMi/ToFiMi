import { getToken } from 'next-auth/jwt'
import { cookies } from 'next/headers'
import { connectToDatabase } from '@/lib/mongo'
import { ObjectId } from 'mongodb'
import UsersPageClient from './users-table'
import QrModal from "@/app/users/qr-modal";

export default async function UsersPage() {
    const token = await getToken({ req: { cookies: cookies() } as any, secret: process.env.NEXTAUTH_SECRET })
    if (!token) return <p>Neautorizovaný prístup</p>

    const db = await connectToDatabase()
    const isAdmin = token.isAdmin
    const school_id = token.school_id ? new ObjectId(token.school_id) : null

    if (isAdmin || school_id) {
        const matchStage = school_id ? [{ $match: { school_id } }] : []

        const pipeline: any[] = [
            ...matchStage,
            {
                $lookup: {
                    from: 'users',
                    let: { userId: '$user_id' },
                    pipeline: [
                        { $match: { $expr: { $eq: ['$_id', '$$userId'] } } },
                        { $project: { passwordHash: 0 } }
                    ],
                    as: 'user'
                }
            },
            { $unwind: '$user' },
            {
                $lookup: {
                    from: 'schools',
                    localField: 'school_id',
                    foreignField: '_id',
                    as: 'school'
                }
            },
            { $unwind: '$school' }
        ]

        const userSchools = await db.collection('user_school').aggregate(pipeline).toArray()

        return <><QrModal existing_token={ ""}/><UsersPageClient
            school_id={String(school_id) as string} initialUsers={userSchools as any} isAdmin={isAdmin}/></>
    }

    return <p>Neautorizovaný prístup</p>
}
