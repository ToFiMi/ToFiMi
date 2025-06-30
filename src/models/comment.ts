import {ObjectId} from "mongodb";

export type CommentEntity = "homework" | "event" | "post" | "task";

export interface Comment {
    _id: ObjectId;
    entity: CommentEntity;
    entity_id: ObjectId;
    author_id: ObjectId;
    author_role: "user" | "animator" | "leader" | "admin";
    content: string;
    created: Date;
}
