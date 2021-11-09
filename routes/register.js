// Express Server imports
const express = require('express');
const router = express.Router();

// Database matters
const dbconn = require('../models/db_model');

// General Imports
const pw_gen = require('generate-password');
const asyncHandler = require('express-async-handler');
const chalk = require('chalk');
// const { v4: uuidv4 } = require('uuid');
const datetime_T = require('date-and-time');
// const fs = require('fs');
// const path = require('path');

// For image uploads
// const multer = require('multer');

// Google maps api stuff
// const { Client, defaultAxiosInstance } = require('@googlemaps/google-maps-services-js');

// A good looking timestamp
let timestamp = `[${chalk.green(datetime_T.format(new Date(), 'YYYY-MM-DD HH:mm:ss'))}] `;

// Email Modules
const sendMail = require('../models/email_model');
const { sendSubUserEmail, resetPWEmail } = require('../models/credentials_email_template');

// Middle Ware stuffs
// const authTokenMiddleware = require('../middleware/authTokenMiddleware');
const consoleLogger = require('../middleware/loggerMiddleware');

/**************************************************************************
 * Router Middlewares and parsers																					*
 **************************************************************************/
router.use(express.json());
router.use(express.urlencoded({ extended: true }));
router.use(consoleLogger);

/****************************************************************************
 * Restaurant Register for an account 																			*
 ****************************************************************************
 */
router.post('/restaurant', asyncHandler(async(req, res) => {
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
  });

  // Query to find and see if the restaurant name can be found 
  var sqlRestGet = `SELECT restaurant_name FROM restaurant `;
  sqlRestGet += `WHERE restaurant_name="${restaurant_name}" `;

  const verifyRestaurantName = await new Promise((resolve, reject) => {
    dbconn.query(sqlRestGet, function (err, results, fields){
      if (err) {
        console.log(err);
        reject(err);
      }
      else {
        // console.log(results);
        if (results[0]) {
          resolve({checkRestaurant: "fail"});
        }
        else {
          resolve({checkRestaurant: "OK"});
        }
      }
    });
  });

  if (verifyRestaurantName.checkRestaurant === "fail") {
    res.status(200).send({ api_msg: "Restaurant Name already exist!" });
    return;
  }

  // Username check
  var sqlGetQuery = `SELECT username FROM app_user WHERE username="${username}"`;

  const verifyUsername = await new Promise((resolve, reject) => {
    dbconn.query(sqlGetQuery, function(err, results, fields){
      if (err) {
        console.log(err);
        reject(err);
      }
      else {
        if (results[0]) {
          resolve({checkUsername: "fail"});
        }
        else {
          resolve({checkUsername: "OK"});
        }  
      }
    });
  });

  if (verifyUsername.checkUsername === "fail") {
    res.status(200).send({ api_msg: "Username already exist!" });
    return;
  }
  
  // All checks pass, proceed with restaurant creation
  var sqlQuery = "INSERT INTO app_user(`username`, `user_password`, `user_type`, `account_status`) ";
  sqlQuery += `VALUES ("${username}", "${default_pw}", "Restaurant General Manager", "active")`;

  // First query creates the app_user entry
  dbconn.query(sqlQuery, function(error, results, fields){
    if (error) {
      console.log("MySQL " + error);
      res.status(200).json({ api_msg: "username exist" });
    }
    else {
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
              res.status(200).json({ api_msg: "success" });
            }
          }); // Third nested query close
        };
      }); // Second nested query closed
    };
  }); // First actual query
})); // Restaurant Register Route close

/****************************************************************************
 * Restaurant Register for an account 																			*
 ****************************************************************************
 */
router.post('/customer', asyncHandler(async(req, res, next) => {
  // Assuming that we pass the form data into the route
  // 1. We will need to decode the form and draw out the data
  // console.log(req.body);
  const {
    email, username, password
  } = req.body;

  // 2. We verify if the username already exist
  var verifyUsername = `SELECT EXISTS(SELECT username FROM app_user WHERE username="${username}") AS EXISTCHECK`;

  const usernameCheck = await new Promise((resolve, reject) => {
    dbconn.query(verifyUsername, function(err, results, fields) {
      if (err) {
        console.log(err);
        reject(err);
      }
      else {
        resolve(results[0].EXISTCHECK);
      }
    });
  });

  if (usernameCheck == 1) {
    res.status(200).send({ api_msg: "This username already exist! Is it you?" });
    return;
  }

  // 3. Once that is verified, we proceed for the creation
  var sqlCreate = "INSERT INTO app_user(`username`, `user_password`, `user_type`, `account_status`) ";
  sqlCreate += `VALUES ("${username}", "${password}", "Customer", "first")`;

  dbconn.getConnection((err, conn) => {
    if (err) console.log(err)

    // Establish the connection and go for it
    conn.query(sqlCreate, function(err, results, fields){
      if (err) {
        console.log(err);
        res.status(400).send(err.message);
      }
      else {
        // Once the app user is created, we can now create the customer profile
        var sqlInsertCustProfile = "INSERT INTO customer_user(`cust_username`, `email`) ";
        sqlInsertCustProfile += `VALUES ("${username}", "${email}")`;

        conn.query(sqlInsertCustProfile, function(err, results, fields){
          if (err) {
            console.log(err);
            res.status(400).send(err.message);
          }
          else {
            conn.release();
            res.status(200).send({ api_msg: "success" });
          }
        }) // Close and release nested connection
      }
    }); // Closed first connection
  }); // Get connection from the pool
})); // Customer Register Route close

