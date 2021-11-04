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
// const { sendSubUserEmail } = require('../models/credentials_email_template');

// Middle Ware stuffs
const authTokenMiddleware = require('../middleware/authTokenMiddleware');

/**************************************************************************
 * Router Middlewares and parsers																					*
 **************************************************************************/
router.use(express.json());
router.use(authTokenMiddleware);

/****************************************************************************
 * For users to get their account status																		*
 ****************************************************************************
 */
router.get('/accountstatus', (req, res) => {
  // console.log(path.resolve(`../0-test-pictures/${req.params.imageName}`));
  // console.log(req.params.imageName);
  // console.log(pathName);
	const { username } = res.locals.userData;

	var sqlGetQuery = `SELECT account_status FROM app_user WHERE username="${username}"`;

	dbconn.query(sqlGetQuery, function(err, results, fields){
		if (err) {
			console.log(err);
		}
		else {
			res.status(200).send(results[0]);
		}
	})
});

/****************************************************************************
 * For users to get their account status																		*
 ****************************************************************************
 */
router.get('/usertype', (req, res) => {
  // console.log(path.resolve(`../0-test-pictures/${req.params.imageName}`));
  // console.log(req.params.imageName);
  // console.log(pathName);
	const { username } = res.locals.userData;

	var sqlGetQuery = `SELECT user_type FROM app_user WHERE username="${username}"`;

	dbconn.query(sqlGetQuery, function(err, results, fields){
		if (err) {
			console.log(err);
		}
		else {
			res.status(200).send(results[0]);
		}
	})
});

/****************************************************************************
 * DM / RM retrieve restaurant name																					*
 ****************************************************************************
 */
router.get('/restaurantname', (req, res) => {
  // console.log(path.resolve(`../0-test-pictures/${req.params.imageName}`));
  // console.log(req.params.imageName);
  // console.log(pathName);
	const { username } = res.locals.userData;

	var sqlGetQuery = `SELECT restaurant_name FROM restaurant JOIN restaurant_subuser `
	sqlGetQuery += `ON restaurant_ID=subuser_rest_ID WHERE subuser_username="${username}"`;

	dbconn.query(sqlGetQuery, function(err, results, fields){
		if (err) {
			console.log(err);
		}
		else {
			res.status(200).send(results[0]);
		}
	})
});

/****************************************************************************
 * Retrieves profile image																									*
 ****************************************************************************
 */
router.get('/profileImage/:imageName', (req, res) => {
  // console.log(path.resolve(`../0-test-pictures/${req.params.imageName}`));
  // console.log(req.params.imageName);
  // console.log(pathName);
	if (req.params.imageName != '') {
		const pathName = process.env.ASSETS_SAVE_LOC + 'profile_pictures/' + req.params.imageName;

		// Check if path exist. If yes, great, otherwise send an err image instead
		fs.access(pathName, fs.F_OK, (err) => {
			if (err) {
				// console.log(err);
				res.status(200).sendFile(path.resolve('./public/assets/error_img.png'));
			}
			else {
				res.status(200).sendFile(path.resolve(pathName));
			}
		})
	}
});

/****************************************************************************
 * User profile Management																									*
 ****************************************************************************
 * userType: Restaurant General Manager, Restaurant Deliveries Manager,			*
 * Restaurant Reservations Manager
*/
// Multer config for all user profile management
const profileStorage = multer.diskStorage({
	destination: (req, file, cb) => {
		// Step 1: Find the exact location on the server to save the file
		const pathName = process.env.ASSETS_SAVE_LOC + 'profile_pictures/';

		cb(null, path.resolve(pathName));
	},
	filename: (req, file, cb) => {
		// Step 2: Config Multer to the exact location for upload and get a uuidv4 random
		// uuid for the file name
		// console.log('Multer Config');
		console.log(file);
		if (file) {
			const profilePictureName = Date.now() + '-' + uuidv4();
			cb(null, profilePictureName + path.extname(file.originalname)); 
		}
	}
})
const profileUpload = multer({storage: profileStorage}); //{ dest: '../assets'}

