// Express Server imports
const express = require('express');
const router = express.Router();

// Database matters
const dbconn = require('../models/db_model');

// General Imports
const { v4: uuidv4 } = require('uuid');
const asyncHandler = require('express-async-handler');
const datetime_T = require('date-and-time');
const chalk = require('chalk');
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
const consoleLogger = require('../middleware/loggerMiddleware');

/**************************************************************************
 * Router Middlewares and parsers																					*
 **************************************************************************/
router.use(express.json());
router.use(authTokenMiddleware);
router.use(consoleLogger);

/**************************************************************************
 * Router Constants																												*
 **************************************************************************/
const timestamp = `[${chalk.green(datetime_T.format(new Date(), 'YYYY-MM-DD HH:mm:ss'))}] `;

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
		// console.log(file);
		if (file) {
			const profilePictureName = Date.now() + '-' + uuidv4();
			cb(null, profilePictureName + path.extname(file.originalname)); 
		}
	}
})
const profileUpload = multer({storage: profileStorage}); //{ dest: '../assets'}

// Async function to encode the image into a string
async function transformImage(imageID) {
	try {
		const pathName = process.env.ASSETS_SAVE_LOC + 'profile_pictures/' + imageID;

		// Check if path exist. If yes, great, otherwise send an err image instead
		// Of course, we use our favourite promises
		const imagebase64 = await new Promise((resolve, reject) => {
			fs.access(pathName, fs.F_OK, (err) => {
				if (err) {
					// Console log the error
					console.log(timestamp + "users.js line 169 " + err);
					
					var bitmap = fs.readFileSync('./public/assets/default-profile.png', 'base64');
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

		return imagebase64;
	}
	catch(err) {
		console.log(timestamp + "error in users.js image transformer " + err);
	}
}

router
  .route('/profilemanagement')
	.get(asyncHandler(async(req, res, next) => {
		// console.log(req.method);
		// Get the userData from the access token
		// console.log(res.locals.userData)
		const {
			username, userType
		} = res.locals.userData;
		
		// console.log(username, userType);

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
				var dataJSON = await new Promise((resolve, reject) => {
					dbconn.query(sqlGetQuery, function (err, results, fields) {
						if (err) {
							console.log(err);
							reject(err);
						}
						else {
							const tempJSON = {
								profile_image: results[0].picture_ID ?? "error.png",
								username: results[0].rgm_username,
								userType: userType,
								first_name: results[0].first_name ?? "NIL",
								last_name: results[0].last_name ?? "NIL",
								phone_no: results[0].phone_no ?? "NIL",
								email: results[0].email ?? "NIL",
								address: results[0].home_address ?? "NIL",
								postal_code: results[0].home_postal_code ?? 000000
							}

							resolve(tempJSON);
						}
					}); // Closing DB query
				}); // Closing promise

				// Transform the image into a encoded string
				dataJSON['profile_image_base64'] = await transformImage(dataJSON.profile_image);

				res.status(200).send(dataJSON);

				break;
			// =========================================================================
			// Restaurant Deliveries Manager User Type =================================
			// Restaurant Reservations Manager User Type ================================
			case "Restaurant Deliveries Manager":
			case "Restaurant Reservations Manager":
				var sqlGetQuery = "SELECT * FROM restaurant_subuser ";
				sqlGetQuery += `WHERE subuser_username="${username}"`;

				// Query the db and return the said fields to the frontend app
				var dataJSON = await new Promise((resolve, reject) => {
					dbconn.query(sqlGetQuery, function (err, results, fields) {
						if (err) {
							console.log(err);
							reject(err);
						}
						else {
							const tempJSON = {
								profile_image: results[0].subuser_picture_ID ?? "error.png",
								username: results[0].subuser_username,
								userType: userType,
								first_name: results[0].first_name ?? "NIL",
								last_name: results[0].last_name ?? "NIL",
								phone_no: results[0].phone_no ?? "NIL",
								email: results[0].email ?? "NIL",
								address: results[0].home_address ?? "NIL",
								postal_code: results[0].home_postal_code ?? 000000
							}

							resolve(tempJSON);
						}
					}); // Closing DB query
				}); // Closing promise

				// Transform the image into a encoded string
				dataJSON['profile_image_base64'] = await transformImage(dataJSON.profile_image);

				res.status(200).send(dataJSON);

				break;
			// =========================================================================
			// System Administrator User Type ==========================================
			case "System Administrator":
				var sqlGetQuery = "SELECT admin_username, picture_ID, first_name, last_name, phone_no, ";
				sqlGetQuery += "email, home_address, home_postal_code ";
				sqlGetQuery += "FROM admin_user ";
				sqlGetQuery += `WHERE admin_username="${username}"`;

				// Query the db and return the said fields to the frontend app
				var dataJSON = await new Promise((resolve, reject) => {
					dbconn.query(sqlGetQuery, function (err, results, fields) {
						if (err) {
							console.log(err);
							reject(err);
						}
						else {
							const tempJSON = {
								profile_image: results[0].picture_ID ?? "error.png",
								username: results[0].admin_username,
								userType: userType,
								first_name: results[0].first_name ?? "NIL",
								last_name: results[0].last_name ?? "NIL",
								phone_no: results[0].phone_no ?? "NIL",
								email: results[0].email ?? "NIL",
								address: results[0].home_address ?? "NIL",
								postal_code: results[0].home_postal_code ?? 000000
							}

							resolve(tempJSON);
						}
					}); // Closing DB query
				}); // Closing promise

				// Transform the image into a encoded string
				dataJSON['profile_image_base64'] = await transformImage(dataJSON.profile_image);

				res.status(200).send(dataJSON);

				break;
			// =========================================================================
			// Customer User Type ======================================================
			case "Customer":
				var sqlGetQuery = `SELECT * FROM customer_user WHERE cust_username="${username}"`;

				// Query the db and return the said fields to the frontend app
				var dataJSON = await new Promise((resolve, reject) => {
					dbconn.query(sqlGetQuery, function (err, results, fields) {
						if (err) {
							console.log(err);
							reject(err);
						}
						else {
							const tempJSON = {
								profile_image: results[0].cust_picture_ID ?? "error.png",
								username: results[0].cust_username,
								userType: userType,
								first_name: results[0].first_name ?? "NIL",
								last_name: results[0].last_name ?? "NIL",
								phone_no: results[0].phone_no ?? "NIL",
								email: results[0].email ?? "NIL",
								address: results[0].address_info ?? "NIL",
								postal_code: results[0].postal_code ?? 000000
							}

							resolve(tempJSON);
						}
					}); // Closing DB query
				}); // Closing promise

				// Transform the image into a encoded string
				dataJSON['profile_image_base64'] = await transformImage(dataJSON.profile_image);

				res.status(200).send(dataJSON);

				break;
			// =========================================================================	
			default:
				break;
		}
	}))
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
				postalCode,
				oldImageFile
			}
		}	= req;

		if (oldImageFile || oldImageFile != '') {
			// Path of original file
			const pathName = process.env.ASSETS_SAVE_LOC + 'profile_pictures/' + oldImageFile ;

			// Check if the file exist, if yes delete the old file first then save into MySQL
			if(fs.existsSync(path.resolve(pathName))) {
				// fs.unlink deletes old file
				fs.unlink(path.resolve(pathName), (err) => {
					if (err) 
						console.log(err);
				});
			}
		}
		
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
				if (file) {
					var sqlUpdateQuery = `UPDATE admin_user SET picture_ID="${file.filename}",`
					sqlUpdateQuery += `first_name="${fname}",last_name="${lname}",phone_no=${phoneNo},`
					sqlUpdateQuery += `email="${email}",home_address="${address}",home_postal_code=${postalCode} `;
					sqlUpdateQuery += `WHERE admin_username="${username}"`;

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
					var sqlUpdateQuery = `UPDATE admin_user SET `
					sqlUpdateQuery += `first_name="${fname}",last_name="${lname}",phone_no=${phoneNo},`
					sqlUpdateQuery += `email="${email}",home_address="${address}",home_postal_code=${postalCode} `;
					sqlUpdateQuery += `WHERE admin_username="${username}"`;

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
			// Customer User Type ======================================================
			case "Customer":
				// Steps to edit profile for all users, generally the same less the customer
				if (file) {
					var sqlUpdateQuery = `UPDATE customer_user SET cust_picture_ID="${file.filename}",`
					sqlUpdateQuery += `first_name="${fname}",last_name="${lname}",phone_no=${phoneNo},`
					sqlUpdateQuery += `email="${email}",address_info="${address}",postal_code=${postalCode} `;
					sqlUpdateQuery += `WHERE cust_username="${username}"`;

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
					var sqlUpdateQuery = `UPDATE customer_user SET `
					sqlUpdateQuery += `first_name="${fname}",last_name="${lname}",phone_no=${phoneNo},`
					sqlUpdateQuery += `email="${email}",address_info="${address}",postal_code=${postalCode} `;
					sqlUpdateQuery += `WHERE cust_username="${username}"`;

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
			default:
				break;
		}
	})
	.post(profileUpload.single("profileImage"), asyncHandler(async (req, res, next) => {
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
		// done. Getting all the fields updated is the part, bearing in mind that there might
		// be a file upload from the user
		switch (userType) {
			// RGM User Type ==========================================================
			case "Restaurant General Manager":
				// Construct the query
				var sqlUpdateQuery = `UPDATE restaurant_gm SET `;

				// If there is a file uploaded, then we need to put the name into the sql database
				if (file) {
					sqlUpdateQuery += `picture_ID="${file.filename}",`;
				}

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

				break;
			// =========================================================================
			// Restaurant Deliveries Manager User Type =================================
			// Restaurant Reservations Manager User Type ================================
			case "Restaurant Deliveries Manager":
			case "Restaurant Reservations Manager":
				// Steps to edit profile for all users, generally the same less the customer
				var sqlUpdateQuery = `UPDATE restaurant_subuser SET `;

				// If there is a file uploaded, then we need to put the name into the sql database
				if (file) {
					sqlUpdateQuery += `subuser_picture_ID="${file.filename}",`;
				}
				
				sqlUpdateQuery += `first_name="${fname}",last_name="${lname}",phone_no=${phoneNo},`;
				sqlUpdateQuery += `email="${email}",home_address="${address}",home_postal_code=${postalCode} `;
				sqlUpdateQuery += `WHERE subuser_username="${username}"`;

				dbconn.getConnection((err, conn) => {
					conn.query(sqlUpdateQuery, function(err, results, fields){
						if (err) {
							conn.release();
							console.log(err);
							res.status(400).send("MySQL error. If you're the client, contact your developer");
						}
						else {
							// Also update the account status
							var updateAccountStatus = `UPDATE app_user SET account_status="active" `;
							updateAccountStatus += `WHERE username="${username}"`

							conn.query(updateAccountStatus, function(err, results, fields){
								if (err) {
									conn.release();
									console.log(err);
									res.status(400).send("MySQL error. If you're the client, contact your developer");
								}
								else {
									conn.release();
									res.status(200).json({ api_msg: "Successful!" });
								}
							}); // Close nested SQL Query
						}
					});
				});
				
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
				// We now proceed to update the customer's profile with their entry
				sqlUpdateQuery = `UPDATE customer_user SET `;

				if (file) {
					sqlUpdateQuery += `cust_picture_ID="${file.filename}",`
				}

				sqlUpdateQuery += `first_name="${fname}",last_name="${lname}",phone_no=${phoneNo},`
				sqlUpdateQuery += `email="${email}", address_info="${address}", postal_code=${postalCode} `
				sqlUpdateQuery += `WHERE cust_username="${username}"`;

				dbconn.getConnection((err, conn) => {
					conn.query(sqlUpdateQuery, function(err, results, fields){
						if (err) {
							conn.release();
							console.log(err);
							res.status(400).send("MySQL error. If you're the client, contact your developer");
						}
						else {
							// Also update the account status
							var updateAccountStatus = `UPDATE app_user SET account_status="active" `;
							updateAccountStatus += `WHERE username="${username}"`

							conn.query(updateAccountStatus, function(err, results, fields){
								if (err) {
									conn.release();
									console.log(err);
									res.status(200).json({ api_msg: "fail" });
								}
								else {
									conn.release();
									res.status(200).json({ api_msg: "success" });
								}
							}); // Close nested SQL Query
						}
					});
				});
				break;
			// =========================================================================	
			default:
				break;
		}
	}));

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
 * User Profile 	
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