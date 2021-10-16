const express = require("express");
const authTokenMiddleware = require("../middleware/authTokenMiddleware");
const router = express.Router();
const dbconn = require("../models/db_model");

// Body parser
router.use(express.json());

// Universal Middleware
router.use(authTokenMiddleware);

/* */
router.get("/list", (req, res) => {
	console.log(req);
	dbconn.query('SELECT * FROM app_user', function (error, results, fields) {
    if (error) {
      res.send("MySQL error: " + error);
    }
    else {
      res.send(results);
    }
  });
});

/****************************************************************************
 * User profile Management																									*
 ****************************************************************************
 * userType: Restaurant General Manager, Restaurant Deliveries Manager,			*
 * Restaurant Reservation Manager
*/
router
  .route('/profilemanagement')
	.get((req, res) => {
		// Get the userData from the access token
		const {
			username, userType
		} = res.locals.userData;

		// Construct a Switch to handle the sql query based on the userType
		switch (userType) {
			case "Restaurant General Manager":
				// Then, we construct the sql query with the username in mind.
				var sqlQuery = "SELECT username, first_name, last_name, phone_no, home_address, home_postal_code "
				sqlQuery += "FROM app_user JOIN restaurant_gm "
				sqlQuery += `ON username=rgm_username WHERE rgm_username='${username}'`;

				// Query the db and return the said fields to the frontend app
				dbconn.query(sqlQuery, function (error, results, fields) {
					if (error) {
						res.status(400).send({ errorMsg: "MySQL error: " + error });
					}
					else {
						res.status(200).send(results[0]);
					}
				})
				break;
		
			default:
				break;
		}
	})
	.put((req, res) => {
		res.send();
	});

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