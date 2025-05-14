import { ObjectId } from 'mongodb'
import {MealDefinition} from "./events";

export interface Registration {
    _id: ObjectId,
    user_id: ObjectId
    school_id: ObjectId,
    event_id: ObjectId,
    meals: MealDefinition[]
    going: boolean,
    created: Date,
    updated: Date,

}