/****************************************************************************
 * Verify Username
 ****************************************************************************
 */
router.get('/verifyusername/:username', asyncHandler(async(req, res) => {
  // Assuming that we pass the form data into the route
  // 1. We will need to decode the form and draw out the data
  // console.log(req.body);
  const username = req.params.username;

  // USERNAME QUERY
  var usernameQuery = `SELECT username FROM app_user WHERE username="${username}"`;

  const queryResponse = await new Promise((resolve, reject) => {
    dbconn.query(usernameQuery, function(err, results, fields){
      if (err) {
        console.log(err);
        reject(err);
      }
      else {
        resolve(results);
      }
    })
  })

  // console.log(queryResponse);

  if (queryResponse[0]) {
    res.status(200).send({ api_msg: "success" })
  }
  else {
    res.status(200).send({ api_msg: "fail" })
  }
}));

/****************************************************************************
 * Verify Username
 ****************************************************************************
 */
router.get('/resetpassword/:username', asyncHandler(async(req, res) => {
  // Assuming that we pass the form data into the route
  // 1. We will need to decode the form and draw out the data
  // console.log(req.body);
  const username = req.params.username;

  // Generate a default password
  const default_pw = pw_gen.generate({
    length: 15,
    numbers: true,
    symbols: '!@#$*?%^&',
    strict: true
  });

  // 1. GET THE USER TYPE
  var userTypeQuery = `SELECT user_type, username FROM app_user WHERE username="${username}"`;

  const userInfo = await new Promise((resolve, reject) => {
    dbconn.query(userTypeQuery, function(err, results, fields){
      if (err) {
        console.log(err)
        reject(err);
      }
      else {
        resolve(results);
      }
    })
  })

  // 2. CONSTRUCT SELECT STATEMENT ACCORDINGLY
  const userType = userInfo[0].user_type;

  var infoQuery = "SELECT first_name, last_name, email ";

  switch (userType) { 
    case "Customer":
      infoQuery += "FROM customer_user ";
      infoQuery += `WHERE cust_username="${username}"`
      break;
    //============================================================
    case "Restaurant General Manager":
      infoQuery += "FROM restaurant_gm ";
      infoQuery += `WHERE rgm_username="${username}"`
      break;
    //============================================================
    case "Restaurant Deliveries Manager":
    case "Restaurant Reservations Manager":
      infoQuery += "FROM restaurant_subuser ";
      infoQuery += `WHERE subuser_username="${username}"`
      break;
    //============================================================
    case "System Administrator":
      infoQuery += "FROM admin_user ";
      infoQuery += `WHERE admin_username="${username}"`
      break;
    default:
    //============================================================
  }  
  
  // 3. QUERY TO GET THE INFO 
  const emailInfo = await new Promise((resolve, reject) => {
    dbconn.query(infoQuery, function(err, results, fields){
      if (err) {
        console.log(err);
      }
      else {
        resolve(results);
      }
    });
  });

  const userFullName = emailInfo[0].first_name + " " + emailInfo[0].last_name;
  const email = emailInfo[0].email;

  // USERNAME QUERY
  var setNewPassword = `UPDATE app_user SET user_password="${default_pw}", account_status="reset" `
  setNewPassword += `WHERE username="${username}"`;

  const queryResponse = await new Promise((resolve, reject) => {
    dbconn.query(setNewPassword, function(err, results, fields){
      if (err) {
        console.log(err);
        reject(err);
      }
      else {
        resolve(results);
      }
    })
  });
  
  if (queryResponse.changedRows == 1) {
    const mailOptions = await resetPWEmail(email, userFullName, default_pw);

    sendMail(mailOptions)
      .then((emailResponse) => {
        console.log(timestamp + `Sending password reset email to app_user for ${username}`);
        if (emailResponse.code) {
          console.log(timestamp + "Gmail error status - " + emailResponse.response.status);
          console.log(timestamp + "Gmail error statusText - " + emailResponse.response.statusText);
          console.log(timestamp + "Gmail error data - " + emailResponse.response.data.error + " - " + emailResponse.response.data.error_description);
        }
        else {
          console.log(timestamp + "Sent to - " + emailResponse.accepted);
          console.log(timestamp + "Response - " + emailResponse.response);
          res.status(200).send({ api_msg: "success" });
        }
      })
      .catch(err => {
        console.log(err);
        res.status(200).send({ api_msg: "fail" });
      })
  }
  else {
    res.status(200).send({ api_msg: "fail" });
  }
}));

/*******************************************************************************************
 * NO ROUTES FUNCTIONS OR DECLARATIONS BELOW THIS DIVIDER 
 *******************************************************************************************
 * You only export and do nothing else here
 */
module.exports = router;