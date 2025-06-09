import {ObjectId} from "mongodb";

export interface Groups{

    _id: ObjectId,
    school_id: ObjectId,
    name: string,
    animators: ObjectId[],
    created: Date,
    updated: Date

}
