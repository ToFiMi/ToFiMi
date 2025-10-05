// scripts/script.js
import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";

const uri = process.env.MONGODB_URI;
console.log(uri);
const dbName = process.env.DB_NAME || "das_app";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@example.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "password123";
const ADMIN_FIRST = process.env.ADMIN_FIRST || "Admin";
const ADMIN_LAST = process.env.ADMIN_LAST || "User";

if (!uri) {
  console.error("❌ MONGODB_URI is not set. Aborting.");
  process.exit(2);
}

const client = new MongoClient(uri, {
  maxPoolSize: 5,
  serverSelectionTimeoutMS: 8000,
});

async function createAdmin() {
  try {
    await client.connect();
    const db = client.db(dbName);
    const users = db.collection("users");

    await users.createIndex({ email: 1 }, { unique: true });

    const existing = await users.findOne({ email: ADMIN_EMAIL });
    if (existing) {
      console.log(`ℹ️ Admin already exists: ${ADMIN_EMAIL}`);
      return 0;
    }

    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await users.insertOne({
      first_name: ADMIN_FIRST,
      last_name: ADMIN_LAST,
      email: ADMIN_EMAIL,
      passwordHash,
      isAdmin: true,
      isActive: true,
      role: "ADMIN",
      created: new Date(),
      updated: new Date(),
    });

    console.log(`✅ Admin user created: ${ADMIN_EMAIL}`);
    return 0;
  } catch (err) {
    if (err?.code === 11000) {
      console.log(`ℹ️ Admin already exists (dup key): ${ADMIN_EMAIL}`);
      return 0;
    }
    console.error("❌ Seed error:", err);
    return 1;
  } finally {
    await client.close().catch(() => {});
  }
}

createAdmin()
  .then((code) => process.exit(code))
  .catch(() => process.exit(1));
