import { ObjectId } from 'mongodb'

export interface Homework {
    _id: ObjectId
    event_id: ObjectId
    user_id: ObjectId
    content: string
    status: 'approved' | 'pending' | 'rejected'
    comments: Comment[]
    created: Date
    updated: Date
}

export interface Comment {
    _id: ObjectId
    user_id: ObjectId
    text: string
    created: Date
    updated: Date
}
