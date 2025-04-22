// lib/mongo.ts (odporúčané)
import { MongoClient } from 'mongodb'

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017'
const client = new MongoClient(uri)
let _db = client.db('app')

export async function connectToDatabase() {
    await client.connect()
    return _db
}
