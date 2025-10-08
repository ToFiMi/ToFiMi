import { ObjectId } from 'mongodb'

export interface RegistrationTokens {
    token: string,
    type: 'invite' | 'password-reset',
    school_id?: ObjectId,
    email?: string,
    first_name?: string,
    last_name?: string,
    role?: 'animator' | 'leader' | 'admin',
    expiresAt: Date,
    created: Date
}
