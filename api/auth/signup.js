const bcrypt = require("bcryptjs");
const { getDb } = require("../_lib/db");
const { signSessionCookie } = require("../_lib/auth");

function isValidEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const body = req.body || {};
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!isValidEmail(email)) {
      res.status(400).json({ error: "invalid_email" });
      return;
    }
    if (password.length < 8) {
      res.status(400).json({ error: "weak_password" });
      return;
    }

    const db = await getDb();
    const users = db.collection("users");
    await users.createIndex({ email: 1 }, { unique: true }).catch(() => {});

    const existing = await users.findOne({ email });
    if (existing) {
      res.status(409).json({ error: "email_taken" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const doc = { email, passwordHash, createdAt: new Date() };
    const result = await users.insertOne(doc);
    const uid = result.insertedId.toString();

    res.setHeader("Set-Cookie", signSessionCookie({ uid, email }));
    res.status(200).json({ email });
  } catch (err) {
    if (err && err.code === 11000) {
      res.status(409).json({ error: "email_taken" });
      return;
    }
    res.status(500).json({ error: "server_error", detail: err.message });
  }
};
