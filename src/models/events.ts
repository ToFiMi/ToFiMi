import { ObjectId } from 'mongodb'

export interface Event  {
    _id: ObjectId | string
    school_id: ObjectId | string
    title: string // napr. "Víkend 1", "Letná 10-dňovka"
    description?: string // dobrovoľné - krátky popis (napr. téma víkendu)
    instructions?: string
    grade: number
    startDate: Date
    endDate: Date
    created: Date
    updated: Date
    meals: MealDefinition[]
    homeworkTypes: HomeworkType[]
    worksheet_id?: ObjectId | string // optional worksheet for missed participants
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
