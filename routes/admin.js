// username, email, phone, rest name
const express = require("express");
const authTokenMiddleware = require("../middleware/authTokenMiddleware");
const router = express.Router();
const dbconn = require("../models/db_model");
const pw_gen = require('generate-password');
const sendMail = require("../models/email_model");
const { sendRGMEmail } = require("../models/credentials_email_template");

// Body / form parser
router.use(express.json());

// Universal Middleware
// All middleware for this route comes here

/****************************************************************************
 * Getting all the pending restaurants																			*
 ****************************************************************************
 */
router.get("/pending", (req, res) => {
  // This route retrieves all the restaurants that are registered as a pending
  // account.
  // 1. Select all the restaurants that have the pending status and return it
  var sqlGetQuery = `SELECT * FROM restaurant WHERE rest_status="pending"`

  dbconn.query(sqlGetQuery, function(error, results, fields){
    if (error) {
      console.log("MySQL " + error);
    }
    else {
      res.status(200).send(results);
    }
  });
});

/****************************************************************************
 * Route Template                     																			*
 ****************************************************************************
 */
router.post("/approve/:restaurant_ID", (req, res) => {
  // 1. Get the restaurant's ID
  const restID = req.params.restaurant_ID;

  // 2. Update status of restaurant
  var sqlUpdateQuery = `UPDATE restaurant SET rest_status="first" `;
  sqlUpdateQuery += `WHERE restaurant_ID=${restID}`;

  // send query to sql server
  dbconn.query(sqlUpdateQuery, function(error, results, fields){
    if (error) {
      res.status(200).json({ api_msg: "MySQL " + error });
    }
    else {
      // 3. Send email to the restaurant's registered email address with the first
      // login password

      // First the get info query
      var sqlGetQuery = `SELECT username, user_password, restaurant_name, rest_email `;
      sqlGetQuery += `FROM app_user JOIN restaurant `;
      sqlGetQuery += `ON username=rest_rgm_username AND restaurant_ID=${restID}`;

      dbconn.query(sqlGetQuery, function(error, results, fields){
        if (error) {
          res.status(200).json({ api_msg: "MySQL " + error });
        }
        else {
          sendRGMEmail(results[0].username, results[0].user_password, results[0].rest_email, results[0].restaurant_name)
            .then((response) => {
              sendMail(response)
                .then(result => {
                  console.log("sendmail triggered successfully!");
                  
                  // 4. Response back to axios call with api_msg
                  res.status(200).json({ api_msg: "Successful!" });
                  // console.log(result);
                })
                .catch((error) => console.log(error.message));
            });
        }
      });  // Nested Query
    }
  });  // First query
});

/****************************************************************************
 * Route Template                     																			*
 ****************************************************************************
 */
// router.get("/pending", (req, res) => {});

module.exports = router;