router
  .route('/profilemanagement')
	.get((req, res) => {
		// Get the userData from the access token
		// console.log(res.locals.userData)
		const {
			username, userType
		} = res.locals.userData;

		if (username == null) {
			res.status(200).send({ api_msg: "No username found, did something go wrong?" });
			console.log("no user found");
			return;
		}

		// console.log(username, userType);

		// Construct a Switch to handle the sql query based on the userType
		switch (userType) {
			// RGM User Type ==========================================================
			case "Restaurant General Manager":
				var sqlGetQuery = "SELECT * FROM restaurant_gm ";
				sqlGetQuery += `WHERE rgm_username="${username}"`;

				// Query the db and return the said fields to the frontend app
				dbconn.query(sqlGetQuery, function (err, results, fields) {
					if (err) {
						console.log(err);
						res.status(400).send("MySQL error. If you're the client, contact your developer");
					}
					else {
						const dataJson = {
							profile_image: results[0].picture_ID ?? "err.png",
							username: results[0].rgm_username,
							userType: userType,
							first_name: results[0].first_name ?? "NIL",
							last_name: results[0].last_name ?? "NIL",
							phone_no: results[0].phone_no ?? "NIL",
							email: results[0].email ?? "NIL",
							address: results[0].home_address ?? "NIL",
							postal_code: results[0].home_postal_code ?? "NIL"
						}

						res.status(200).send(dataJson);
					}
				})
				break;
			// =========================================================================
			// Restaurant Deliveries Manager User Type =================================
			// Restaurant Reservations Manager User Type ================================
			case "Restaurant Deliveries Manager":
			case "Restaurant Reservations Manager":
				var sqlGetQuery = "SELECT * FROM restaurant_subuser ";
				sqlGetQuery += `WHERE subuser_username="${username}"`;

				// Query the db and return the said fields to the frontend app
				dbconn.query(sqlGetQuery, function (err, results, fields) {
					if (err) {
						console.log(err);
						res.status(400).send("MySQL error. If you're the client, contact your developer");
					}
					else {
						// console.log(results);
						const dataJson = {
							profile_image: results[0].subuser_picture_ID ?? "error.png",
							username: results[0].subuser_username,
							userType: userType,
							first_name: results[0].first_name,
							last_name: results[0].last_name,
							phone_no: results[0].phone_no,
							email: results[0].email,
							address: results[0].home_address ?? "NIL",
							postal_code: results[0].home_postal_code ?? "NIL"
						}

						res.status(200).send(dataJson);
					}
				});

				break;
			// =========================================================================
			// System Administrator User Type ==========================================
			case "System Administrator":
				var sqlGetQuery = "SELECT username, user_type, first_name, last_name, phone_no, ";
				sqlGetQuery += "email, home_address, home_postal_code ";
				sqlGetQuery += "FROM app_user JOIN admin_user ";
				sqlGetQuery += `ON username="${username}" WHERE username=admin_username`;

				// Query the db and return the said fields to the frontend app
				dbconn.query(sqlGetQuery, function (err, results, fields) {
					if (err) {
						console.log(err);
						res.status(400).send("MySQL error. If you're the client, contact your developer");
					}
					else {
						const dataJson = {
							profile_image: results[0].picture_ID ?? "error.png",
							username: results[0].username,
							userType: userType,
							first_name: results[0].first_name ?? "NIL",
							last_name: results[0].last_name ?? "NIL",
							phone_no: results[0].phone_no ?? "NIL",
							email: results[0].email,
							address: results[0].home_address ?? "NIL",
							postal_code: results[0].home_postal_code ?? "NIL"
						}

						res.status(200).send(dataJson);
					}
				});

				break;
			// =========================================================================
			// Customer User Type ======================================================
			case "Customer":
				var sqlGetQuery = "SELECT * FROM customer_user JOIN cust_address ";
				sqlGetQuery += `ON cust_username=ca_username WHERE cust_username="${username}"`;

				// Query the db and return the said fields to the frontend app
				dbconn.query(sqlGetQuery, function (err, results, fields) {
					if (err) {
						console.log(err);
						res.status(400).send("MySQL error. If you're the client, contact your developer");
					}
					else {
						const dataJson = {
							profile_image: results[0].cust_picture_ID ?? "error.png",
							username: results[0].cust_username,
							userType: userType,
							first_name: results[0].first_name ?? "NIL",
							last_name: results[0].last_name ?? "NIL",
							phone_no: results[0].phone_no ?? "NIL",
							email: results[0].email,
							address: results[0].address_info ?? "NIL",
							postal_code: results[0].postal_code ?? "NIL"
						}

						res.status(200).send(dataJson);
					}
				});

				break;
			// =========================================================================	
			default:
				break;
		}
	})
	.put(profileUpload.single("profileImage"), (req, res) => {
		// Get the userData from the access token
		// console.log(res.locals.userData)
		const {
			username, userType
		} = res.locals.userData;

		// We also get other important stuff from the req
		const {
			file, body: {
				fname,
				lname,
				phoneNo,
				email,
				address,
				postalCode
			}
		}	= req;

		// Construct a Switch to handle the sql query based on the userType
		switch (userType) {
			// RGM User Type ==========================================================
			case "Restaurant General Manager":
				// Steps to edit profile for all users, generally the same less the customer
				if (file) {
					var sqlUpdateQuery = `UPDATE restaurant_gm SET picture_ID="${file.filename}",`
					sqlUpdateQuery += `first_name="${fname}",last_name="${lname}",phone_no=${phoneNo},`
					sqlUpdateQuery += `email="${email}",home_address="${address}",home_postal_code=${postalCode} `;
					sqlUpdateQuery += `WHERE rgm_username="${username}"`;

					dbconn.query(sqlUpdateQuery, function(err, results, fields){
						if (err) {
							console.log(err);
							res.status(400).send("MySQL error. If you're the client, contact your developer");
						}
						else {
							res.status(200).json({ api_msg: "Successful!" });
						}
					});
				}
				else {
					var sqlUpdateQuery = `UPDATE restaurant_gm SET `
					sqlUpdateQuery += `first_name="${fname}",last_name="${lname}",phone_no=${phoneNo},`
					sqlUpdateQuery += `email="${email}",home_address="${address}",home_postal_code=${postalCode} `;
					sqlUpdateQuery += `WHERE rgm_username="${username}"`;

					dbconn.query(sqlUpdateQuery, function(err, results, fields){
						if (err) {
							console.log(err);
							res.status(400).json({ api_msg: "Successful!" });
						}
						else {
							res.status(200).json({ api_msg: "Successful!" });
						}
					});
				}


				break;
			// =========================================================================
			// Restaurant Deliveries Manager User Type =================================
			// Restaurant Reservations Manager User Type ================================
			case "Restaurant Deliveries Manager":
			case "Restaurant Reservations Manager":
				// Steps to edit profile for all users, generally the same less the customer
				if (file) {
					var sqlUpdateQuery = `UPDATE restaurant_subuser SET subuser_picture_ID="${file.filename}",`
					sqlUpdateQuery += `first_name="${fname}",last_name="${lname}",phone_no=${phoneNo},`
					sqlUpdateQuery += `email="${email}",home_address="${address}",home_postal_code=${postalCode} `;
					sqlUpdateQuery += `WHERE subuser_username="${username}"`;

					dbconn.query(sqlUpdateQuery, function(err, results, fields){
						if (err) {
							console.log(err);
							res.status(400).json({ api_msg: "MySQL error" });
						}
						else {
							res.status(200).json({ api_msg: "Successful!" });
						}
					});
				}
				else {
					var sqlUpdateQuery = `UPDATE restaurant_subuser SET `
					sqlUpdateQuery += `first_name="${fname}",last_name="${lname}",phone_no=${phoneNo},`
					sqlUpdateQuery += `email="${email}",home_address="${address}",home_postal_code=${postalCode} `;
					sqlUpdateQuery += `WHERE subuser_username="${username}"`;

					dbconn.query(sqlUpdateQuery, function(err, results, fields){
						if (err) {
							console.log(err);
							res.status(400).json({ api_msg: "MySQL error" });
						}
						else {
							res.status(200).json({ api_msg: "Successful!" });
						}
					});
				}

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
	.post(profileUpload.single("profileImage"), (req, res) => {
		// We use POST route here for first login
		// 1. Get the username and usertype from the accesstoken
		const { username, userType } = res.locals.userData;
		
		// 2. since we can get the usertype from the token, we can move straight from there.
		// Firstly we'll get some other necessary data from the form
		const {
			file, body: {
				fname,
				lname,
				phoneNo,
				email,
				address,
				postalCode
			}
		}	= req;

		// 3. Thereafter, we just update everything into the table and we should be
		// done. Getting all the fields updated is the part.
		switch (userType) {
			// RGM User Type ==========================================================
			case "Restaurant General Manager":
				// User update stuff
				if (file) {
					var sqlUpdateQuery = `UPDATE restaurant_gm SET rgm_username="${username}",`
					sqlUpdateQuery += `picture_ID="${file.filename}",first_name="${fname}",last_name="${lname}",`
					sqlUpdateQuery += `phone_no=${phoneNo},email="${email}",home_address="${address}",home_postal_code=${postalCode} `;
					sqlUpdateQuery += `WHERE rgm_username="${username}"`;

					dbconn.query(sqlUpdateQuery, function(err, results, fields){
						if (err) {
							console.log(err);
							res.status(400).json({ api_msg: "MySQL error" });
						}
						else {
							res.status(200).json({ api_msg: "Successful!" });
						}
					});
				}
				else {
					var sqlUpdateQuery = `UPDATE restaurant_gm SET rgm_username="${username}",`
					sqlUpdateQuery += `first_name="${fname}",last_name="${lname}",`
					sqlUpdateQuery += `phone_no=${phoneNo},email="${email}",home_address="${address}",home_postal_code=${postalCode} `;
					sqlUpdateQuery += `WHERE rgm_username="${username}"`;

					dbconn.query(sqlUpdateQuery, function(err, results, fields){
						if (err) {
							console.log(err);
							res.status(400).json({ api_msg: "MySQL error" });
						}
						else {
							res.status(200).json({ api_msg: "Successful!" });
						}
					});
				}

				break;
			// =========================================================================
			// Restaurant Deliveries Manager User Type =================================
			// Restaurant Reservations Manager User Type ================================
			case "Restaurant Deliveries Manager":
			case "Restaurant Reservations Manager":
				// Steps to edit profile for all users, generally the same less the customer
				if (file) {
					var sqlUpdateQuery = `UPDATE restaurant_subuser SET subuser_picture_ID="${file.filename}",`
					sqlUpdateQuery += `first_name="${fname}",last_name="${lname}",phone_no=${phoneNo},`
					sqlUpdateQuery += `email="${email}",home_address="${address}",home_postal_code=${postalCode} `;
					sqlUpdateQuery += `WHERE subuser_username="${username}"`;

					dbconn.query(sqlUpdateQuery, function(err, results, fields){
						if (err) {
							console.log(err);
							res.status(400).send("MySQL error. If you're the client, contact your developer");
						}
						else {
							// Also update the account status
							var updateAccountStatus = `UPDATE app_user SET account_status="active" `;
							updateAccountStatus += `WHERE username="${username}"`

							dbconn.query(updateAccountStatus, function(err, results, fields){
								if (err) {
									console.log(err);
									res.status(400).send("MySQL error. If you're the client, contact your developer");
								}
								else {
									res.status(200).json({ api_msg: "Successful!" });
								}
							}); // Close nested SQL Query
						}
					});
				}
				else {
					var sqlUpdateQuery = `UPDATE restaurant_subuser SET `
					sqlUpdateQuery += `first_name="${fname}",last_name="${lname}",phone_no=${phoneNo},`
					sqlUpdateQuery += `email="${email}",home_address="${address}",home_postal_code=${postalCode} `;
					sqlUpdateQuery += `WHERE subuser_username="${username}"`;

					dbconn.query(sqlUpdateQuery, function(err, results, fields){
						if (err) {
							console.log(err);
							res.status(400).json({ api_msg: "MySQL " + err });
						}
						else {
							// Also update the account status
							var updateAccountStatus = `UPDATE app_user SET account_status="active" `;
							updateAccountStatus += `WHERE username="${username}"`

							dbconn.query(updateAccountStatus, function(err, results, fields){
								if (err) {
									console.log(err);
									res.status(400).send("MySQL error. If you're the client, contact your developer");
								}
								else {
									res.status(200).json({ api_msg: "Successful!" });
								}
							}); // Close nested SQL Query
						}
					}); // Close first SQL Query
				}				
				
				break;
			// =========================================================================
			// System Administrator User Type ==========================================
			case "System Administrator":
				// This route should not be necessary as all system administrators are created
				// by the application owner
				res.status(200).json({ username: username, userType: userType });

				break;
			// =========================================================================
			// Customer User Type ======================================================
			case "Customer":
				if (file) {
					var sqlUpdateQuery = `UPDATE customer_user SET cust_picture_ID="${file.filename}",`
					sqlUpdateQuery += `first_name="${fname}",last_name="${lname}",phone_no=${phoneNo},`
					sqlUpdateQuery += `email="${email}" WHERE cust_username="${username}"`;

					dbconn.query(sqlUpdateQuery, function(err, results, fields){
						if (err) {
							cconsole.log(err);
							res.status(400).send("MySQL error. If you're the client, contact your developer");
						}
						else {
							// Also update the account status
							var updateAddress = `UPDATE cust_address SET address_info="${address}", `;
							updateAddress += `postal_code=${postalCode} WHERE ca_username="${username}"`

							dbconn.query(updateAddress, function(err, results, fields){
								if (err) {
									console.log(err);
									res.status(400).send("MySQL error. If you're the client, contact your developer");
								}
								else {
									// Also update the account status
									var updateAccountStatus = `UPDATE app_user SET account_status="active" `;
									updateAccountStatus += `WHERE username="${username}"`

									dbconn.query(updateAccountStatus, function(err, results, fields){
										if (err) {
											console.log(err);
											res.status(400).send("MySQL error. If you're the client, contact your developer");
										}
										else {
											res.status(200).json({ api_msg: "Successful!" });
										}
									}); // Close nested nested SQL Query
								}
							}); // Close nested SQL Query
						}
					});
				}
				else {
					var sqlUpdateQuery = `UPDATE customer_user SET `
					sqlUpdateQuery += `first_name="${fname}",last_name="${lname}",phone_no=${phoneNo},`
					sqlUpdateQuery += `email="${email}",home_address="${address}",home_postal_code=${postalCode} `;
					sqlUpdateQuery += `WHERE cust_username="${username}"`;

					dbconn.query(sqlUpdateQuery, function(err, results, fields){
						if (err) {
							console.log(err);
							res.status(400).json({ api_msg: "MySQL " + err });
						}
						else {
							// Also update the account status
							var updateAddress = `UPDATE cust_address SET address_info="${address}", `;
							updateAddress += `postal_code=${postalCode} WHERE ca_username="${username}"`

							dbconn.query(updateAddress, function(err, results, fields){
								if (err) {
									console.log(err);
									res.status(400).send("MySQL error. If you're the client, contact your developer");
								}
								else {
									// Also update the account status
									var updateAccountStatus = `UPDATE app_user SET account_status="active" `;
									updateAccountStatus += `WHERE username="${username}"`

									dbconn.query(updateAccountStatus, function(err, results, fields){
										if (err) {
											console.log(err);
											res.status(400).send("MySQL error. If you're the client, contact your developer");
										}
										else {
											res.status(200).json({ api_msg: "Successful!" });
										}
									}); // Close nested nested SQL Query
								}
							}); // Close nested SQL Query
						}
					}); // Close first SQL Query
				}
				break;
			// =========================================================================	
			default:
				break;
		}
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
		sqlQuery += `WHERE username="${username}" AND BINARY user_password="${oldPassword}"`
		
		// 3. Do the query and return the success message
		dbconn.query(sqlQuery, function(err, results, fields) {
			if (err) {
				console.log(err);
				res.status(400).send("MySQL error. If you're the client, contact your developer");
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
		dbconn.query(sqlQuery, function(err, results, fields) {
			if (err) {
				console.log(err);
				res.status(400).send("MySQL error. If you're the client, contact your developer");
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
					res.status(200).json({ api_msg: "Old password mismatch or Username err!" });
				}
			}
		});
	});

/****************************************************************************
 * User Profile 																									*
 ****************************************************************************
 * This route should be used to manage the password
*/

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

/*******************************************************************************************
 * NO ROUTES FUNCTIONS OR DECLARATIONS BELOW THIS DIVIDER 
 *******************************************************************************************
 * You only export and do nothing else here
 */
module.exports = router;