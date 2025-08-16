import { ObjectId } from 'mongodb'

export interface Homework {
    _id: ObjectId
    event_id: ObjectId
    user_id: ObjectId
    homework_type_id: string
    content?: string // optional for worksheet submissions
    worksheet_submission_id?: ObjectId // reference to worksheet submission
    type: 'essay' | 'worksheet' // type of homework
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
