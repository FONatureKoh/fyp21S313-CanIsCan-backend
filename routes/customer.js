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
const { Client, defaultAxiosInstance } = require('@googlemaps/google-maps-services-js');

// Email Modules
const sendMail = require('../models/email_model');
const { sendSubUserEmail } = require('../models/email_templates');

// Middle Ware stuffs
const authTokenMiddleware = require('../middleware/authTokenMiddleware');
const { response } = require('express');

/**************************************************************************
 * Router Middlewares and parsers																					*
 **************************************************************************/
router.use(express.json());
router.use(express.urlencoded({ extended: true }))
router.use(authTokenMiddleware);

/****************************************************************************
 * Retrieve a single restaurant's information         											*
 ****************************************************************************
 */
router.get('/singleRestaurantInfo/:restID', (req, res) => {
	// Save the restaurantID first from the URL
	const restID = req.params.restID;

	// Construct getQuery
	var sqlGetQuery =  `SELECT * FROM restaurant `;
  sqlGetQuery += `WHERE restaurant_ID=${restID}`

	dbconn.query(sqlGetQuery, function (err, results, fields){
		if (err) {
			res.status(200).json({ api_msg: "MySQL " + err });
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
        
        // Send back to the frontend
        res.status(200).send(restaurantProfileData);
      });
		}
	})
});

/****************************************************************************
 * Retrieve restaurant's menu and all items information											*
 ****************************************************************************
 */
