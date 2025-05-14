import { ObjectId } from 'mongodb'

export interface RegistrationTokens {
    _id: ObjectId,
    token: string,
    school_id: ObjectId,
    expires: Date,
    created: Date
}
