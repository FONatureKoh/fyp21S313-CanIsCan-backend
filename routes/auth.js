const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const dbconn = require("../models/db_model");

router.use(express.json())
/************************************
 * Authentication function
 * 
 */
router.post("/login", (req, res) => {
  var username = req.body.username;
  var password = req.body.password;

  var sqlQuery = `SELECT username, user_type FROM app_user `;
  sqlQuery += `WHERE username='${username}' AND user_password='${password}'`;
  console.log(sqlQuery);
  // console.log(req.body);
  // res.send(req.body);
	dbconn.query(sqlQuery, function (error, results, fields) {
    if (error) {
      res.status(404).send("MySQL error: " + error);
    }
    else {
      // Retrieve the username and usertype
      const selectedUsername = results[0].username;
      const selectedUsertype = results[0].usertype;

      // Construct an object with those params
      const userData = {
        username: selectedUsername,
        userType: selectedUsertype
      };
      
      // Now we serialise things
      const accessToken = jwt.sign(userData, process.env.ACCESS_TOKEN_SECRET);
      
      res.json({ accessToken: accessToken })
      // res.send(results);
    }
  });
});

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorisation'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(404);

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, userData) => {
    if (err) return res.sendStatus(403)
    req.body.username
  })

}

module.exports = router;