const express = require("express");
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
      res.send("MySQL error: " + error);
    }
    else {
      res.send(results);
    }
  });
});

module.exports = router;