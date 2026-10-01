const { getUserFromRequest } = require("../_lib/auth");

module.exports = async (req, res) => {
  const user = getUserFromRequest(req);
  if (!user) {
    res.status(200).json({ user: null });
    return;
  }
  res.status(200).json({ user: { email: user.email } });
};
