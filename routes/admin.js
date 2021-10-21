// username, email, phone, rest name
const express = require("express");
const authTokenMiddleware = require("../middleware/authTokenMiddleware");
const router = express.Router();
const dbconn = require("../models/db_model");
const pw_gen = require('generate-password');
const sendMail = require("../models/email_model");

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
          // Create the variables for the email
          var mailTo = `${results[0].rest_email}`;
          
          var mailSubject = `Welcome to Food On Click ${results[0].restaurant_name}`;

          var mailText = `Welcome to Food On Click! \n`
          mailText += `Your login details as follows: \n\n`
          mailText += `\t\tUsername: ${results[0].username}\n`
          mailText += `\t\tPassword: ${results[0].user_password}\n\n`
          mailText += `You will be prompted to key in your restaurant's details on your first login!`;

          var mailHTML = `<h2>Your login details as follows:</h2>`
          mailHTML += `<p>\t\tUsername: ${results[0].username}\n`
          mailHTML += `\t\tPassword: ${results[0].user_password}\n\n`
          mailHTML += `You will be prompted to key in your restaurant's details on your first login!</p>`;

          const mailOptions = {
            from: 'Administrator <cancanfoodapp@gmail.com>',
            to: mailTo,
            subject: mailSubject,
            text: mailText
          };

          sendMail(mailOptions)
            .then(result => {
              console.log("sendmail triggered successfully!");
              
              // 4. Response back to axios call with api_msg
              res.status(200).json({ api_msg: "Successful!" });
              // console.log(result);
            })
            .catch((error) => console.log(error.message));
        }
      })
    }
  })   
});

/****************************************************************************
 * Route Template                     																			*
 ****************************************************************************
 */
// router.get("/pending", (req, res) => {});

module.exports = router;