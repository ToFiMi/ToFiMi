import {ObjectId} from "mongodb";

export interface UserTags {
    _id: ObjectId,
    user_id: ObjectId,
    tag_id: ObjectId,
    created: Date
}
