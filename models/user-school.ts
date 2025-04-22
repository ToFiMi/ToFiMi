import {ObjectId} from 'mongodb'

export interface UserSchool {
    _id: ObjectId
    school_id: ObjectId
    user_id: ObjectId
    role: 'leader' | 'animator' | 'student'
}
