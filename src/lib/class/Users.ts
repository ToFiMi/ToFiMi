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
            .find({}, { projection: { passwordHash: 0 } })
            .toArray()
    }

    async getUsersBySchoolId(school_id: string): Promise<UserModel[]> {
        const userSchools = await this.db
            .collection('user_school')
            .find({ school_id: new ObjectId(school_id) })
            .toArray()

        const userIds = userSchools.map(us => us.user_id)

        return this.db
            .collection<UserModel>('users')
            .find({ _id: { $in: userIds } }, { projection: { passwordHash: 0 } })
            .toArray()
    }

    async searchUsers(query: string): Promise<UserModel[]> {
        const regex = { $regex: query, $options: 'i' }

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

    async getUsersSchools(school_id?: string) {
        const matchStage = school_id
            ? [{ $match: { school_id: new ObjectId(school_id) } }]
            : []

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

        const records = await this.db.collection('user_school').aggregate(pipeline).toArray()

        return records.map((record) => ({
            ...record,
            _id: record._id?.toString(),
            user_id: record.user_id?.toString(),
            school_id: record.school_id?.toString(),
            user: {
                ...record.user,
                _id: record.user._id?.toString()
            },
            school: {
                ...record.school,
                _id: record.school._id?.toString()
            }
        }))
    }
}
