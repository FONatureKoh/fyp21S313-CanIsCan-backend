const jwt = require("jsonwebtoken");

module.exports = function authenticateToken (req, res, next) {
  const authHeader = req.headers['authorisation'];
  const token = authHeader && authHeader.split(' ')[1]

  if (token == null) return res.status(404).json({ errorMsg: "Token Error please try again" });

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, userData) => {
    if (err) return res.sendStatus(403);
    res.locals.userData = userData;
    next();
  });
};