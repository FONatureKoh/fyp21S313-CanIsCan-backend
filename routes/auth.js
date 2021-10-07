const express = require("express");
const router = express.Router();
const dbconn = require("../models/db_model");

router.use(express.json())
/************************************
 * Authentication function
 * 
 */
router.post("/login", (req, res) => {
  console.log(req.body);
  res.send(req.body);
	// dbconn.query('SELECT * FROM app_users', function (error, results, fields) {
  //   if (error) {
  //     res.send("MySQL error: " + error);
  //   }
  //   else {
  //     res.send(results);
  //   }
  // });
});

module.exports = router;