import { ObjectId } from 'mongodb'

export interface Registration {
    _id: ObjectId,
    user_id: ObjectId
    school_id: ObjectId,

    expiresAt: Date,
    createdAt: Date
}
