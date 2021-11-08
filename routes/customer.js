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
const iCal = require('ical-generator');
const chalk = require('chalk');

// Stripe stuffs
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// For image uploads
// const multer = require('multer');

// Google maps api stuff
const { Client, defaultAxiosInstance } = require('@googlemaps/google-maps-services-js');

// A good looking timestamp
let timestamp = `[${chalk.green(datetime_T.format(new Date(), 'YYYY-MM-DD HH:mm:ss'))}] `;

// Email Modules
const sendMail = require('../models/email_model');
const { sendCustomerOrder, sendOrderToRestaurant } = require('../models/order_email_template');
const { sendCustomerReservation, sendResToRestaurant } = require('../models/reservation_email_template');

// Middle Ware stuffs
const authTokenMiddleware = require('../middleware/authTokenMiddleware');
const asyncHandler = require('express-async-handler');

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
router.get('/singleRestaurantInfo/:restID', asyncHandler(async(req, res) => {
	// Save the restaurantID first from the URL
	const restID = req.params.restID;

	// Construct getQuery
	var sqlGetQuery =  `SELECT * FROM restaurant `;
  sqlGetQuery += `WHERE restaurant_ID=${restID}`

	var tempJSON = await new Promise((resolve, reject) => {
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
        resolve(restaurantProfileData);
      }
    })
  })

  if (tempJSON.rest_banner_ID) {
    const pathName = process.env.ASSETS_SAVE_LOC + 'rest_banners/' + tempJSON.rest_banner_ID;

    // Check if path exist. If yes, great, otherwise send an err image instead
    // Of course, we use our favourite promises
    const imagebase64 = await new Promise((resolve, reject) => {
      fs.access(pathName, fs.F_OK, (err) => {
        if (err) {
          // Console log the error
          console.log(timestamp + "restaurant.js line 172 " + err);
          
          var bitmap = fs.readFileSync('./public/assets/default-shopfront.png', 'base64');
          var imageString = "data:image/png;base64, " + bitmap;

          resolve(imageString);
        }
        else {
          // console.log(pathName);
          const imagePath = path.resolve(pathName);

          var bitmap = fs.readFileSync(imagePath, 'base64');
          var imageString = "data:image/png;base64, " + bitmap;

          resolve(imageString);
        };
      });
    });

    tempJSON['rest_banner'] = imagebase64;
    res.status(200).send(tempJSON);	
  }
}));

/****************************************************************************
 * Retrieve restaurant's menu and all items information											*
 ****************************************************************************
 */
