import { ObjectId } from 'mongodb'

export interface Homework {
    _id: ObjectId | string
    event_id: ObjectId | string
    user_id: ObjectId | string
    homework_type_id: string
    content?: string // optional for worksheet submissions
    worksheet_submission_id?: ObjectId | string // reference to worksheet submission
    type: 'essay' | 'worksheet' | "project" | "custom" | "evangelist-discussion" | "testimony" // type of homework
    status: 'approved' | 'pending' | 'rejected'
    comments: Comment[]
    created: Date | string
    updated: Date | string
}

export interface Comment {
    _id: ObjectId | string
    user_id: ObjectId | string
    text: string
    created: Date | string
    updated: Date | string
}
