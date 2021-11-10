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
const consoleLogger = require('../middleware/loggerMiddleware');
const asyncHandler = require('express-async-handler');

/**************************************************************************
 * Router Middlewares and parsers																					*
 **************************************************************************/
router.use(express.json());
// router.use(express.urlencoded({ extended: true }));
router.use(authTokenMiddleware);
router.use(consoleLogger);

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
 * Check tag
 ****************************************************************************
 */
router.get("/verifytag/:tag", asyncHandler(async(req, res, next) => {
  // This route retrieves all the existing tags
  // TEMP ARRAY TO RETURN TO FRONTEND
  const selectedTag = req.params.tag;

  var sqlCheckQuery = `SELECT EXISTS(SELECT rest_tag_1, rest_tag_2, rest_tag_3 FROM restaurant WHERE rest_tag_1="${selectedTag}" `
  sqlCheckQuery +=`OR rest_tag_2="${selectedTag}" OR rest_tag_3="${selectedTag}") AS EXISTCHECK`

  const queryResponse = await new Promise((resolve, reject) => {
    dbconn.query(sqlCheckQuery, function(err, results, fields){
      if (err) {
        console.log(err);
        reject(err);
      }
      else {
        resolve(results);
      }
    });
  });

  if (queryResponse[0].EXISTCHECK == 1) {
    res.status(200).send({ api_msg: "exist"});
  }
  else {
    res.status(200).send({ api_msg: "not found"});
  }
}));

/****************************************************************************
 * Delete tag
 ****************************************************************************
 */
router.delete("/deletetag", asyncHandler(async(req, res, next) => {
  // This route retrieves all the existing tags
  // TEMP ARRAY TO RETURN TO FRONTEND
  const tagName = req.body.tagName;

  console.log(tagName)

  var sqlCheckQuery = `DELETE FROM rest_tags WHERE restaurant_tag="${tagName}"`

  dbconn.query(sqlCheckQuery, function(err, results, fields){
    if (err) {
      console.log(err);
      res.status(200).send({ api_msg: err });
    }
    else {
      if (results.affectedRows == 1) {
        res.status(200).send({ api_msg: "success"});
      }
      else {
        res.status(200).send({ api_msg: "fail"});
      }
    }
  });
}));

/****************************************************************************
 * Route Template                     																			*
 ****************************************************************************
 */
router.post("/approve", (req, res) => {
  console.log("Approving a restaurant!");
  // 1. Get the restaurant's ID
  const { restID } = req.body;

  // 2. Update status of restaurant
  var sqlUpdateQuery = `UPDATE restaurant SET rest_status="first" `;
  sqlUpdateQuery += `WHERE restaurant_ID=${restID}`;

  // send query to sql server
  dbconn.query(sqlUpdateQuery, function(err, results, fields){
    if (err) {
      console.log(err)
      res.status(200).json({ api_msg: "MySQL " + err });
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
                  // console.log("sendmail triggered successfully!");
                  // console.log(result);
                  // 4. Response back to axios call with api_msg
                  res.status(200).json({ api_msg: "Successful!" });
                })
                .catch((error) => console.log(error.message));
            })
            .catch((err) => {
              console.log(err);
            });
        }
      });  // Nested Query
    }
  });  // First query
});

/*******************************************************************************************
 * NO ROUTES FUNCTIONS OR DECLARATIONS BELOW THIS DIVIDER 
 *******************************************************************************************
 * You only export and do nothing else here
 */
module.exports = router;