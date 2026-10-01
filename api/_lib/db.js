const { MongoClient } = require("mongodb");

const DB_NAME = process.env.MONGODB_DB || "stu_7225f636";

let clientPromise = null;
function getClient() {
  if (!clientPromise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("MONGODB_URI is not set");
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 });
    clientPromise = client.connect();
  }
  return clientPromise;
}

async function getDb() {
  const client = await getClient();
  return client.db(DB_NAME);
}

module.exports = { getDb };
