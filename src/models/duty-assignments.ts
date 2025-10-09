import { ObjectId } from 'mongodb'

export interface DutyAssignment {
    _id: ObjectId | string
    school_id: ObjectId | string
    event_id: ObjectId | string
    group_id: ObjectId | string
    duty_type_id: ObjectId | string
    date: Date | string // which day of the event
    created: Date | string
    updated: Date | string
}