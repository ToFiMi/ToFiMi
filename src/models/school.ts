import { ObjectId } from 'mongodb'

export interface School {
    _id: ObjectId
    name: string
    slug: string
    created: Date
    updated: Date
    settings?: {
        themeColor?: string
        features?: string[]
    }
}
