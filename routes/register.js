// username, email, phone, rest name
const express = require("express");
const authTokenMiddleware = require("../middleware/authTokenMiddleware");
const router = express.Router();
const dbconn = require("../models/db_model");
const pw_gen = require('generate-password');

// Body / form parser
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

// Universal Middleware
// All middleware for this route comes here

/****************************************************************************
 * Restaurant Register for an account 																			*
 ****************************************************************************
 */
router.post("/restaurant", (req, res) => {
  // Assuming that we pass the form data into the route
  // 1. We will need to decode the form and draw out the data
  console.log(req.body);
  const {
    username, restaurant_name, email, phone
  } = req.body;

  // Generate a default password
  const default_pw = pw_gen.generate({
    length: 15,
    numbers: true,
    symbols: true
  })

  var sqlQuery = "INSERT INTO app_user(`username`, `user_password`, `user_type`, `account_status`) ";
  sqlQuery += `VALUES ('${username}', '${default_pw}', 'Restaurant General Manager', 'pending')`;

  // First query creates the app_user entry
  dbconn.query(sqlQuery, function(error, results, fields){
    if (error) {
      console.log("MySQL " + error);
      res.status(200).json({ api_msg: "username exist" });
    }
    else {
      // Console log to see MySQL
      console.log(results);

      // Once the app user is created, we can now create the restaurant
      var sqlRestaurantQuery = "INSERT INTO restaurant(`restaurant_name`, `rest_rgm_username`, ";
      sqlRestaurantQuery += "`rest_phone_no`, `rest_email`, `rest_status`) ";
      sqlRestaurantQuery += `VALUES ('${restaurant_name}', '${username}', '${phone}', '${email}', 'pending');`;

      dbconn.query(sqlRestaurantQuery, function(error, results, fields){
        if (error) {
          console.log("MySQL " + error);
        }
        else {
          console.log(results);

          // If the restaurant is successful, then we can create a profile for the RGM as well
          var sqlCreateRGM = "INSERT INTO restaurant_gm(`rgm_username`) ";
          sqlCreateRGM += `VALUES ('${username}')`;

          dbconn.query(sqlCreateRGM, function(error, results, fields){
            if (error) {
              // We'll just send an error back through a OK request so that the api doesn't crash
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

/* === All routes for /users/:username ===
	Currently has get, put, delete
	*/
router
  .route('/:username')
	.get((req, res) => {
		res.send(`Get User with username ${req.params.username}`);
	})
	.put((req, res) => {
		res.send(`Get User with username ${req.params.username}`);
	})
	.delete((req, res) => {
		res.send(`Get User with username ${req.params.username}`);
	});

/*  */
router.param("username", (req, res, next, username) => {
	console.log(username);
	next();
});

module.exports = router;