const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || "stu_7225f636";
const COLLECTION = "tripPlans";
const DOC_ID = "default";

// Reuse the client across warm invocations instead of reconnecting every request.
let clientPromise = null;
function getClient() {
  if (!clientPromise) {
    if (!uri) throw new Error("MONGODB_URI is not set");
    const client = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 });
    clientPromise = client.connect();
  }
  return clientPromise;
}

const DEFAULT_PLAN = { days: 7, assign: {}, lang: "en" };

function sanitizePlan(body) {
  const out = { ...DEFAULT_PLAN };
  if (body && typeof body === "object") {
    if (Number.isInteger(body.days) && body.days >= 3 && body.days <= 10) {
      out.days = body.days;
    }
    if (body.assign && typeof body.assign === "object" && !Array.isArray(body.assign)) {
      const clean = {};
      for (const [place, day] of Object.entries(body.assign)) {
        if (typeof place === "string" && Number.isInteger(day)) clean[place] = day;
      }
      out.assign = clean;
    }
    if (body.lang === "en" || body.lang === "zh") {
      out.lang = body.lang;
    }
  }
  return out;
}

module.exports = async (req, res) => {
  try {
    const client = await getClient();
    const col = client.db(DB_NAME).collection(COLLECTION);

    if (req.method === "GET") {
      const doc = await col.findOne({ _id: DOC_ID });
      res.status(200).json(doc ? sanitizePlan(doc) : DEFAULT_PLAN);
      return;
    }

    if (req.method === "POST") {
      const plan = sanitizePlan(req.body);
      await col.updateOne(
        { _id: DOC_ID },
        { $set: { ...plan, updatedAt: new Date() } },
        { upsert: true }
      );
      res.status(200).json(plan);
      return;
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    res.status(500).json({ error: "Database error", detail: err.message });
  }
};
