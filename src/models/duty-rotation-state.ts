import { ObjectId } from 'mongodb'

export interface DutyRotationState {
    _id: ObjectId | string
    school_id: ObjectId | string
    grade: number
    last_rotation_index: number // tracks where rotation left off
    last_event_id: ObjectId | string // reference to last event
    updated: Date | string
}