router.get('/allRestaurantInfo', asyncHandler(async(req, res, next) => {
	// Save the restaurantID first from the URL
	const { username } = res.locals.userData;

	// Construct getQuery
	var sqlGetQuery =  `SELECT * FROM restaurant `;
  // sqlGetQuery += `WHERE NOT rest_status IN ("closed", "first", "pending")`; // Remove this line if want to show all

	const allRestaurantInfo = await new Promise((resolve, reject) => {
    dbconn.query(sqlGetQuery, function (err, results, fields){
      if (err) {
        console.log(err);
        reject(err);
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
          var restaurantProfileData = {
            restaurant_ID: restaurant.restaurant_ID,
            restaurant_name: restaurant.restaurant_name,
            rest_rgm_username: restaurant.rest_rgm_username,
            rest_banner: restaurant.rest_banner_ID,
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

        resolve(restaurantsArray);      
      }
    }); // Closing db query
  }); // closing promise

  // Declare a temp array
  var restaurantArray = [];

  // Within this for loop, we convert the image to something that we can use
  for (let restaurant of allRestaurantInfo) {
    if (restaurant.rest_banner) {
			const pathName = process.env.ASSETS_SAVE_LOC + 'rest_banners/' + restaurant.rest_banner;

			// Check if path exist. If yes, great, otherwise send an err image instead
			// Of course, we use our favourite promises
			const imagebase64 = await new Promise((resolve, reject) => {
				fs.access(pathName, fs.F_OK, (err) => {
					if (err) {
						// Console log the error
						console.log(timestamp + "restaurant.js line 172 " + err);
						
						var bitmap = fs.readFileSync('./public/assets/default-shopfront.png', 'base64');
						var imageString = "data:image/png;base64, " + bitmap;

						resolve(imageString);
					}
					else {
						// console.log(pathName);
						const imagePath = path.resolve(pathName);

						var bitmap = fs.readFileSync(imagePath, 'base64');
						var imageString = "data:image/png;base64, " + bitmap;

						resolve(imageString);
					};
				});
			});

			restaurant['rest_banner'] = imagebase64;
			restaurantArray.push(restaurant);	
		}
  }

  res.status(200).send(restaurantArray);
}));

/****************************************************************************
 * Retrieve restaurant's menu and all items information											*
 ****************************************************************************/
router.get('/selectedRestaurantInfo/:tag', asyncHandler(async(req, res) => {
	// Save the restaurantID first from the URL
	const { username } = res.locals.userData;

  // Get the tag from the url
  const tag = req.params.tag;

	// Construct getQuery
	var sqlGetQuery =  `SELECT * FROM restaurant `;
  sqlGetQuery += `WHERE rest_tag_1="${tag}" OR rest_tag_2="${tag}" OR rest_tag_3="${tag}"`;

	const allRestaurantInfo = await new Promise((resolve, reject) => {
    dbconn.query(sqlGetQuery, function (err, results, fields){
      if (err) {
        console.log(err);
        reject(err);
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
          var restaurantProfileData = {
            restaurant_ID: restaurant.restaurant_ID,
            restaurant_name: restaurant.restaurant_name,
            rest_rgm_username: restaurant.rest_rgm_username,
            rest_banner: restaurant.rest_banner_ID,
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

        resolve(restaurantsArray);      
      }
    }); // Closing db query
  }); // closing promise

  // Declare a temp array
  var restaurantArray = [];

  // console.log(allRestaurantInfo);
  // Within this for loop, we convert the image to something that we can use
  for (let restaurant of allRestaurantInfo) {
    if (restaurant.rest_banner) {
			const pathName = process.env.ASSETS_SAVE_LOC + 'rest_banners/' + restaurant.rest_banner;

			// Check if path exist. If yes, great, otherwise send an err image instead
			// Of course, we use our favourite promises
			const imagebase64 = await new Promise((resolve, reject) => {
				fs.access(pathName, fs.F_OK, (err) => {
					if (err) {
						// Console log the error
						console.log(timestamp + "restaurant.js line 172 " + err);
						
						var bitmap = fs.readFileSync('./public/assets/default-shopfront.png', 'base64');
						var imageString = "data:image/png;base64, " + bitmap;

						resolve(imageString);
					}
					else {
						// console.log(pathName);
						const imagePath = path.resolve(pathName);

						var bitmap = fs.readFileSync(imagePath, 'base64');
						var imageString = "data:image/png;base64, " + bitmap;

						resolve(imageString);
					};
				});
			});

			restaurant['rest_banner'] = imagebase64;
			restaurantArray.push(restaurant);	
		}
  }

  res.status(200).send(restaurantArray);
}));

/****************************************************************************
 * Retrieve restaurant's menu and all items information											*
 ****************************************************************************/
router.get('/allRestaurantItems/:restID', asyncHandler(async(req, res, next) => {
	// Save the restaurantID first from the URL
	const { username } = res.locals.userData;
  const restID = req.params.restID;

  // Temp Variables
  var tempItemsArray = [];

	// Construct getQuery
	var sqlGetQuery =  `SELECT ri_item_ID, item_png_ID, item_name, item_desc, `;
  sqlGetQuery += `item_allergen_warning, item_price, ric_name `
  sqlGetQuery += `FROM rest_item JOIN rest_item_categories `;
  sqlGetQuery += `ON ri_cat_ID=ric_ID `;
  sqlGetQuery += `WHERE item_availability=1 AND ri_rest_ID=${restID} `;
  sqlGetQuery += `ORDER BY ric_name`;

  const itemsAvailableQuery = await new Promise((resolve, reject) => {
    dbconn.query(sqlGetQuery, function (err, results, fields){
      if (err) {
        console.log(err);
        reject(err);
      }
      else {
        // Since the result is an Array, we will need to transform accordingly
        // using the for each array element method
        resolve(results);
      }
    });
  });

  // Transform the array
  for (let item of itemsAvailableQuery) {
		var tempJSON = {
      itemID: item.ri_item_ID,
      itemImage: item.item_png_ID,
      itemName: item.item_name,
      itemDesc: item.item_desc,
      itemAllergen: item.item_allergen_warning,
      itemPrice: item.item_price,
      itemCategory: item.ric_name
		}

    if (item.item_png_ID) {
      const pathName = process.env.ASSETS_SAVE_LOC + 'rest_items_png/' + item.item_png_ID;

      // Check if path exist. If yes, great, otherwise send an err image instead
      // Of course, we use our favourite promises
      const imagebase64 = await new Promise((resolve, reject) => {
        fs.access(pathName, fs.F_OK, (err) => {
          if (err) {
            // Console log the error
            console.log(timestamp + "restaurant.js line 172 " + err);
            
            var bitmap = fs.readFileSync('./public/assets/default-item.png', 'base64');
            var imageString = "data:image/png;base64, " + bitmap;

            resolve(imageString);
          }
          else {
            // console.log(pathName);
            const imagePath = path.resolve(pathName);

            var bitmap = fs.readFileSync(imagePath, 'base64');
            var imageString = "data:image/png;base64, " + bitmap;

            resolve(imageString);
          };
        });
      });

      tempJSON['itemImage'] = imagebase64;
      tempItemsArray.push(tempJSON);	
    }
  }

  res.status(200).send(tempItemsArray);
}));

/****************************************************************************
 * Retrieve all the unique category names that has available items
 ****************************************************************************/
router.get('/availableCategories/:restID', asyncHandler(async(req, res, next) => {
	// Save the restaurantID first from the URL
	const { username } = res.locals.userData;
  const restID = req.params.restID;

	// Construct getQuery
	var sqlGetQuery =  `SELECT DISTINCT ric_name `
  sqlGetQuery += `FROM rest_item JOIN rest_item_categories `;
  sqlGetQuery += `ON ri_cat_ID=ric_ID `;
  sqlGetQuery += `WHERE item_availability=1 AND ri_rest_ID=${restID} `;
  sqlGetQuery += `ORDER BY ric_name`;

  const availableCategoriesQuery = await new Promise((resolve, reject) => {
    dbconn.query(sqlGetQuery, function (err, results, fields){
      if (err) {
        console.log(err);
        reject(err);
      }
      else {
        // Since the result is an Array, we will need to transform accordingly
        // using the for each array element method
        resolve(results);
      }
    });
  });

  // We only need the category names, so lets get that out of the results
  var tempCategoriesArray = [];

  for (let category of availableCategoriesQuery) {
    tempCategoriesArray.push(category.ric_name);
  }

  res.status(200).send(tempCategoriesArray);
}));

/****************************************************************************
 * Retrieve all of the customer's personal orders                           *
 ****************************************************************************/
router.get('/alldeliveryorders', asyncHandler(async(req, res, next) => {
	// Get customer's username
	const { username } = res.locals.userData;

  // 1. Get the customer's ID from the customer_users table
  var sqlGetIDQuery = `SELECT customer_ID FROM customer_user `;
  sqlGetIDQuery += `WHERE cust_username="${username}" `;

  const custInfo = await new Promise((resolve, reject) => {
    dbconn.query(sqlGetIDQuery, function(err, results, fields){
      if (err) {
        reject(err);
        console.log(err);
      }
      else {
        resolve(results[0]);
      }
    });
  });

  // 2. Once we get the custID, we can now get all the orders from the delivery orders table
  const custID = custInfo.customer_ID;

  var sqlGetOrders = `SELECT * FROM delivery_order `;
  sqlGetOrders += `WHERE o_cust_ID=${custID} `;
  sqlGetOrders += `ORDER BY o_datetime`;

  const custOrders = await new Promise((resolve, reject) => {
    dbconn.query(sqlGetOrders, function(err, results, fields) {
      if (err) {
        console.log(err);
        reject(err);
      }
      else {
        resolve(results);
      }
    })
  });

  // 3. With all the orders taken we now convert everything that's necessary and also
  // get all the order items from the order items table
  var tempOrdersArray = [];

  for (let order of custOrders) {
    // Set Customer Reservation ID
    const orderID = order.order_ID;

    const orderDate = new Date(order.o_datetime);
		const pattern = datetime_T.compile('ddd, DD MMM YYYY');
		const convertedDate = datetime_T.format(orderDate, pattern);
    
    var tempJSON = {
      orderID: order.order_ID,
      orderDate: convertedDate,
      restID: order.o_rest_ID,
      restaurantName: order.o_rest_name,
      address: order.delivery_address + " S(" + order.delivery_postal_code + ")",
      price: order.total_cost,
      status: order.order_status
    }

    const orderItems = await new Promise((resolve, reject) => {
      var sqlGetItems = "SELECT * FROM do_item ";
      sqlGetItems += `WHERE do_order_ID="${orderID}"`;

      dbconn.query(sqlGetItems, function(err, results, fields){
        if (err) {
          console.log(err);
          reject(err);
        }
        else {
          resolve(results);
        }
      });
    });

    // If there's more than 1 preorderitems then we have to make it into an array
    if (orderItems.length > 0) {
      var tempItemsArray = [];

      for(let selectedItem of orderItems) {
        var itemJSON = {
          itemID: selectedItem.do_item_ID,
          itemName: selectedItem.do_item_name,
          itemPrice: selectedItem.do_item_price,
          itemQty: selectedItem.do_item_qty,
          itemSO: selectedItem.special_order ?? "NIL",
          item_restItemID: selectedItem.do_rest_item_ID
        }
        tempItemsArray.push(itemJSON);
      } 
      tempJSON["orderItems"] = tempItemsArray;
    }
    else {
      tempJSON["orderItems"] = "None";
    }
    // Push
    tempOrdersArray.push(tempJSON);
  }
  res.status(200).send(tempOrdersArray);
}));

/****************************************************************************
 * Retrieve all of the customer's personal orders                           *
 ****************************************************************************/
router.put('/updateDOStatus', asyncHandler(async(req, res, next) => {
  // Get customer's username
	const { username } = res.locals.userData;
  
  // Get orderID
  const { orderID } = req.body;

  var sqlUpdateStatus = `UPDATE delivery_order SET order_status="Fulfilled" `
  sqlUpdateStatus += `WHERE order_ID="${orderID}" `;

  // Create as a promise
  const updateResponse = await new Promise((resolve, reject) => {
    dbconn.query(sqlUpdateStatus, function(err, results, fields){
      if(err) {
        console.log(err);
        reject(err);
      }
      else {
        resolve({ status: "success" });
      }
    });
  })

  if (updateResponse.status == "success"){
    res.status(200).send({ api_msg: "success" });
  }
  else {
    res.status(200).send({ api_msg: "fail" });
  }
}));


/****************************************************************************
 * Retrieve all of the customer's past reservations
 ****************************************************************************/
router.get('/pastreservation', asyncHandler(async(req, res, next) => {
	// Get customer's username
	const { username } = res.locals.userData;

  // 1. Get the customer's ID from the customer_users table
  var sqlGetIDQuery = `SELECT customer_ID FROM customer_user `;
  sqlGetIDQuery += `WHERE cust_username="${username}" `;

  const custInfo = await new Promise((resolve, reject) => {
    dbconn.query(sqlGetIDQuery, function(err, results, fields){
      if (err) {
        reject(err);
        console.log(err);
      }
      else {
        resolve(results[0]);
      }
    });
  });

  // 2. Once we get the custID, we can now get all the reservations from the reservation table
  const custID = custInfo.customer_ID;

  var sqlGetReservations = `SELECT * FROM cust_reservation `;
  sqlGetReservations += `WHERE cr_cust_ID=${custID} AND (DATE(cr_date) < DATE(NOW()) OR cr_status="Fulfilled")`;
  sqlGetReservations += `ORDER BY cr_date`;

  const custReservations = await new Promise((resolve, reject) => {
    dbconn.query(sqlGetReservations, function(err, results, fields) {
      if (err) {
        console.log(err);
        reject(err);
      }
      else {
        resolve(results);
      }
    })
  });

  // 3. With all the reservations, we can now do a for loop to loop through all the reservations,
  // to see if there is any pre-order items for this reservation. We'll also wanna take this chance to
  // construct this into a tempJSON and push it into a temp array to send back to the frontend
  var tempReservationArray = [];

  for (let reservation of custReservations) {
    // Set Customer Reservation ID
    const crID = reservation.cust_reservation_ID;

    const reservationDate = new Date(reservation.cr_date);
		const pattern = datetime_T.compile('ddd, DD MMM YYYY');
		const convertedDate = datetime_T.format(reservationDate, pattern);
    
    var tempJSON = {
      cr_resID: reservation.cr_rest_ID,
      cr_restName: reservation.cr_rest_name,
      crID: reservation.cust_reservation_ID,
      pax: reservation.cr_pax,
      date: convertedDate,
      timeslot: datetime_T.transform(reservation.cr_timeslot, 'HH:mm:ss', 'h:mm A'),
      status: reservation.cr_status
    }

    const preOrderItems = await new Promise((resolve, reject) => {
      var sqlGetPOItemsQuery = "SELECT * FROM pre_order_item ";
      sqlGetPOItemsQuery += `WHERE poi_crID="${crID}"`;

      dbconn.query(sqlGetPOItemsQuery, function(err, results, fields){
        if (err) {
          console.log(err);
          reject(err);
        }
        else {
          resolve(results);
        }
      });
    });

    // If there's more than 1 preorderitems then we have to make it into an array
    if (preOrderItems.length > 0) {
      var tempItemsArray = [];

      for(let selectedItem of preOrderItems) {
        var itemJSON = {
          itemID: selectedItem.poi_item_ID,
          itemName: selectedItem.poi_item_name,
          itemPrice: selectedItem.poi_item_price,
          itemQty: selectedItem.poi_item_qty,
          itemSO: selectedItem.poi_special_order,
          item_restItemID: selectedItem.poi_rest_item_ID
        }
        tempItemsArray.push(itemJSON);
      } 
      tempJSON["preOrderItems"] = tempItemsArray;
    }
    else {
      tempJSON["preOrderItems"] = "None";
    }
    // Push
    tempReservationArray.push(tempJSON);
  }
  res.status(200).send(tempReservationArray);
}));

/****************************************************************************
 * Retrieve all of the customer's upcoming reservations
 ****************************************************************************/
router.get('/ongoingreservations', asyncHandler(async(req, res, next) => {
	// Get customer's username
	const { username } = res.locals.userData;

  // 1. Get the customer's ID from the customer_users table
  var sqlGetIDQuery = `SELECT customer_ID FROM customer_user `;
  sqlGetIDQuery += `WHERE cust_username="${username}" `;

  const custInfo = await new Promise((resolve, reject) => {
    dbconn.query(sqlGetIDQuery, function(err, results, fields){
      if (err) {
        reject(err);
        console.log(err);
      }
      else {
        resolve(results[0]);
      }
    });
  });

  // 2. Once we get the custID, we can now get all the reservations from the reservation table
  const custID = custInfo.customer_ID;

  var sqlGetReservations = `SELECT * FROM cust_reservation `;
  sqlGetReservations += `WHERE cr_cust_ID=${custID} AND (DATE(cr_date) >= DATE(NOW()) AND NOT cr_status="Fulfilled") `;
  sqlGetReservations += `ORDER BY cr_date`;

  const custReservations = await new Promise((resolve, reject) => {
    dbconn.query(sqlGetReservations, function(err, results, fields) {
      if (err) {
        console.log(err);
        reject(err);
      }
      else {
        resolve(results);
      }
    })
  });

  // 3. With all the reservations, we can now do a for loop to loop through all the reservations,
  // to see if there is any pre-order items for this reservation. We'll also wanna take this chance to
  // construct this into a tempJSON and push it into a temp array to send back to the frontend
  var tempReservationArray = [];

  for (let reservation of custReservations) {
    // Set Customer Reservation ID
    const crID = reservation.cust_reservation_ID;

    const reservationDate = new Date(reservation.cr_date);
		const pattern = datetime_T.compile('ddd, DD MMM YYYY');
		const convertedDate = datetime_T.format(reservationDate, pattern);
    
    var tempJSON = {
      cr_resID: reservation.cr_rest_ID,
      cr_restName: reservation.cr_rest_name,
      crID: reservation.cust_reservation_ID,
      pax: reservation.cr_pax,
      date: convertedDate,
      timeslot: datetime_T.transform(reservation.cr_timeslot, 'HH:mm:ss', 'h:mm A'),
      status: reservation.cr_status
    }

    const preOrderItems = await new Promise((resolve, reject) => {
      var sqlGetPOItemsQuery = "SELECT * FROM pre_order_item ";
      sqlGetPOItemsQuery += `WHERE poi_crID="${crID}"`;

      dbconn.query(sqlGetPOItemsQuery, function(err, results, fields){
        if (err) {
          console.log(err);
          reject(err);
        }
        else {
          resolve(results);
        }
      });
    });

    // If there's more than 1 preorderitems then we have to make it into an array
    if (preOrderItems.length > 0) {
      var tempItemsArray = [];

      for(let selectedItem of preOrderItems) {
        var itemJSON = {
          itemID: selectedItem.poi_item_ID,
          itemName: selectedItem.poi_item_name,
          itemPrice: selectedItem.poi_item_price,
          itemQty: selectedItem.poi_item_qty,
          itemSO: selectedItem.poi_special_order,
          item_restItemID: selectedItem.poi_rest_item_ID
        }
        tempItemsArray.push(itemJSON);
      } 
      tempJSON["preOrderItems"] = tempItemsArray;
    }
    else {
      tempJSON["preOrderItems"] = "None";
    }
    // Push
    tempReservationArray.push(tempJSON);
  }
  res.status(200).send(tempReservationArray);
}));

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
 * Get Restaurant Reviews
 ****************************************************************************/
router.get('/restaurantreivew/:restID', (req, res) => {
	// Save the restaurantID first from the URL
	const { username } = res.locals.userData;
  const { restID } = req.params;
  
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
      var sqlInsertQuery = "SELECT rr_cust_name, review_rating, review_title, review_desc FROM rest_review "
      sqlInsertQuery += `WHERE rr_rest_ID=${restID}`

      dbconn.query(sqlInsertQuery, function(err, results, fields){
        if (err) {
          console.log(err)
          res.status(200).send({ api_msg: "fail" });
        }
        else {
          // Declare an array
          let reviewArray = [];

          // Construct the review into JSON
          for (let review of results) {
            const tempJSON = {
              custName: review.rr_cust_name,
              title: review.review_title,
              rating: review.review_rating,
              desc: review.review_desc
            };

            reviewArray.push(tempJSON);
          }
          res.status(200).send(reviewArray);
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

      const restMailOptions = await sendOrderToRestaurant(restEmail, restName, custName,
        deliveryAddress, deliveryPostal, datetime, doID, orderItems, total);
      
      // Send the email to the customer
      const custResponse = await sendMail(custMailOptions);
      
      // Check if the customer event that was triggered - Console Logger
      console.log(timestamp + `Sending email to customer for ${doID}`);
      if (custResponse.code) {
        console.log(timestamp + "Gmail error status - " + custResponse.response.status);
        console.log(timestamp + "Gmail error statusText - " + custResponse.response.statusText);
        console.log(timestamp + "Gmail error data - " + custResponse.response.data.error + " - " + custResponse.response.data.error_description);
      }
      else {
        console.log(timestamp + "Sent to - " + custResponse.accepted);
        console.log(timestamp + "Response - " + custResponse.response);
      }

      // Send the email to the restaurant administrator
      const restResponse = await sendMail(restMailOptions);
      
      // Check if the customer event that was triggered - Console Logger
      console.log(timestamp + `Sending email to restaurant ${restName} for ${doID}`);
      if (restResponse.code) {
        console.log(timestamp + "Gmail error status - " + restResponse.response.status);
        console.log(timestamp + "Gmail error statusText - " + restResponse.response.statusText);
        console.log(timestamp + "Gmail error data - " + restResponse.response.data.error + " - " + restResponse.response.data.error_description);
      }
      else {
        console.log(timestamp + "Sent to - " + restResponse.accepted);
        console.log(timestamp + "Response - " + restResponse.response);
      }

      // API response
      if (custResponse.response.includes("OK") && restResponse.response.includes("OK")) {
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
          console.log(results);
          const custID = results[0].customer_ID
          const fullName = results[0].first_name + " " + results[0].last_name;
          const custEmail = results[0].email;

          // 1. We create the query for insert into order table, and query
          var sqlInsertQuery = "INSERT INTO delivery_order(`order_ID`, `o_cust_ID`, `o_rest_ID`, ";
          sqlInsertQuery += "`o_cust_name`, `o_rest_name`, `o_datetime`, `delivery_address`, ";
          sqlInsertQuery += "`delivery_floorunit`, `delivery_postal_code`, `delivery_note`, ";
          sqlInsertQuery += "`total_cost`, `order_delivery_time`, `order_status`, `payment_status`) ";
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
                            // console.log(response)
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
                        // console.log(response);
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

  console.log(timestamp + "Attempting to verify address...")
  console.log(timestamp + "Verification Status - " + response.data.status);

  res.status(200).json(response.data);
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

/****************************************************************************
 * Making a reservation 
 ****************************************************************************/
// Async function to send email to both customer and restaurant
async function sendingReservationEmail(iCalString, crID, restEmail, custEmail, custName, restName, restAddressPostal,
  reservationDateTime, pax, preOrderStatus, preOrderItems, preOrderTotal) {
    try {
      // Construct the email for customer
      const custMailOptions = await sendCustomerReservation(iCalString, crID, custEmail, restName, custName,
        restAddressPostal, reservationDateTime, pax, preOrderStatus, preOrderItems, preOrderTotal);

      const restMailOptions = await sendResToRestaurant(crID, restEmail, custName, reservationDateTime, pax, 
        preOrderStatus, preOrderItems, preOrderTotal);
      
      // Send the email to the customer
      const custResponse = await sendMail(custMailOptions);
      
      // Check if the customer event that was triggered - Console Logger
      console.log(timestamp + `Sending email to customer for ${crID}`);
      if (custResponse.code) {
        console.log(timestamp + "Gmail error status - " + custResponse.response.status);
        console.log(timestamp + "Gmail error statusText - " + custResponse.response.statusText);
        console.log(timestamp + "Gmail error data - " + custResponse.response.data.error + " - " + custResponse.response.data.error_description);
      }
      else {
        console.log(timestamp + "Sent to - " + custResponse.accepted);
        console.log(timestamp + "Response - " + custResponse.response);
      }

      // Send the email to the restaurant administrator
      const restResponse = await sendMail(restMailOptions);
      
      // Check if the customer event that was triggered - Console Logger
      console.log(timestamp + `Sending email to restaurant ${restName} for ${crID}`);
      if (restResponse.code) {
        console.log(timestamp + "Gmail error status - " + restResponse.response.status);
        console.log(timestamp + "Gmail error statusText - " + restResponse.response.statusText);
        console.log(timestamp + "Gmail error data - " + restResponse.response.data.error + " - " + restResponse.response.data.error_description);
      }
      else {
        console.log(timestamp + "Sent to - " + restResponse.accepted);
        console.log(timestamp + "Response - " + restResponse.response);
      }

      // API response
      if (custResponse.response.includes("OK") && restResponse.response.includes("OK")) {
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

router.route('/customerReservation')
  .post(asyncHandler(async (req, res) => {
    // Getting some important variables
    const { username } = res.locals.userData;
    const { 
      reservationID, restID, restName, restEmail, restAddressPostal, pax, reservationDate, reservationTime,
      preOrderStatus, preOrderItems, preOrderTotal
    } = req.body;

    // console.log(req.body);
    // We will need to construct a query to insert stuff into the db. Since we are on a pool now, we best use
    // this same connection for this whole creation and then release that connect once the thing has been created
    // so that we can control the whole route to wait for the result from the MySQL db
    // 1. Get some useful information from the customer table
    var sqlGetCustQuery = "SELECT `customer_ID`, `cust_picture_ID`, `first_name`, `last_name`, `email` "
    sqlGetCustQuery += `FROM customer_user WHERE cust_username="${username}"`;

    // 2. Creating the reservation after finding some customer details
    const queryResponse = await new Promise((resolve, reject) => {
      dbconn.getConnection(function(err, conn){
        if (err) {
          console.log(err);
        }
        else {
          conn.query(sqlGetCustQuery, function(err, results, fields){
            if (err) {
              console.log(err);
              reject(err);
            }
            else {
              // 3. Construct the full name from the query results and also get customer's email
              const custID = results[0].customer_ID;
              const custFullName = results[0].first_name + " " + results[0].last_name;
              const custEmail = results[0].email;

              // Also convert some stuff into proper sql formats
              const sqlReservationDate = datetime_T.format(new Date(reservationDate), 'YYYY-MM-DD');
              const sqlReservationTime = datetime_T.transform(reservationTime, 'HH:mm', 'HH:mm:ss');
              const sqlReservationMadeStamp = datetime_T.format(new Date(), 'YYYY-MM-DD HH:mm:ss');

              // 4. Now we construct the reservation query
              // Construct the query to insert into the reservations table
              var sqlCreateReservation = "INSERT INTO cust_reservation(`cust_reservation_ID`, `cr_cust_ID`, ";
              sqlCreateReservation +="`cr_rest_ID`, `cr_custname`, `cr_rest_name`, `cr_pax`, `cr_date`, `cr_timeslot`, `cr_status`, `cr_datetime_made`) "
              sqlCreateReservation += `VALUES ("${reservationID}", ${custID}, ${restID}, "${custFullName}", "${restName}", `
              sqlCreateReservation += `${pax}, "${sqlReservationDate}", "${sqlReservationTime}", "Pending", "${sqlReservationMadeStamp}")`;

              // 5. Now we query the table and resolve the promise
              conn.query(sqlCreateReservation, function(err, results, fields){
                if (err){
                  console.log(err);
                  reject(err);
                }
                else {
                  conn.release();
                  resolve({custID, custFullName, custEmail, insertStatus: "OK"});
                }
              }); // Releasing connection here and also resolving the promise, nested query closes here
            }
          }); // Closing first query here
        }
      }); // Get connection closes here
    }); // Promise closes here

    // console.log(queryResponse);

    // 3. We now create the pre-order into the system
    const preOrderResponse = await new Promise((resolve, reject) => {
      // If there's no preorder
      if (preOrderStatus == 'false') {
        // No need to put anything in, just send an OK 
        resolve({ insertStatus: 'OK' });  
      };

      dbconn.getConnection(function(err, conn){
        if (err) {
          console.log(err);
          reject(err);
        };
        
        if (preOrderStatus == 'true') {
          // Construct reservation insert query
          var sqlInsertQuery = "INSERT INTO `pre_order`(`po_crID`, `po_status`, `total_cost`) ";
          sqlInsertQuery += `VALUES ("${reservationID}","Pending",${parseFloat(preOrderTotal).toFixed(2)})`;

          conn.query(sqlInsertQuery, function (err, results, fields){
            if (err){
              console.log(err);
            }
            else {
              // If the pre order is successfully created, then we can insert all the pre order Items into the database.
              // We first check if the preOrderItems have multiple items, or if the user is just ordering 1 item
              // If multiple items, proceed
              if (Array.isArray(preOrderItems) == true) {
                for (let x in preOrderItems) {
                  const item = JSON.parse(preOrderItems[x]);

                  var sqlInsertItemsQuery = "INSERT INTO `pre_order_item`(`poi_crID`, `poi_rest_item_ID`, ";
                  sqlInsertItemsQuery += "`poi_item_name`, `poi_item_price`, `poi_item_qty`, `poi_special_order`) ";
                  sqlInsertItemsQuery += `VALUES ("${reservationID}", ${item.itemID}, "${item.itemName}", ${item.itemPrice}, ${item.itemQty}, "NIL")`;

                  conn.query(sqlInsertItemsQuery, function(err, results, fields) {
                    if (err) {
                      console.log(err);
                    }
                    else {
                      if (Number(x) == (preOrderItems.length - 1)){
                        conn.release();
                        resolve({ insertStatus: 'OK' });
                      } 
                    };
                  });
                };
              }
              else {
                // Else we treat it as a single item
                const item = JSON.parse(preOrderItems);

                var sqlInsertItemsQuery = "INSERT INTO `pre_order_item`(`poi_crID`, `poi_rest_item_ID`, ";
                sqlInsertItemsQuery += "`poi_item_name`, `poi_item_price`, `poi_item_qty`, `poi_special_order`) ";
                sqlInsertItemsQuery += `VALUES ("${reservationID}", ${item.itemID}, "${item.itemName}", ${item.itemPrice}, ${item.itemQty}, "NIL")`;

                conn.query(sqlInsertItemsQuery, function(err, results, fields) {
                  if (err) {
                    console.log(err);
                  }
                  else {
                    conn.release();
                    resolve({ insertStatus: 'OK' });                    
                  };
                });// Closing nested query
              }
            };
          }); // Closing 2nd query to same connection
        };
      });
    });

    if (queryResponse.insertStatus == "OK" && preOrderResponse.insertStatus == "OK") {
      // The following portion creates and send an email to the customer reminding the customer
      // that he / she has made a reservation and will also attach a calendar invite
      // 1. Convert the received reservation Date
      const convertedDate =  datetime_T.format(new Date(reservationDate), 'DD-MM-YYYY');
      // console.log(convertedDate);

      // 2. Make the date into a datetime string with the proper GMT+8 Timezone indicated
      const datetimeString = convertedDate + " " + reservationTime + " GMT+0800";
      // console.log(datetimeString);

      // 3. Construct a datetime object so that we can make the iCal object with it
      const reservationDateTime = datetime_T.parse(datetimeString, 'DD-MM-YYYY HH:mm [GMT]Z');
      // console.log(reservationDateTime);

      // 4. Create the address of the restaurant
      // const restAddressPostal = restAdd + ", Singapore " + restPostal

      // 5. Creating the calendar object
      // First we have to create the Calendar object like this
      const cal = new iCal.ICalCalendar({ domain: "google.com", name: "Your reservation Calendar Event" });

      // Then we create the said event into the calendar object. We assume that the customer will have a 1hour meal
      cal.createEvent({
        start: reservationDateTime,
        end: new Date(reservationDateTime.getTime() + 3600000),
        summary: `Table reservation on ${convertedDate} @ ${restName}`,
        description: `You have a table reservation at ${restName} for ${pax} persons 
        on ${datetime_T.format(reservationDateTime, 'dddd, D MMM YYYY, h:mm A')}!`,
        location: restAddressPostal,
        url: 'https://cancanfoodapp.xyz'
      });

      // We then convert this calendar object to string
      const calString = cal.toString();

      // Now we prep to send the emails with all the information that we got.
      const emailAttempt = await sendingReservationEmail(calString, reservationID, restEmail, queryResponse.custEmail, 
        queryResponse.custFullName, restName, restAddressPostal, reservationDateTime, pax, preOrderStatus, preOrderItems, preOrderTotal);

      if (emailAttempt == "success") {
        res.status(200).send({api_msg: "Your order has been made successfully. Please check your email for confirmation!"});
      }
      else {
        res.status(200).send({api_msg: "Something went wrong, please contact an administrator."});
      }
    }
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

/*******************************************************************************************
 * NO ROUTES FUNCTIONS OR DECLARATIONS BELOW THIS DIVIDER 
 *******************************************************************************************
 * You only export and do nothing else here
 */
module.exports = router;