const { MongoClient } = require("mongodb");

let client;
let dbCache;

async function getDb() {
  if (dbCache) return dbCache;
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.DB_NAME;
  if (!uri || !dbName) {
    throw new Error("Missing MONGODB_URI or DB_NAME in environment");
  }
  if (!client) {
    client = new MongoClient(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 8000,
    });
    await client.connect();
    client.on("close", () => {
      dbCache = null;
      client = null;
    });
  }
  dbCache = client.db(dbName);
  return dbCache;
}

async function withDb(fn) {
  const db = await getDb();
  return fn(db);
}

module.exports = { getDb, withDb };
