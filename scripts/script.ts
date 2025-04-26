import { MongoClient } from 'mongodb'
import bcrypt from 'bcrypt'

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017'
const client = new MongoClient(uri)
const dbName = 'das_app'

async function createAdmin() {
    try {
        await client.connect()
        const db = client.db(dbName)
        const users = db.collection('users')

        const firstName = 'Admin'
        const lastName = 'User'
        const email = 'admin@example.com'
        const password = 'password123' // môžeš zmeniť
        const passwordHash = await bcrypt.hash(password, 10)

        const existingUser = await users.findOne({ email })
        if (existingUser) {
            console.log('User already exists')
            return
        }

        await users.insertOne({
            first_name: firstName,
            last_name: lastName,
            email: email,
            passwordHash: passwordHash,
            isAdmin: true,
            createdAt: new Date(),
            modifiedAt: new Date(),
        })

        console.log(`✅ Admin user created: ${email} / ${password}`)
    } catch (err) {
        console.error(err)
    } finally {
        await client.close()
    }
}

createAdmin()
