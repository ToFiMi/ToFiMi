import { ObjectId } from 'mongodb'

export interface Worksheet {
    _id: ObjectId
    school_id: ObjectId
    event_id?: ObjectId // optional - worksheet can exist without being assigned to event
    title: string
    description?: string
    questions: WorksheetQuestion[]
    created_by: ObjectId
    is_template: boolean // true for reusable templates
    created: Date
    updated: Date
}

export interface WorksheetQuestion {
    id: string
    type: 'text' | 'textarea' | 'multiple_choice' | 'checkbox' | 'scale' | 'date'
    question: string
    required: boolean
    options?: string[] // for multiple_choice and checkbox
    scale_min?: number // for scale questions
    scale_max?: number // for scale questions
    scale_labels?: { min: string, max: string } // for scale questions
}

export interface WorksheetSubmission {
    _id: ObjectId
    worksheet_id: ObjectId
    event_id: ObjectId
    user_id: ObjectId
    answers: WorksheetAnswer[]
    essay_content?: string // optional essay in addition to worksheet
    status: 'pending' | 'approved' | 'rejected'
    comments: WorksheetComment[]
    created: Date
    updated: Date
}

export interface WorksheetAnswer {
    question_id: string
    answer: string | string[] | number // different types based on question type
}

export interface WorksheetComment {
    _id: ObjectId
    user_id: ObjectId
    text: string
    created: Date
    updated: Date
}