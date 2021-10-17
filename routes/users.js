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
		// console.log(res.locals.userData)
		const {
			username, userType
		} = res.locals.userData;

		// Construct a Switch to handle the sql query based on the userType
		switch (userType) {
			// RGM User Type ==========================================================
			case "Restaurant General Manager":
				var sqlQuery = "SELECT username, user_type, first_name, last_name, phone_no, ";
				sqlQuery += "home_address, home_postal_code ";
				sqlQuery += "FROM app_user JOIN restaurant_gm ";
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
			// =========================================================================
			// Restaurant Deliveries Manager User Type =================================
			case "Restaurant Deliveries Manager":
				res.status(200).json({ username: username, userType: userType });

				break;
			// =========================================================================		
			// Restaurant Reservation Manager User Type ================================
			case "Restaurant Reservation Manager":
				res.status(200).json({ username: username, userType: userType });

				break;
			// =========================================================================
			// System Administrator User Type ==========================================
			case "System Administrator":
				res.status(200).json({ username: username, userType: userType });

				break;
			// =========================================================================
			// Customer User Type ======================================================
			case "Customer":
				res.status(200).json({ username: username, userType: userType });

				break;
			// =========================================================================	
			default:
				break;
		}
	})
	.put((req, res) => {
		res.send();
	});

/****************************************************************************
 * User Password Management																									*
 ****************************************************************************
 * This route should be used to manage the password
*/
router
  .route('/userpassword')
	.get((req, res) => {
		// 1. So long as the access token is verified, allow password retrieval		
	})
	.post((req, res) => {
		// PURPOSE: This special post request is to put accross the old password
		// in a FormData so that it can be verified by the MySQL and then server
		// will respond with a success message.

		// Console test
		// console.log("POST request");

		// 1. Retrieve the password from the form
		const { oldPassword } =  req.body;

		// 2. Establish a SqlQuery, remembering to get the username from userData
		const { username } = res.locals.userData;

		var sqlQuery = `SELECT * FROM app_user `;
		sqlQuery += `WHERE username='${username}' AND BINARY user_password='${oldPassword}'`
		
		// 3. Do the query and return the success message
		dbconn.query(sqlQuery, function(error, results, fields) {
			if (error) {
				res.status(400).json({ api_msg: "MySQL error occurred: " + error });
			}
			else {
				if (results.length) {
					res.status(200).json({ api_msg: "password match" });
				}
				else {
					res.status(200).send({ api_msg: "password mismatch" });
				}
			}
		});
	})
	.put((req, res) => {
		// Console Test
		// console.log("PUT Request");

		// As always, get the username and also the user_type
		const { username, userType } = res.locals.userData;

		// 1. This route should receive the old password first, so that the 
		// password can be verified
		// Set the password variables
		const { oldPassword, newPassword } = req.body;

		// 2. If the old password matches, then proceed to update the password.
		// Therefore the query should be constructed to match first the oldpassword
		// and username, then if match, the update should be allowed
		var sqlQuery = `UPDATE app_user SET user_password='${newPassword}' `;
		sqlQuery += `WHERE username='${username}' AND user_password='${oldPassword}'`;

		// 3. res should send status 200 and a successMsg
		dbconn.query(sqlQuery, function(error, results, fields) {
			if (error) {
				res.status(400).json({ api_msg: "MySQL Query error: " + error });
			}
			else {
				// console.log(results);
				if (results['changedRows'] == 1){
					res.status(200).json({ 
						api_msg: "Password has been updated!", 
						userType: userType
					 });
				}
				else {
					res.status(200).json({ api_msg: "Old password mismatch or Username Error!" });
				}
			}
		});
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