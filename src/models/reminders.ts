import {ObjectId} from "mongodb";

export interface Reminder {
    user_id: ObjectId,
    hour: number,
    minute: number,
}
