import {ObjectId} from "mongodb";

export interface Tags {
    _id: ObjectId,
    name: string,
    type: "allergy",
    created: Date,
    createdBy: ObjectId
}
