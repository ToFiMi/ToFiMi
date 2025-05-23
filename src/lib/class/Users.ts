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
}
