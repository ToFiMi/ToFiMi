import {ObjectId} from "mongodb";

export interface DailyReflection {
    _id?: ObjectId
    event_id: ObjectId
    school_id: ObjectId
    date: Date
    verse_reference: {
        reference: string
        verse: string
    }[]
    content: string
    created_by: ObjectId
    created: Date
}
