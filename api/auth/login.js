const bcrypt = require("bcryptjs");
const { getDb } = require("../_lib/db");
const { signSessionCookie } = require("../_lib/auth");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const body = req.body || {};
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email || !password) {
      res.status(400).json({ error: "missing_fields" });
      return;
    }

    const db = await getDb();
    const user = await db.collection("users").findOne({ email });
    if (!user) {
      res.status(401).json({ error: "invalid_credentials" });
      return;
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      res.status(401).json({ error: "invalid_credentials" });
      return;
    }

    const uid = user._id.toString();
    res.setHeader("Set-Cookie", signSessionCookie({ uid, email }));
    res.status(200).json({ email });
  } catch (err) {
    res.status(500).json({ error: "server_error", detail: err.message });
  }
};
