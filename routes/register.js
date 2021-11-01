// Express Server imports
const express = require('express');
const router = express.Router();

// Database matters
const dbconn = require('../models/db_model');

// General Imports
const pw_gen = require('generate-password');
// const { v4: uuidv4 } = require('uuid');
// const datetime_T = require('date-and-time');
// const fs = require('fs');
// const path = require('path');

// For image uploads
// const multer = require('multer');

// Google maps api stuff
// const { Client, defaultAxiosInstance } = require('@googlemaps/google-maps-services-js');

// Email Modules
const sendMail = require('../models/email_model');
const { sendSubUserEmail } = require('../models/credentials_email_template');

// Middle Ware stuffs
// const authTokenMiddleware = require('../middleware/authTokenMiddleware');

/**************************************************************************
 * Router Middlewares and parsers																					*
 **************************************************************************/
router.use(express.json());
router.use(express.urlencoded({ extended: true }))

// Universal Middleware
// All middleware for this route comes here

/****************************************************************************
 * Restaurant Register for an account 																			*
 ****************************************************************************
 */
router.post('/restaurant', (req, res) => {
  // Assuming that we pass the form data into the route
  // 1. We will need to decode the form and draw out the data
  // console.log(req.body);
  const {
    username, restaurant_name, email, phone
  } = req.body;

  // Generate a default password
  const default_pw = pw_gen.generate({
    length: 15,
    numbers: true,
    symbols: '!@#$*?%^&',
    strict: true
  })

  var sqlQuery = "INSERT INTO app_user(`username`, `user_password`, `user_type`, `account_status`) ";
  sqlQuery += `VALUES ("${username}", "${default_pw}", "Restaurant General Manager", "active")`;

  // First query creates the app_user entry
  dbconn.query(sqlQuery, function(error, results, fields){
    if (error) {
      console.log("MySQL " + error);
      res.status(200).json({ api_msg: "username exist" });
    }
    else {
      // Console log to see MySQL
      // console.log(results);

      // Once the app user is created, we can now create the restaurant
      var sqlRestaurantQuery = "INSERT INTO restaurant(`restaurant_name`, `rest_rgm_username`, ";
      sqlRestaurantQuery += "`rest_phone_no`, `rest_email`,`rest_opening_time`, `rest_closing_time`, `rest_status`) ";
      sqlRestaurantQuery += `VALUES ("${restaurant_name}", "${username}", "${phone}", "${email}", "00:00:00", "00:00:00","pending")`;

      dbconn.query(sqlRestaurantQuery, function(error, results, fields){
        if (error) {
          console.log("MySQL " + error);
        }
        else {
          // console.log(results);
          // If the restaurant is successful, then we can create a profile for the RGM as well
          var sqlCreateRGM = "INSERT INTO restaurant_gm(`rgm_username`) ";
          sqlCreateRGM += `VALUES ("${username}")`;

          dbconn.query(sqlCreateRGM, function(error, results, fields){
            if (error) {
              // We"ll just send an error back through a OK request so that the api doesn"t crash
              res.status(200).json({ api_msg: "MySQL " + error });
            }
            else {
              // Sends back success message
              res.status(200).json({ api_msg: "Successful" });
            }
          }); // Third nested query close
        };
      }); // Second nested query closed
    };
  }); // First actual query
}); // Restaurant Register Route close

/****************************************************************************
 * Restaurant Register for an account 																			*
 ****************************************************************************
 */
router.post('/customer', (req, res) => {
  // Assuming that we pass the form data into the route
  // 1. We will need to decode the form and draw out the data
  // console.log(req.body);
  const {
    email, username, password
  } = req.body;

  var sqlQuery = "INSERT INTO app_user(`username`, `user_password`, `user_type`, `account_status`) ";
  sqlQuery += `VALUES ("${username}", "${password}", "Customer", "active")`;

  // First query creates the app_user entry
  dbconn.query(sqlQuery, function(error, results, fields){
    if (error) {
      console.log("MySQL " + error);
      res.status(200).json({ api_msg: "username exist" });
    }
    else {
      // Console log to see MySQL
      // console.log(results);

      // Once the app user is created, we can now create the customer profile
      var sqlInsertCustProfile = "INSERT INTO customer_user(`cust_username`, `email`) ";
      sqlInsertCustProfile += `VALUES ("${username}", "${email}")`;

      dbconn.query(sqlInsertCustProfile, function(error, results, fields){
        if (error) {
          console.log("MySQL " + error);
        }
        else {
          // For the customer, we also need to put in the first default address for the customer
          var sqlInsertCustAddress = "INSERT INTO `cust_address`(`ca_username`, `is_default`) ";
          sqlInsertCustAddress += `VALUES ("${username}",1)`;

          dbconn.query(sqlInsertCustAddress, function(err, results, fields){
            if (err) {
              console.log("MySQL" + err);
            }
            else {
              res.status(200).json({ api_msg: "Successful" });
            }
          }); // Closing Address creation query
        };
      }); // Create customer profile query
    };
  }); // Create app user query
}); // Customer Register Route close

/*******************************************************************************************
 * NO ROUTES FUNCTIONS OR DECLARATIONS BELOW THIS DIVIDER 
 *******************************************************************************************
 * You only export and do nothing else here
 */
module.exports = router;