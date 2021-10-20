// username, email, phone, rest name
const express = require("express");
const authTokenMiddleware = require("../middleware/authTokenMiddleware");
const router = express.Router();
const dbconn = require("../models/db_model");
const pw_gen = require('generate-password');

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
// router.get("/pending", (req, res) => {});

module.exports = router;