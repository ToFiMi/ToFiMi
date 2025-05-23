import { User as UserModel } from "@/models/user"
import { connectToDatabase } from "@/lib/mongo"
import { getToken, JWT } from "next-auth/jwt"
import { NextRequest } from "next/server"
import { ObjectId } from "mongodb"

export class User {
    private db: Awaited<ReturnType<typeof connectToDatabase>>
    private token: JWT

    private constructor(token: JWT, db: Awaited<ReturnType<typeof connectToDatabase>>) {
        this.token = token
        this.db = db
    }

    static async init(req: NextRequest): Promise<User> {
        const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
        if (!token) throw new Error("Unauthorized")

        const db = await connectToDatabase()
        return new User(token, db)
    }

    getToken(): JWT {
        return this.token
    }

    async getCurrentUser(): Promise<UserModel | null> {
        return this.db.collection<UserModel>('users').findOne({ _id: new ObjectId(this.token.id) })
    }

    async getUserById(id: string, with_pass = 0): Promise<UserModel | null> {
        return this.db.collection<UserModel>('users').findOne({ _id: new ObjectId(id) },{projection: { passwordHash: with_pass } })
    }

    async getUserByEmail(email: string, with_pass = 0): Promise<UserModel | null> {
        return this.db.collection<UserModel>('users').findOne({ email }, {projection: { passwordHash: with_pass } })
    }

    async updateUser(id: string, data: Partial<UserModel>) {
        return this.db.collection<UserModel>('users').updateOne(
            { _id: new ObjectId(id) },
            { $set: data }
        )
    }

    async createUser(user: Partial<UserModel>) {
        const { _id, ...userWithoutId } = user
        return this.db.collection<Partial<UserModel>>('users').insertOne(userWithoutId)
    }

    async deleteUser(userId: string) {
        return this.db.collection<UserModel>('users').deleteOne({ _id: new ObjectId(userId) })
    }

    get id(): string {
        return this.token.id
    }

    get email(): string {
        return this.token.email
    }

    get role(): string {
        return this.token.role
    }

    isAdmin(): boolean {
        return !!this.token.isAdmin
    }
}
