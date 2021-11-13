const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const dbconn = require("../models/db_model");

// Middleware Functions
// const authenticateToken = require("../middleware/authTokenMiddleware");

router.use(express.json())
/************************************************************************************
 * Authentication function                                                          *
 ************************************************************************************
 * Authentication function to send the accessToken back to the frontend client
 */

router.post("/login", (req, res) => {
  // console.log(req.body);
  // First we get the two values from the req body
  const {
    username, password
  } = req.body;

  // If the two authentication values do not exist, then return error response
  if (username == null || password == null) {
    res.status(400).json({ errorMsg: "Username and Password cannot be blank" });
  }
  // If username and password found, then proceed with the query
  else {
    // Create query to authenticate user
    var sqlQuery = `SELECT username, user_type FROM app_user `;
    sqlQuery += `WHERE username="${username}" AND user_password="${password}"`;

    // Query to auth the user. If found, proceed, otherwise throw 400 Bad Request.
    dbconn.query(sqlQuery, function (error, results, fields) {
      // console.log(results);
      if (error) {
        res.status(400).send({ api_msg: "MySQL error: " + error });
      }
      else if (results.length > 0) {
        // Retrieve the username and usertype
        const selectedUsername = results[0].username;
        const selectedUsertype = results[0].user_type;

        // Construct an object with those params
        const userData = {
          username: selectedUsername,
          userType: selectedUsertype
        };
        
        // Now we serialise things
        const accessToken = jwt.sign(userData, process.env.ACCESS_TOKEN_SECRET);
        
        // Send the response back to front end app
        res.status(200).json({
          accessToken: "Bearer " + accessToken,
          userType: selectedUsertype
        })
      }
      else {
        res.status(200).send({ api_msg: "User not found. Please try again" });
      }
    });
  }
});

/*******************************************************************************************
 * NO ROUTES FUNCTIONS OR DECLARATIONS BELOW THIS DIVIDER 
 *******************************************************************************************
 * You only export and do nothing else here
 */
module.exports = router;