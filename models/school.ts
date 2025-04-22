import { ObjectId } from 'mongodb'

export interface School {
    _id: ObjectId
    name: string
    slug: string
    createdAt: Date
    modifiedAt: Date
    settings?: {
        themeColor?: string
        features?: string[]
    }
}
