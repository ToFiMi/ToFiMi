// lib/mongo.ts
import { MongoClient, Db } from 'mongodb'

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017'

let client: MongoClient
let _db: Db

export async function connectToDatabase() {
    if (!_db) {
        client = new MongoClient(uri)
        await client.connect()
        _db = client.db('das_app')
    }
    return _db
}
