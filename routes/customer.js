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
const { sendSubUserEmail } = require('../models/credentials_email_template');
const { sendCustomerOrder, sendToRestaurant } = require('../models/order_email_template');

// Middle Ware stuffs
const authTokenMiddleware = require('../middleware/authTokenMiddleware');
const asyncHandler = require('express-async-handler');

// Stripe stuffs
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

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
      // 2. We need to transform 2 things:
      //		- Time	
      var rest_op_hours = datetime_T.transform(results[0].rest_opening_time, 'HH:mm:ss', 'hh:mm A');
      rest_op_hours += ' to ' + datetime_T.transform(results[0].rest_closing_time, 'HH:mm:ss', 'hh:mm A');

      //		- Tags
      var rest_tags = [];

      if (results[0].rest_tag_1) 
        rest_tags.push(results[0].rest_tag_1);

      if (results[0].rest_tag_2) 
        rest_tags.push(results[0].rest_tag_2);

      if (results[0].rest_tag_3) 
        rest_tags.push(results[0].rest_tag_3);

      // 3. Then we send the other necessary information together with it back to the frontend
      // in json format
      const restaurantProfileData = {
        restaurant_ID: results[0].restaurant_ID,
        restaurant_name: results[0].restaurant_name,
        rest_rgm_username: results[0].rest_rgm_username,
        rest_banner_ID: results[0].rest_banner_ID,
        rest_op_hours: rest_op_hours,
        rest_phone_no: results[0].rest_phone_no,
        rest_email: results[0].rest_email,
        rest_address_info: results[0].rest_address_info,
        rest_postal_code: results[0].rest_postal_code,
        rest_tags: rest_tags,
        rest_rating: results[0].rest_rating,
        rest_status: results[0].rest_status,
        rest_opening_time: results[0].rest_opening_time,
        rest_closing_time: results[0].rest_closing_time,
        rest_tag_1: results[0].rest_tag_1, 
        rest_tag_2: results[0].rest_tag_2,
        rest_tag_3: results[0].rest_tag_3
      }
      
      // Send back to the frontend
      res.status(200).send(restaurantProfileData);;
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
// Async function to send email to both customer and restaurant
async function sendingOrderEmail(restEmail, custEmail, custName, restName, 
  deliveryAddress, deliveryPostal, datetime, doID, etd, orderItems, total) {
    try {
      // Construct the email for customer
      const custMailOptions = await sendCustomerOrder(custEmail, restName, custName,
        deliveryAddress, deliveryPostal, datetime, doID, etd, orderItems, total);

      const restMailOptions = await sendToRestaurant(restEmail, restName, custName,
        deliveryAddress, deliveryPostal, datetime, doID, orderItems, total);
      
      // Send the email to the customer
      const custResponse = await sendMail(custMailOptions);
      
      console.log("An attempt was made to send an email to a customer with the following result:");
      console.log(custResponse);

      // Send the email to the restaurant administrator
      const restResponse = await sendMail(restMailOptions);
      
      console.log("An attempt was made to send an email to a restaurant with the following result:");
      console.log(restResponse);

      // API response
      if (custResponse.response.include("OK") && restResponse.response.include("OK")) {
        return "success";
      }
      else {
        return "fail";
      }
    }
    catch (err) {
      return err;
    }
};

