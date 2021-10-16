const jwt = require("jsonwebtoken");

module.exports = function authenticateToken (req, res, next) {
  const authHeader = req.headers['authorisation'];
  const token = authHeader && authHeader.split(' ')[1]

  // For testing, remember to comment out
  // console.log(req);

  if (token == null) return res.status(400).json({ errorMsg: "Token Error please try again" });

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, userData) => {
    if (err) return res.status(403).json({ errorMsg: "Invalid Token, what are you trying to do?" });

    res.locals.userData = userData;
    next();
  });
};