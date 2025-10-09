import { ObjectId } from 'mongodb'

export interface DutyType {
    _id: ObjectId | string
    school_id: ObjectId | string
    name: string // e.g., "Kitchen", "Liturgy", "Tidying", "Service"
    order: number // for rotation sequence
    created: Date | string
    updated: Date | string
}