router.post('/submitorder', asyncHandler(async (req, res, next) => {
	// Save some important variables
  const googleAPIClient = new Client({}); // Google maps services API
	const { username } = res.locals.userData;
  const { doID, restID, restName, restEmail, orderDateTime, address, floorunit, postalCode,
    companyName, deliveryNote, totalCost, orderItems, restAddress} = req.body;

  // Transform date to sql formate
  const sqlOrderDateTime = datetime_T.format(new Date(orderDateTime), 'YYYY-MM-DD HH:mm:ss');
  const sqlTotalCost = parseFloat(totalCost).toFixed(2);

  // Transform date for customer and restaurant email
  const readableDate = datetime_T.format(new Date(orderDateTime), 'DD MMM YYYY, hh:mm A');

  // Construct data 
  const custAddress = address + ", Singapore " + postalCode;

  // console.log(restAddress);
  // console.log(custAddress);
  // Directions api to get duration
  const directionsResponse = await googleAPIClient.directions({
    params: {
      origin: restAddress,
      destination: custAddress,
      mode: "driving",
      units: "metric",
      key: process.env.GOOGLE_MAPS_API_KEY
    }
  }, defaultAxiosInstance);

  // Estimated Delivery Time
  const durationTaken = directionsResponse.data.routes[0].legs[0].duration;
  const timeString = new Date(durationTaken.value * 1000).toISOString().substr(11, 8);

  const etd = timeString;

  // console.log(etd);

  // We're trying to submit an order here. This has 3 parts. One is to create the 
  // order first in the table. Then to put the items into the items table, and end off
  // when sending an email to the customer, with the items and order details, and 
  // delivery time.

  // First things for this, first we need to get the Customer's name
  var sqlGetInfoQuery = `SELECT customer_ID, first_name, last_name, email `;
  sqlGetInfoQuery += `FROM customer_user WHERE cust_username="${username}"`;
  
  dbconn.getConnection(function(err, conn) {
    if (err) {
      console.log(err);
    }
    else {
      conn.query(sqlGetInfoQuery, function(err, results, fields){
        if (err) {
          console.log(err);
        }
        else {
          // console.log(results);
          const custID = results[0].customer_ID
          const fullName = results[0].first_name + " " + results[0].last_name;
          const custEmail = results[0].email;

          // 1. We create the query for insert into order table, and query
          var sqlInsertQuery = "INSERT INTO delivery_order(`order_ID`, `o_cust_ID`, `o_rest_ID`, ";
          sqlInsertQuery += "`o_cust_name`, `o_rest_name`, `o_datetime`, `delivery_address`, ";
          sqlInsertQuery += "`delivery_floorunit`, `delivery_postal_code`, `delivery_note`, ";
          sqlInsertQuery += "`total_cost`, `order_delivery_time`, `order_status`, `payment_status`)";
          sqlInsertQuery += `VALUES ("${doID}", ${custID}, ${restID}, "${fullName}", "${restName}", "${sqlOrderDateTime}", `;
          sqlInsertQuery += `"${address}", "${floorunit}", ${postalCode},"${deliveryNote === '' ? 'NIL': deliveryNote}", `;
          sqlInsertQuery += `${sqlTotalCost}, "${etd}", "Pending", 1)`;

          conn.query(sqlInsertQuery, function (err, results, fields){
            if (err){
              console.log(err);
            }
            else {
              // If the Order is successfully created, then we can insert all the Order Items into the database.
              // We first check if the OrderItems have multiple items, or if the user is just ordering 1 item
              // If multiple items, proceed
              if (Array.isArray(orderItems) == true) {
                for (let x in orderItems) {
                  const item = JSON.parse(orderItems[x]);

                  var sqlInsertItemsQuery = "INSERT INTO do_item(`do_order_ID`, `do_rest_item_ID`, ";
                  sqlInsertItemsQuery += "`do_item_name`, `do_item_price`, `do_item_qty`, `special_order`) ";
                  sqlInsertItemsQuery += `VALUES ("${doID}", ${item.itemID}, "${item.itemName}", ${item.itemPrice}, ${item.itemQty}, "NIL")`;

                  conn.query(sqlInsertItemsQuery, function(err, results, fields) {
                    if (err) {
                      console.log(err);
                    }
                    else {
                      // console.log(results);
                      // Check if its the last item 
                      if (Number(x) == (orderItems.length - 1)) {

                        // Release the connection
                        conn.release();

                        sendingOrderEmail(restEmail, custEmail, fullName, restName, address,
                          postalCode, readableDate, doID, etd, orderItems, sqlTotalCost)
                          .then((response) => {
                            if (response == "success") {
                              res.status(200).send({api_msg: "Your order has been made successfully. Please check your email for confirmation!"});
                            }
                            else {
                              res.status(200).send({api_msg: "Something went wrong, please contact an administrator."});
                            }  
                          });
                      };
                    };
                  });
                };
              }
              // Else we treat it as a single item
              else {
                const item = JSON.parse(orderItems);
                // console.log(JSON.parse(orderItems));

                var sqlInsertItemsQuery = "INSERT INTO do_item(`do_order_ID`, `do_rest_item_ID`, ";
                sqlInsertItemsQuery += "`do_item_name`, `do_item_price`, `do_item_qty`, `special_order`) ";
                sqlInsertItemsQuery += `VALUES ("${doID}", ${item.itemID}, "${item.itemName}", ${item.itemPrice}, ${item.itemQty}, "NIL")`;

                conn.query(sqlInsertItemsQuery, function(err, results, fields) {
                  if (err) {
                    console.log(err);
                  }
                  else {
                    // Release the connection
                    conn.release();

                    sendingOrderEmail(restEmail, custEmail, fullName, restName, address,
                      postalCode, readableDate, doID, etd, orderItems, sqlTotalCost)
                      .then((response) => {
                        if (response == "success") {
                          res.status(200).send({api_msg: "Your order has been made successfully. Please check your email for confirmation!"});
                        }
                        else {
                          res.status(200).send({api_msg: "Something went wrong, please contact an administrator."});
                        }                        
                      });
                  };
                });// Closing nested query
              };
            };
          }); // Closing 2nd query to same connection
        };
      }); // Closing first query
    };
  }); // this closes the connection pool
}));

