// Express Server imports
const express = require('express');
const router = express.Router();

// Database matters
const dbconn = require('../models/db_model');

// General Imports
const { v4: uuidv4 } = require('uuid');
const datetime_T = require('date-and-time');
const pw_gen = require('generate-password');
const fs = require('fs');
const path = require('path');

// For image uploads
// const multer = require('multer');

// Google maps api stuff
// const { Client, defaultAxiosInstance } = require('@googlemaps/google-maps-services-js');

// iCal stuff
const iCal = require('ical-generator');

// Email Modules
const sendMail = require('../models/email_model');
const { sendRGMEmail } = require('../models/credentials_email_template');

// Middle Ware stuffs
const authTokenMiddleware = require('../middleware/authTokenMiddleware');
const asyncHandler = require('express-async-handler');

/**************************************************************************
 * Router Middlewares and parsers																					*
 **************************************************************************/
router.use(express.json());
// router.use(express.urlencoded({ extended: true }));
router.use(authTokenMiddleware);

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
 * Getting all the pending restaurants																			*
 ****************************************************************************
 */
router.get("/activerestaurants", (req, res) => {
  // This route retrieves all the restaurants that are registered as a pending
  // account.
  // 1. Select all the restaurants that have the pending status and return it
  var sqlGetQuery = `SELECT * FROM restaurant WHERE rest_status!="pending"`

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
 * Getting all the pending restaurants																			*
 ****************************************************************************
 */
router.get("/activecustomers", (req, res) => {
  // This route retrieves all the restaurants that are registered as a pending
  // account.
  // 1. Select all the restaurants that have the pending status and return it
  var sqlGetQuery = `SELECT customer_ID, cust_username, first_name, last_name, phone_no, email `;
  sqlGetQuery += `FROM customer_user JOIN app_user ON username=cust_username `;
  sqlGetQuery += `WHERE account_status="active"`

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
 * Getting all restaurant Tags																			*
 ****************************************************************************
 */
router.get("/retrievetags", asyncHandler(async(req, res, next) => {
  // This route retrieves all the existing tags
  // TEMP ARRAY TO RETURN TO FRONTEND
  var tempTagsArray = [];
  var tempID = 0;

  // 1. Select all the existing tags and then construct a readable DataGRID
  // for react to read
  var sqlGetQuery = `SELECT * FROM rest_tags`

  const queryResults = await new Promise((resolve, reject) => {
    dbconn.query(sqlGetQuery, function(error, results, fields){
      if (error) {
        console.log("MySQL " + error);
        reject(err)
      }
      else {
        resolve(results);
      }
    });
  });

  for (let tag of queryResults) {
    var tempJSON = {
      id: ++tempID,
      tag: tag.restaurant_tag,
      tag_desc: tag.rest_tag_desc
    }

    tempTagsArray.push(tempJSON);
  }

  res.status(200).send(tempTagsArray);
}));

/****************************************************************************
 * Add new Tag
 ****************************************************************************
 */
router.post("/newtag", (req, res) => {
  // This route retrieves all the existing tags
  // TEMP ARRAY TO RETURN TO FRONTEND
  const { newTag } = req.body;

  console.log(newTag);

  var sqlInsertNew = "INSERT INTO `rest_tags`(`restaurant_tag`) "
  sqlInsertNew += `VALUES ("${newTag}")`;

  dbconn.query(sqlInsertNew, function(err, results, fields){
    if (err) {
      if (err.errno == 1062) {
        res.status(200).send({ api_msg: `Duplicate entry! Tag ${newTag} already exist!`});
      }
      else {
        res.status(200).send({ api_msg: "fail"});
      }
    }
    else {
      res.status(200).send({ api_msg: "success" });
    }
  });
});

/****************************************************************************
 * Route Template                     																			*
 ****************************************************************************
 */
router.post("/approve", (req, res) => {
  console.log("Approving a restaurant!");
  // 1. Get the restaurant's ID
  const restID = req.body;

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

      console.log(results);
      // First the get info query
      // Nested Query
    }
  });  // First query
});

/*******************************************************************************************
 * NO ROUTES FUNCTIONS OR DECLARATIONS BELOW THIS DIVIDER 
 *******************************************************************************************
 * You only export and do nothing else here
 */
module.exports = router;