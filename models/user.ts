import { ObjectId } from 'mongodb'

export interface User {
    _id: ObjectId
    first_name: string
    last_name: string
    email: string
    passwordHash: string
    createdAt: Date
    modifiedAt: Date
    isAdmin: boolean
}
