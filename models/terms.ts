import { ObjectId } from 'mongodb'

export interface Term {
    _id: ObjectId | string
    school_id: ObjectId | string
    title: string // napr. "Víkend 1", "Letná 10-dňovka"
    description?: string // dobrovoľné - krátky popis (napr. téma víkendu)
    grade: number
    startDate: Date
    endDate: Date
    createdAt: Date
    modifiedAt: Date
}
