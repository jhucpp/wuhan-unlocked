const { getDb } = require("./_lib/db");
const { getUserFromRequest } = require("./_lib/auth");

const COLLECTION = "tripPlans";
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
  const user = getUserFromRequest(req);
  if (!user) {
    res.status(401).json({ error: "not_authenticated" });
    return;
  }

  try {
    const db = await getDb();
    const col = db.collection(COLLECTION);

    if (req.method === "GET") {
      const doc = await col.findOne({ _id: user.uid });
      res.status(200).json(doc ? sanitizePlan(doc) : DEFAULT_PLAN);
      return;
    }

    if (req.method === "POST") {
      const plan = sanitizePlan(req.body);
      await col.updateOne(
        { _id: user.uid },
        { $set: { ...plan, email: user.email, updatedAt: new Date() } },
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
