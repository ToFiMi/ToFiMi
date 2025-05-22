import { ObjectId } from 'mongodb'

export interface RegistrationTokens {
    token: string,
    school_id: ObjectId,
    email?: string,
    first_name?: string,
    last_name?: string,
    role?: 'animator' | 'leader',
    expiresAt: Date,
    created: Date
}
