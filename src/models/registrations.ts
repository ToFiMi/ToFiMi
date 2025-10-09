import { ObjectId } from 'mongodb'
import {MealDefinition} from "./events";

export interface Registration {
    _id: ObjectId | string,
    user_id: ObjectId | string
    school_id: ObjectId | string,
    event_id: ObjectId | string,
    meals: MealDefinition[]
    going: boolean,
    attended?: boolean, // null = not set, true = attended, false = did not attend
    attendance_marked_by?: ObjectId | string, // who marked the attendance
    attendance_marked_at?: Date | string, // when attendance was marked
    created: Date | string,
    updated: Date | string,

}

