import { ObjectId } from 'mongodb'

export interface PushSubscriptions {
    _id?: ObjectId
    user_id: ObjectId
    endpoint: string
    keys: {
        auth: string
        p256dh: string
    }
    created: Date
}