/****************************************************************************
 * STRIPE CHECKOUT
 ****************************************************************************/
router.post('/checkout', async(req, res) => {
  // console.log("Request:", req.body);
  try {
    // Getting some essentials
    let paymentStatus;

    const { doID, token, totalCost } = req.body;

    // Convert the total cost to integer
    const totalCostCents = (totalCost * 100).toFixed(0);

    const customer = await stripe.customers.create({
      email: token.email,
      source: token.id
    });

    const idempotencyKey = uuidv4();
    const charge = await stripe.charges.create(
      {
        amount: totalCostCents,
        currency: "sgd",
        customer: customer.id,
        receipt_email: token.email,
        description: `Payment confirmed for ${doID}`,
        shipping: {
          name: token.card.name,
          address: {
            line1: token.card.address_line1,
            line2: token.card.address_line2,
            city: token.card.address_city,
            country: token.card.address_country,
            postal_code: token.card.address_zip
          }
        }
      },
      {
        idempotencyKey
      }
    );
    // console.log("Charge:", { charge });
    paymentStatus = "success";

    res.json({ errorMsg: "No Error", paymentStatus });
  } 
  catch (error) {
    // console.error("Error:", error);
    paymentStatus = "failure";

    res.json({ errorMsg: error, paymentStatus });
  }
});

/****************************************************************************
 * Geocoding to verify the address of the customer                          *
 ****************************************************************************/
router.get('/verifyCustAddress/:address', asyncHandler(async (req, res, next) => {
  // Get url params
  const address = req.params.address;

  // api declaration
  const googleAPIClient = new Client({});

  // Directions api test
  const response = await googleAPIClient.geocode({
    params: {
      address: address,
      key: process.env.GOOGLE_MAPS_API_KEY
    }
  }, defaultAxiosInstance);

  console.log(response.data);

  res.status(200).json(response.data);
}));

/****************************************************************************
 * Testing the map services google api                                      *
 ****************************************************************************/
router.get('/testapi', asyncHandler(async (req, res, next) => {
  // api declaration
  const googleAPIClient = new Client({});

  // Directions api test
  const response = await googleAPIClient.directions({
    params: {
      origin: "Blk 111 Ang Mo Kio #01-01, Singapore 560111",
      destination: "1 King Albert Park, Singapore 598389",
      mode: "driving",
      units: "metric",
      key: process.env.GOOGLE_MAPS_API_KEY
    }
  }, defaultAxiosInstance);

  const durationTaken = response.data.routes[0].legs[0].duration;
  const convertedTimeStamp = new Date(durationTaken.value * 1000).toISOString().substr(11, 8);

  res.status(200).send(convertedTimeStamp);
}));

/****************************************************************************
 * Getting available Reservation slots                                      *
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

/*******************************************************************************************
 * NO ROUTES FUNCTIONS OR DECLARATIONS BELOW THIS DIVIDER 
 *******************************************************************************************
 * You only export and do nothing else here
 */
module.exports = router;