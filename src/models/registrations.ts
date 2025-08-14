import { ObjectId } from 'mongodb'
import {MealDefinition} from "./events";

export interface Registration {
    _id: ObjectId,
    user_id: ObjectId
    school_id: ObjectId,
    event_id: ObjectId,
    meals: MealDefinition[]
    going: boolean,
    attended?: boolean, // null = not set, true = attended, false = did not attend
    attendance_marked_by?: ObjectId, // who marked the attendance
    attendance_marked_at?: Date, // when attendance was marked
    created: Date,
    updated: Date,

}

