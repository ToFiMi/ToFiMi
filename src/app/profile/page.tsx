import { connectToDatabase } from '@/lib/mongo'
import { getToken } from 'next-auth/jwt'
import { cookies } from 'next/headers'
import { ObjectId } from 'mongodb'
import UserCard from '@/app/profile/profile-card'

export default async function ProfilePage() {
    const db = await connectToDatabase()
    const token = await getToken({
        req: { cookies: await cookies() } as any,
        secret: process.env.NEXTAUTH_SECRET
    })

    const userId = token?.id
    if (!userId) return <p>Neprihlásený používateľ</p>

    let user

    if (token?.isAdmin) {
        // Admin – len základné údaje bez škôl
        const basic = await db.collection('users').findOne({ _id: new ObjectId(userId as string) },{ projection: { passwordHash: 0 } })
        if (!basic) return <p>Používateľ neexistuje</p>

        user = {
            _id: basic._id,
            first_name: basic.first_name,
            last_name: basic.last_name,
            email: basic.email,
            schools: [], // prázdny zoznam škôl
        }
    } else {
        // Bežný používateľ – aj školy
        const me = await db.collection('users').aggregate([
            { $match: { _id: new ObjectId(userId as string) } },
            {
                $lookup: {
                    from: 'user_school',
                    localField: '_id',
                    foreignField: 'user_id',
                    as: 'user_school'
                }
            },
            {
                $unwind: {
                    path: '$user_school',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $lookup: {
                    from: 'schools',
                    localField: 'user_school.school_id',
                    foreignField: '_id',
                    as: 'school_info'
                }
            },
            {
                $unwind: {
                    path: '$school_info',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $group: {
                    _id: '$_id',
                    first_name: { $first: '$first_name' },
                    last_name: { $first: '$last_name' },
                    email: { $first: '$email' },
                    schools: {
                        $push: {
                            $cond: {
                                if: { $ne: ['$user_school', null] },
                                then: {
                                    role: '$user_school.role',
                                    school: '$school_info'
                                },
                                else: '$$REMOVE'
                            }
                        }
                    }
                }
            }
        ]).toArray()

        user = me[0]
        
        // Ensure schools array exists and handle case where user has no schools
        if (user) {
            user.schools = user.schools || []
            console.log(user.schools)
        } else {
            // Fallback: get basic user info if aggregation fails
            const basicUser = await db.collection('users').findOne(
                { _id: new ObjectId(userId as string) },
                { projection: { passwordHash: 0 } }
            )
            if (basicUser) {
                user = {
                    _id: basicUser._id,
                    first_name: basicUser.first_name,
                    last_name: basicUser.last_name,
                    email: basicUser.email,
                    schools: []
                }
            }
        }
    }

    return (
        <main className="max-w-3xl mx-auto py-10 px-6">
            <UserCard user={user} active_school_id={token.school_id} />
        </main>
    )
}
