import { ObjectId } from 'mongodb'

export interface Event  {
    _id: ObjectId | string
    school_id: ObjectId | string
    title: string // napr. "Víkend 1", "Letná 10-dňovka"
    description?: string // dobrovoľné - krátky popis (napr. téma víkendu)
    instructions?: string
    grade: number
    startDate: Date | string
    endDate: Date | string
    created: Date | string
    updated: Date | string
    meals: MealDefinition[]
    homeworkTypes: HomeworkType[]
    worksheet_id?: ObjectId | string // optional worksheet for missed participants
    feedbackUrl?: string // Google Forms URL for event feedback
    sheetsUrl?: string // Google Sheets URL for event data/information
}

export interface HomeworkType {
    id: string
    name: string // e.g., "Text Essay", "Project", "Evangelist Discussion", "Testimony"
    description?: string
    required: boolean
    dueDate?: Date
}
export interface MealDefinition {
    date: string
    times: string[]
}