router.get('/allRestaurantInfo', (req, res) => {
	// Save the restaurantID first from the URL
	const { username } = res.locals.userData;

	// Construct getQuery
	var sqlGetQuery =  `SELECT * FROM restaurant `;

	dbconn.query(sqlGetQuery, function (err, results, fields){
		if (err) {
			res.status(200).json({ api_msg: "MySQL " + err });
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

	dbconn.query(sqlGetQuery, function (err, results, fields){
		if (err) {
			res.status(200).json({ api_msg: "MySQL " + err });
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
router.get('/allRestaurantItems/:restID', (req, res) => {
	// Save the restaurantID first from the URL
	const { username } = res.locals.userData;
  const restID = req.params.restID;

	// Construct getQuery
	var sqlGetQuery =  `SELECT * FROM rest_item JOIN rest_item_categories `;
  sqlGetQuery += `ON ri_cat_ID=ric_ID AND ri_rest_ID=${restID} `
  sqlGetQuery += `ORDER BY ric_name`;

	dbconn.query(sqlGetQuery, function (err, results, fields){
		if (err) {
			res.status(200).json({ api_msg: "MySQL " + err });
		}
		else {
      // Since the result is an Array, we will need to transform accordingly
      // using the for each array element method
      res.status(200).send(results);
		}
	})
});

/****************************************************************************
 * Retrieve all of the customer's personal orders                           *
 ****************************************************************************/
router.get('/alldeliveryorders', (req, res) => {
	// Save the restaurantID first from the URL
	const { username } = res.locals.userData;

  // console.log(username);

  // 1. Get the customer's ID from the customer_users table
  var sqlGetIDQuery = `SELECT customer_ID FROM customer_user `;
  sqlGetIDQuery += `WHERE cust_username="${username}"`;

  dbconn.query(sqlGetIDQuery, function(err, results, fields){
    if (err) {
      res.status(200).send({ api_msg: "MySQL " + err });
    }
    else{
      const custID = results[0].customer_ID;
      // 2. Then simply return all the orders that matches the customer's ID 
      // and we will parse the info at the front
      var sqlGetQuery = `SELECT * FROM delivery_order WHERE o_cust_ID=${custID}`;

      dbconn.query(sqlGetQuery, function(err, results, field) {
        if (err) {
          res.status(200).send({ api_msg: "MySQL " + err });
        }
        else {
          res.status(200).send(results);
        }
      }) // close nested query
    }
  }) // close first query
});

/****************************************************************************
 * Retrieve all of the customer's order items                               *
 ****************************************************************************/
router.get('/orderitems/:orderID', (req, res) => {
	// Save the restaurantID first from the URL
	const { username } = res.locals.userData;
  const orderID = req.params.orderID;

  // 1. Get the customer's ID from the customer_users table
  var sqlGetIDQuery = `SELECT * FROM do_item `;
  sqlGetIDQuery += `WHERE do_order_ID="${orderID}"`;

  dbconn.query(sqlGetIDQuery, function(err, results, fields){
    if (err) {
      res.status(200).send({ api_msg: "MySQL " + err });
    }
    else{
      res.status(200).send(results);
    }
  }) // close first query
});

/****************************************************************************
 * Submit Restaurant Review                                                 *
 ****************************************************************************/
router.post('/submitreview', (req, res) => {
	// Save the restaurantID first from the URL
	const { username } = res.locals.userData;
  const { restID, restName, restRating, reviewTitle, reviewDesc } = req.body;
  
  // First things for this, first we need to get the Customer's name
  var sqlGetNameQuery = `SELECT first_name, last_name FROM customer_user `;
  sqlGetNameQuery += `WHERE cust_username="${username}"`;

  dbconn.query(sqlGetNameQuery, function(err, results, fields){
    if (err) {
      res.status(200).send({ api_msg: "MySQL " + err });
    }
    else {
      // Construct full name
      const fullName = results[0].first_name + " " + results[0].last_name;

      // Then we construct an insert query within that query to push the review
      var sqlInsertQuery = "INSERT INTO rest_review(`rr_rest_ID`, `rr_rest_name`, "
      sqlInsertQuery += "`rr_cust_name`, `review_rating`, `review_title`, `review_desc`)" 
      sqlInsertQuery += `VALUES (${restID}, "${restName}", "${fullName}", "${restRating}",`
      sqlInsertQuery += `"${reviewTitle}", "${reviewDesc}")`

      dbconn.query(sqlInsertQuery, function(err, results, fields){
        if (err) {
          res.status(200).send({ api_msg: "MySQL " + err });
        }
        else {
          res.status(200).send({ api_msg: "Successful review!" });
        }
      }); // Close for nested query
    }
  })  // Close for first query
  // We will then have to look at triggering a function to update the restaurant's
  // rating without affecting this route. 
});

/****************************************************************************
 * Submit an order to the system                                            *
 ****************************************************************************/
router.post('/submitorder', (req, res) => {
	// Save some important variables
	const { username } = res.locals.userData;
  const { doID, restID, restName, orderDateTime, address, floorunit, postalCode,
    companyName, deliveryNote, totalCost, orderItems} = req.body;

  // Transform date to sql formate
  const sqlOrderDateTime = datetime_T.format(new Date(orderDateTime), "YYYY-MM-DD HH:mm:ss");
  const sqlTotalCost = parseFloat(totalCost).toFixed(2);

  console.log(req.body);

  // We're trying to submit an order here. This has 3 parts. One is to create the 
  // order first in the table. Then to put the items into the items table, and end off
  // when sending an email to the customer, with the items and order details, and 
  // delivery time.


  // First things for this, first we need to get the Customer's name
  var sqlGetInfoQuery = `SELECT customer_ID, first_name, last_name FROM customer_user `;
  sqlGetInfoQuery += `WHERE cust_username="${username}"`;
  
  dbconn.query(sqlGetInfoQuery, function(err, results, fields){
    if (err) {
      console.log(err);
    }
    else {
      // console.log(results);
      const custID = results[0].customer_ID
      const fullName = results[0].first_name + " " + results[0].last_name;

      // 1. We create the query for insert into order table, and query
      var sqlInsertQuery = "INSERT INTO delivery_order(`order_ID`, `o_cust_ID`, `o_rest_ID`, ";
      sqlInsertQuery += "`o_cust_name`, `o_rest_name`, `o_datetime`, `delivery_address`, ";
      sqlInsertQuery += "`delivery_floorunit`, `delivery_postal_code`, `delivery_note`, ";
      sqlInsertQuery += "`total_cost`, `order_delivery_time`, `order_status`, `payment_status`)";
      sqlInsertQuery += `VALUES ("${doID}", ${custID}, ${restID}, "${fullName}", "${restName}", "${sqlOrderDateTime}", `;
      sqlInsertQuery += `"${address}", "${floorunit}", ${postalCode},"${deliveryNote}", ${sqlTotalCost}, "0:30:00", "Pending", 1)`;

      dbconn.query(sqlInsertQuery, function(err, results, fields){
        if (err) {
          console.log(err);
        }
        else {
          console.log(results);
          for (var x in orderItems) {
            const item = JSON.parse(orderItems[x]);
            console.log(JSON.parse(orderItems[x]));

            var sqlInsertQuery = "INSERT INTO do_item(`do_order_ID`, `do_rest_item_ID`, ";
            sqlInsertQuery += "`do_item_name`, `do_item_price`, `do_item_qty`, `special_order`) ";
            sqlInsertQuery += `VALUES ("${doID}", ${item.itemID}, "${item.itemName}", ${item.itemPrice}, ${item.itemQty}, "NIL")`;

            dbconn.query(sqlInsertQuery, function(err, results, fields) {
              if (err) {
                console.log(err);
              }
              else {
                console.log(results);
              }
            });
          }
        }
      })

      // 3. Send the email to the customer accordingly
    }
  });

  res.status(200).send("yea something happened");
});

/****************************************************************************
 * Testing the map services google api                                      *
 ****************************************************************************/
router.get('/testapi', (req, res) => {
  // Get the api key
  const apikey = process.env.GOOGLE_MAPS_API_KEY;

  // api declaration
  const apiClient = new Client({});

  // Directions api test
  apiClient.directions({
    params: {
      origin: "68 Verde Avenue, Singapore 688336",
      destination: "21 Choa Chu Kang Ave 4, Singapore 689812",
      mode: "driving",
      units: "metric",
      key: apikey
    }
  }, defaultAxiosInstance)
  .then(response => {
    res.status(200).json(response.data);
    // res.status(200).json(response.data.routes[0].legs[0].distance.value);
  })
  .catch(err => {
    console.log(err);
  })

  // For geocoding
  // apiClient.geocode({
  //   params: {
  //     address: "68 Verde Avenue",
  //     key: apikey
  //   },
  //   timeout: 10000
  // }, defaultAxiosInstance)
  // .then(response => {
  //   console.log(response.data.results[0]);
  // })
  // .catch(err => {
  //   console.log(err)
  // })
});

/****************************************************************************
 * Testing the map services google api                                      *
 ****************************************************************************/
router.get('/availableslots/:restID/:date', (req, res) => {
  // Getting some important variables
  const { username } = res.locals.userData;
  const { restID, date } = req.params;
  
  // Console logging to see what is going on
  // console.log(restID, date);

  // Okay, so what do we need to do here.
  // 1. Get the settings for the specific restaurant
  var sqlGetSettingsQuery = "SELECT * FROM rest_reservation_setting ";
  sqlGetSettingsQuery += `WHERE rrs_rest_ID=${restID}`;

  dbconn.query(sqlGetSettingsQuery, function(err, results, fields){
    if (err) {
      res.status(200).send({ api_msg: "MySQL " + err});
    }
    else {
      // Get some of the info from the results 
      const interval = results[0].reservation_interval;
      const starttime = results[0].reservation_starttime;
      const endtime = results[0].reservation_endtime;
      const max = 2

      // 2. Generate the slots according to the settings
      // console.log(starttime_obj);
      // console.log(endtime_obj);
      var tempSlotsArray = [];

      const starttime_obj = new Date(datetime_T.parse(starttime, "hh:mm:ss"));
      const endtime_obj = new Date(datetime_T.parse(endtime, "hh:mm:ss"));

      var timeslot = starttime_obj;
      
      // The following creates the timeslots
      do {
        //console.log(datetime_T.format(timeslot, 'HH:mm'));
        var tempJSON = {
          timeslot: datetime_T.format(timeslot, 'HH:mm'),
          available: true
        }

        tempSlotsArray.push(tempJSON);

        timeslot = datetime_T.addHours(timeslot, +interval);
      } while (timeslot <= endtime_obj);

      // res.status(200).send(tempSlotsArray);
      // 3. Have another query to check through the reservations and select the ones
      // that falls on the selected date, and check against the max tables to see if 
      // the slot should be set as available (true) or not (false)
      var sqlGetReservations = `SELECT cr_timeslot, COUNT(cr_timeslot) AS reservations_count `;
      sqlGetReservations += `FROM cust_reservation `;
      sqlGetReservations += `WHERE cr_date="${datetime_T.format(new Date(date), 'YYYY-MM-DD')}" `;
      sqlGetReservations += `GROUP BY cr_timeslot`;

      dbconn.query(sqlGetReservations, function(err, results, fields) {
        if (err) {
          res.status(200).send({ api_msg: "MySQL " + err});
        }
        else {
          results.forEach((timeslot) => {
            tempSlotsArray.forEach((slot) => {
              if (timeslot.cr_timeslot.slice(0, -3) == slot.timeslot && timeslot.reservations_count >= max) {
                slot.available = false;
                // console.log(slot);
              }
            })
          })

          // 4. Return this to the frontend
          res.status(200).send(tempSlotsArray);
        }
      }); // closing nested query
    }
  }); // Closing first query
});

// Router Export
module.exports = router;