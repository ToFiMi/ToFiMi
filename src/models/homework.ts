import { ObjectId } from 'mongodb'

export interface Homework  {
    _id: ObjectId
    event_id: ObjectId
    user_id: ObjectId
    content:string
    created: Date
    updated: Date
    settings?: {
        themeColor?: string
        features?: string[]
    }
}
