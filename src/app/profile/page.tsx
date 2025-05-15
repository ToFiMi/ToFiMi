import { connectToDatabase } from '@/lib/mongo'
import { getToken } from 'next-auth/jwt'
import { cookies } from 'next/headers'
import { ObjectId } from 'mongodb'
import { Card, Typography, Divider } from 'antd'
import TagsInput from './tags-input'
import UserCard from "@/app/profile/profile-card";

const { Title, Text } = Typography

export default async function ProfilePage() {
    const db = await connectToDatabase()
    const token = await getToken({
        req: { cookies: await cookies() } as any,
        secret: process.env.NEXTAUTH_SECRET
    })

    const userId = token?.id
    if (!userId) return <p>Neprihlásený používateľ</p>

    const me = await db.collection("users").aggregate([
        { $match: { _id: new ObjectId(userId as string) } },
        {
            $lookup: {
                from: "user_school",
                localField: "_id",
                foreignField: "user_id",
                as: "user_schools"
            }
        },
        { $unwind: "$user_schools" },
        {
            $lookup: {
                from: "schools",
                localField: "user_schools.school_id",
                foreignField: "_id",
                as: "school_info"
            }
        },
        { $unwind: "$school_info" },
        {
            $group: {
                _id: "$_id",
                first_name: { $first: "$first_name" },
                last_name: { $first: "$last_name" },
                email: { $first: "$email" },
                schools: {
                    $push: {
                        role: "$user_schools.role",
                        school: "$school_info"
                    }
                }
            }
        }
    ]).toArray()

    const user = me[0]
// todo: ešte musime spraviť zmenu hesla
    return (
        <main className="max-w-3xl mx-auto py-10 px-6">
            <UserCard user={user}/>
        </main>
    )
}
