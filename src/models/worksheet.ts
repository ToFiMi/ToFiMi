import { ObjectId } from 'mongodb'

export interface Worksheet {
    _id: ObjectId | string
    school_id: ObjectId | string
    event_id?: ObjectId | string // optional - worksheet can exist without being assigned to event
    title: string
    description?: string
    questions: WorksheetQuestion[]
    created_by: ObjectId | string
    is_template: boolean // true for reusable templates
    created: Date | string
    updated: Date | string
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
    _id: ObjectId | string
    worksheet_id: ObjectId | string
    event_id: ObjectId | string
    user_id: ObjectId | string
    homework_type_id?: string // optional - for homework-based worksheets (allows multiple per event)
    answers: WorksheetAnswer[]
    essay_content?: string // optional essay in addition to worksheet
    status: 'pending' | 'approved' | 'rejected'
    comments: WorksheetComment[]
    created: Date | string
    updated: Date | string
}

export interface WorksheetAnswer {
    question_id: string
    answer: string | string[] | number // different types based on question type
}

export interface WorksheetComment {
    _id: ObjectId | string
    user_id: ObjectId | string
    text: string
    created: Date | string
    updated: Date | string
}