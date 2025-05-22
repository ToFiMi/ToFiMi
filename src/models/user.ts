import { ObjectId } from 'mongodb'

export interface User {
    _id: ObjectId
    first_name: string
    last_name: string
    email: string
    passwordHash: string
    created: Date
    updated: Date
    isAdmin: boolean
}
