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
const multer = require('multer');

// Email Modules
const sendMail = require('../models/email_model');
const { sendSubUserEmail } = require('../models/email_templates');

// Middle Ware stuffs
const authTokenMiddleware = require('../middleware/authTokenMiddleware');

/**************************************************************************
 * Router Middlewares and parsers																					*
 **************************************************************************/
router.use(express.json());
router.use(authTokenMiddleware);

/****************************************************************************
 * Retrieve restaurant's menu and all items information											*
 ****************************************************************************
 */
router.get('/allRestaurantInfo', (req, res) => {
	// Save the restaurantID first from the URL
	const { username } = res.locals.userData;

	// Construct getQuery
	var sqlGetQuery =  `SELECT * FROM restaurant `;

	dbconn.query(sqlGetQuery, function (error, results, fields){
		if (error) {
			res.status(200).json({ api_msg: "MySQL " + error });
		}
		else {
      // Since the result is an Array, we will need to transform accordingly
      // using the for each array element method
      let restaurantsArray = [];

      results.forEach(restaurant => {
        // 2. We need to transform 2 things:
        //		- Time	
        var rest_op_hours = datetime_T.transform(restaurant.rest_opening_time, 'HH:mm:ss', 'hh:mm A');
        rest_op_hours += ' to ' + datetime_T.transform(restaurant.rest_closing_time, 'HH:mm:ss', 'hh:mm A');

        //		- Tags
        var rest_tags = [];

        if (restaurant.rest_tag_1) 
          rest_tags.push(restaurant.rest_tag_1);

        if (restaurant.rest_tag_2) 
          rest_tags.push(restaurant.rest_tag_2);

        if (restaurant.rest_tag_3) 
          rest_tags.push(restaurant.rest_tag_3);

        // 3. Then we send the other necessary information together with it back to the frontend
        // in json format
        const restaurantProfileData = {
          restaurant_ID: restaurant.restaurant_ID,
          restaurant_name: restaurant.restaurant_name,
          rest_rgm_username: restaurant.rest_rgm_username,
          rest_banner_ID: restaurant.rest_banner_ID,
          rest_op_hours: rest_op_hours,
          rest_phone_no: restaurant.rest_phone_no,
          rest_address_info: restaurant.rest_address_info,
          rest_postal_code: restaurant.rest_postal_code,
          rest_tags: rest_tags,
          rest_rating: restaurant.rest_rating,
          rest_status: restaurant.rest_status,
          rest_opening_time: restaurant.rest_opening_time,
          rest_closing_time: restaurant.rest_closing_time,
          rest_tag_1: restaurant.rest_tag_1, 
          rest_tag_2: restaurant.rest_tag_2,
          rest_tag_3: restaurant.rest_tag_3
        }  

        // Push into the array that will send the data back
        restaurantsArray.push(restaurantProfileData);      
      });

      // Send back to the frontend
      res.status(200).send(restaurantsArray);
		}
	})
});

/****************************************************************************
 * Retrieve restaurant's menu and all items information											*
 ****************************************************************************/
router.get('/selectedRestaurantInfo/:tag', (req, res) => {
	// Save the restaurantID first from the URL
	const { username } = res.locals.userData;

  // Get the tag from the url
  const tag = req.params.tag;

	// Construct getQuery
	var sqlGetQuery =  `SELECT * FROM restaurant `;
  sqlGetQuery += `WHERE rest_tag_1="${tag}" OR rest_tag_2="${tag}" OR rest_tag_3="${tag}"`;

	dbconn.query(sqlGetQuery, function (error, results, fields){
		if (error) {
			res.status(200).json({ api_msg: "MySQL " + error });
		}
		else {
      // Since the result is an Array, we will need to transform accordingly
      // using the for each array element method
      let restaurantsArray = [];

      results.forEach(restaurant => {
        // 2. We need to transform 2 things:
        //		- Time	
        var rest_op_hours = datetime_T.transform(restaurant.rest_opening_time, 'HH:mm:ss', 'hh:mm A');
        rest_op_hours += ' to ' + datetime_T.transform(restaurant.rest_closing_time, 'HH:mm:ss', 'hh:mm A');

        //		- Tags
        var rest_tags = [];

        if (restaurant.rest_tag_1) 
          rest_tags.push(restaurant.rest_tag_1);

        if (restaurant.rest_tag_2) 
          rest_tags.push(restaurant.rest_tag_2);

        if (restaurant.rest_tag_3) 
          rest_tags.push(restaurant.rest_tag_3);

        // 3. Then we send the other necessary information together with it back to the frontend
        // in json format
        const restaurantProfileData = {
          restaurant_ID: restaurant.restaurant_ID,
          restaurant_name: restaurant.restaurant_name,
          rest_rgm_username: restaurant.rest_rgm_username,
          rest_banner_ID: restaurant.rest_banner_ID,
          rest_op_hours: rest_op_hours,
          rest_phone_no: restaurant.rest_phone_no,
          rest_address_info: restaurant.rest_address_info,
          rest_postal_code: restaurant.rest_postal_code,
          rest_tags: rest_tags,
          rest_rating: restaurant.rest_rating,
          rest_status: restaurant.rest_status,
          rest_opening_time: restaurant.rest_opening_time,
          rest_closing_time: restaurant.rest_closing_time,
          rest_tag_1: restaurant.rest_tag_1, 
          rest_tag_2: restaurant.rest_tag_2,
          rest_tag_3: restaurant.rest_tag_3
        }  

        // Push into the array that will send the data back
        restaurantsArray.push(restaurantProfileData);      
      });

      // Send back to the frontend
      res.status(200).send(restaurantsArray);
		}
	})
});

// Router Export
module.exports = router;