const jwt = require("jsonwebtoken");

const COOKIE_NAME = "wu_session";
const SECRET = process.env.JWT_SECRET;

function parseCookies(req) {
  const header = req.headers.cookie;
  const out = {};
  if (!header) return out;
  header.split(";").forEach((pair) => {
    const idx = pair.indexOf("=");
    if (idx === -1) return;
    const key = pair.slice(0, idx).trim();
    const val = pair.slice(idx + 1).trim();
    if (key) out[key] = decodeURIComponent(val);
  });
  return out;
}

function signSessionCookie(payload) {
  if (!SECRET) throw new Error("JWT_SECRET is not set");
  const token = jwt.sign(payload, SECRET, { expiresIn: "30d" });
  const isProd = process.env.VERCEL_ENV === "production" || process.env.VERCEL_ENV === "preview";
  const parts = [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${60 * 60 * 24 * 30}`,
  ];
  if (isProd) parts.push("Secure");
  return parts.join("; ");
}

function clearSessionCookie() {
  const isProd = process.env.VERCEL_ENV === "production" || process.env.VERCEL_ENV === "preview";
  const parts = [`${COOKIE_NAME}=`, "Path=/", "HttpOnly", "SameSite=Lax", "Max-Age=0"];
  if (isProd) parts.push("Secure");
  return parts.join("; ");
}

function getUserFromRequest(req) {
  if (!SECRET) return null;
  const cookies = parseCookies(req);
  const token = cookies[COOKIE_NAME];
  if (!token) return null;
  try {
    const payload = jwt.verify(token, SECRET);
    return { uid: payload.uid, email: payload.email };
  } catch (e) {
    return null;
  }
}

module.exports = { signSessionCookie, clearSessionCookie, getUserFromRequest, parseCookies };
