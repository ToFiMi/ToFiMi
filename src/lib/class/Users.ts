import { connectToDatabase } from '@/lib/mongo'
import { ObjectId } from 'mongodb'
import { User as UserModel } from '@/models/user'

export class Users {
    private db: Awaited<ReturnType<typeof connectToDatabase>>

    private constructor(db: Awaited<ReturnType<typeof connectToDatabase>>) {
        this.db = db
    }

    static async init() {
        const db = await connectToDatabase()
        return new Users(db)
    }

    async getUsers(): Promise<UserModel[]> {
        return this.db.collection<UserModel>('users')
            .find({}, {projection: {passwordHash: 0}})
            .toArray()
    }

    async getUsersBySchoolId(school_id: string): Promise<any[]> {
        return this.db
            .collection('user_school')
            .aggregate([
                {
                    $match: {
                        school_id: new ObjectId(school_id),
                    },
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'user_id',
                        foreignField: '_id',
                        as: 'user',
                    },
                },
                {
                    $unwind: '$user',
                },
                {
                    $project: {
                        _id: 0,
                        school_id: 1,
                        user_id: 1,
                        group_id: 1,
                        role: 1,
                        user: {
                            _id: 1,
                            email: 1,
                            first_name: 1,
                            last_name: 1,
                            isAdmin: 1,
                            created: 1,
                            updated: 1,

                        },
                    },
                },
            ])
            .toArray()
    }

    async searchUsers(query: string, schoolId?: string): Promise<UserModel[]> {
        const regex = { $regex: query, $options: 'i' }

        if (schoolId) {
            const userSchoolLinks = await this.db.collection('user_school')
                .find({ school_id: new ObjectId(schoolId) }, { projection: { user_id: 1 } })
                .toArray()

            const userIds = userSchoolLinks.map(link => link.user_id)

            return this.db.collection<UserModel>('users')
                .find({
                    _id: { $in: userIds },
                    $or: [
                        { email: regex },
                        { first_name: regex },
                        { last_name: regex }
                    ]
                }, { projection: { passwordHash: 0 } })
                .limit(10)
                .toArray()
        }

        return this.db.collection<UserModel>('users')
            .find({
                $or: [
                    { email: regex },
                    { first_name: regex },
                    { last_name: regex }
                ]
            }, { projection: { passwordHash: 0 } })
            .limit(10)
            .toArray()
    }

    async getUsersWithSchool() {


        const pipeline = [
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
                    as: 'school'
                }
            },
            {
                $unwind: {
                    path: '$school',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    passwordHash: 0,
                }
            }
        ]

        const results = await this.db.collection('users').aggregate(pipeline).toArray()

        return results.map((record: any) => ({
            _id: record._id.toString(),
            role: record.role || (record.isAdmin ? 'admin' : 'user'),
            user: {
                first_name: record.first_name,
                last_name: record.last_name,
                email: record.email
            },
            school: record.school?._id
                ? {
                    name: record.school.name
                }
                : undefined
        }))
    }
}
