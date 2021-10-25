const express = require('express');
const router = express.Router();
const dbconn = require('../models/db_model');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const authTokenMiddleware = require('../middleware/authTokenMiddleware');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const date = require('date-and-time');
const pw_gen = require('generate-password');
const sendMail = require('../models/email_model');
const { sendSubUserEmail } = require('../models/email_templates');

// Body Parser
router.use(express.json());
router.use(authTokenMiddleware);

/**************************************************************************
 * Router Constants																												*
 **************************************************************************/
// Generate a default password
const default_pw = pw_gen.generate({
	length: 15,
	numbers: true,
	symbols: '!@#$*?%^&',
	strict: true
})

/**************************************************************************
 * Router functions 																											*
 **************************************************************************
 * 
 */
function accessTokenParser(bearerToken) {
	const authHeader = bearerToken;
  const token = authHeader && authHeader.split(' ')[1]

	return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, userData) => {
    if (err) return null;

		return userData;
  });
}

/****************************************************************************
 * Retrieve restaurant's menu and all items information											*
 ****************************************************************************
 */
router.get('/retrieveAllItems', (req, res) => {
	// Save the restaurantID first from the URL
	const { username } = res.locals.userData;

	// Construct getQuery
	var sqlGetQuery =  `SELECT restaurant_ID FROM restaurant `;
	sqlGetQuery += `WHERE rest_rgm_username='${username}'`;

	dbconn.query(sqlGetQuery, function (error, results, fields){
		if (error) {
			res.status(200).json({ api_msg: "MySQL " + error });
		}
		else {
			const rest_ID = results[0].restaurant_ID;

			// Now we do the actual query we always wanted
			var sqlQuery = 'SELECT ric_name, ri_item_ID, ri_rest_ID, ri_cat_ID, item_name, ';
			sqlQuery += 'item_png_ID, item_desc, item_allergen_warning, '; 
			sqlQuery += 'item_price, item_availability ';
			sqlQuery += 'FROM rest_item_categories JOIN rest_item ';
			sqlQuery += `ON ric_restaurant_ID=${rest_ID} AND ric_ID=ri_cat_ID `;
			sqlQuery += 'ORDER BY ric_name, item_name';

			dbconn.query(sqlQuery, function (error, results, fields) {
				if (error) {
					res.status(200).json({ api_msg: "MySQL " + error });
			  }
			  else {
					// console.log(results);
			    res.status(200).send(results);
				}
			})
		}
	})
});

/****************************************************************************
 * Retrieve restaurant's item category / categories information							*
 ****************************************************************************
 */
router.get('/retrieveCategories', (req, res) => {
	// Save the restaurantID first from the URL
	var restaurantID = req.query.restaurantID;

	// Then construct the sql query based on the query
	var sqlQuery = 'SELECT ric_name FROM rest_item_categories ';
	sqlQuery += `WHERE ric_restaurant_ID=${restaurantID} `;
	sqlQuery += 'GROUP BY ric_name';

	// Query the db and return the said fields to the frontend app
	dbconn.query(sqlQuery, function (error, results, fields) {
		if (error) {
			res.send('MySQL error: ' + error);
    }
    else {
      res.status(200).send(results);
		}
	})
});

/****************************************************************************
 * Retrieve restaurant's item category / categories information (New)				*
 ****************************************************************************
 */
router.get('/itemCategory', (req, res) => {
		// Some useful variables for this route
		var selectedRestID;
		// Save the restaurantID first from the header and also auth
		const { username } = res.locals.userData;

		// Then construct the sql query based on username to get restaurant_ID
		var sqlQuery = 'SELECT DISTINCT ric_name, ric_ID ';
		sqlQuery += 'FROM rest_item_categories JOIN restaurant ';
		sqlQuery += `WHERE rest_rgm_username="${username}" AND ric_restaurant_ID=restaurant_ID `;

		// Query the db and return the said fields to the afrontend app
		dbconn.query(sqlQuery, function (error, results, fields) {
			if (error) {
				res.status(200).json({ api_msg: 'MySQL error: ' + error });
			}
			else {
				res.status(200).send(results);
			}
		})
	});

/****************************************************************************
 * Restaurant New / Add Items Category																			*
 ****************************************************************************
 */
router.post('/createNewCategory', (req, res) => {
	// 1. Get the restaurant gm username
	const { username } = res.locals.userData;

	// Get the ric_name also from the params
	const { ric_name } = req.body;

	// 2. Get the restaurant's ID from the restaurant table
	var sqlGetQuery = `SELECT restaurant_ID FROM restaurant `;
	sqlGetQuery += `WHERE rest_rgm_username="${username}"`;

	dbconn.query(sqlGetQuery, function(error, results, fields){
		if (error) {
			res.status(200).json({ api_msg: "MySQL " + error });
		}
		else {
			// Set the rest_ID first 
			const rest_ID = results[0].restaurant_ID;

			// 3. Create a new entry in the rest_item_categories
			var sqlInsertQuery = "INSERT INTO rest_item_categories(`ric_restaurant_ID`, `ric_name`) ";
			sqlInsertQuery += `VALUES (${rest_ID}, "${ric_name}")`;

			dbconn.query(sqlInsertQuery, function(error, results, fields){
				if (error) {
					res.status(200).json({ api_msg: "MySQL " + error });
				}
				else {
					console.log(results);
					res.status(200).json({ api_msg: "Successful!" });
				}
			})
		}
	})
});

/****************************************************************************
 * Restaurant Items Category Management																			*
 ****************************************************************************
 */
router.route('/itemCategoryManagement')
	.get((req, res) => {
		res.status(200).json({ api_msg: "itemCategoryManagement Route" });
	});

/****************************************************************************
 * Retrieve restaurant's items based on categories ID information						*
 ****************************************************************************
 */
router.get('/retrieveCategoriesItems/:ric_ID', (req, res) => {
	// 1. Since we only have the username in the accesstoken, a nested sqlquery
	// will be needed to bring out the correct data dynamically. Lets get the
	// variables accordingly first
	const rgmUsername = res.locals.userData.username;
	const ric_ID = req.params.ric_ID
	// console.log(rgmUsername);

	// 2. The first query should get the restaurant ID
	var sqlGetQuery = `SELECT * FROM rest_item JOIN rest_item_categories `;
	sqlGetQuery += `ON ri_rest_ID=ric_restaurant_ID AND ric_ID=${ric_ID} `;
	sqlGetQuery += `ORDER BY item_name`;

	dbconn.query(sqlGetQuery, function(error, results, fields){
		if (error) {
			res.status(200).json({ api_msg: 'MySQL ' + error});
			// console.log(error);
		}
		else {
			// 3. Once selected, then we'll use that ID to retrieve everything else
			res.status(200).send(results);
		}
	});
});

/****************************************************************************
 * Retrieve restaurant's items imaage																				*
 ****************************************************************************
 */
router.get('/itemImage/:imageName', (req, res) => {
  // console.log(path.resolve(`../0-test-pictures/${req.params.imageName}`));
  // console.log(req.params.imageName);
  // console.log(pathName);
	if (req.params.imageName != '') {
		const pathName = process.env.ASSETS_SAVE_LOC + 'rest_items_png/' + req.params.imageName;

		// Check if path exist. If yes, great, otherwise send an error image instead
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
 * Restaurant Profile Information and things																*
 ****************************************************************************
 * GET route will get the information based on the rgm's username
 */

// First is the multer config for the restaurant banner
const restaurantBannerStorage = multer.diskStorage({
	destination: (req, file, cb) => {
		// Test Console
		// console.log("Multer Config");
		// console.log(path.resolve(pathName));
		// console.log(path.resolve(pathName));

		// Step 1: Find the exact location on the server to save the file
		const pathName = process.env.ASSETS_SAVE_LOC + 'rest_banners/';

		cb(null, path.resolve(pathName));
	},
	filename: (req, file, cb) => {
		// Step 2: Config Multer to the exact location for upload and get a uuidv4 random
		// uuid for the file name
		// console.log("Multer Config");
		if (file) {
			const bannerName = Date.now() + '-' + uuidv4();
			cb(null, bannerName + path.extname(file.originalname)); 
		}
	}
})
const bannerUpload = multer({storage: restaurantBannerStorage});

router
	.route('/restaurantProfile')
	.get((req, res) => {
		// Firstly, we get the username of the RGM of the restaurant
		const { username } = res.locals.userData;

		// Then, we construct the sql query with the username in mind.
		var sqlQuery = 'SELECT * FROM restaurant ';
		sqlQuery += `WHERE rest_rgm_username="${username}"`;

		// Query the db and return the said fields to the frontend app
		dbconn.query(sqlQuery, function (error, results, fields) {
			if (error) {
				res.status(200).send({ api_msg: 'MySQL error: ' + error });
			}
			else {
				// For this purpose, we should be creating a template to send back to the frontend
				// based on the information that is needed to be displayed.
				// 1. First, understand that the results form both tables together.
				// 2. We need to transform 2 things:
				//		- Time
				var rest_op_hours = date.transform(results[0].rest_opening_time, 'HH:mm:ss', 'hh:mm A');
				rest_op_hours += ' to ' + date.transform(results[0].rest_closing_time, 'HH:mm:ss', 'hh:mm A');

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
					rest_op_hours: rest_op_hours,
					rest_phone_no: results[0].rest_phone_no,
					rest_address_info: results[0].rest_address_info,
					rest_postal_code: results[0].rest_postal_code,
					rest_tags: rest_tags,
					rest_status: results[0].rest_status,
					rest_opening_time: results[0].rest_opening_time,
					rest_closing_time: results[0].rest_closing_time,
					rest_tag_1: results[0].rest_tag_1, 
					rest_tag_2: results[0].rest_tag_2,
					rest_tag_3: results[0].rest_tag_3
				}

				console.log(restaurantProfileData);
				res.status(200).json(restaurantProfileData);
			}
		});
	})
	.put(bannerUpload.single('imageFile'), (req, res) => {
		// Updating of the restaurant's profile
		// 1. Upon receiving all the data from the edit form, we need to check for
		// any new picture uploaded by the restaurant manager
		// 2. Also need to see if the Date object received can be inserted into the
		// MySQL database
		// 3. We can then construct the query accordingly
		// 4. Try the query and see if it is successful. If yes return success api_msg

	})
	.post(bannerUpload.single('bannerImage'), (req, res) => {
		// This post route is for first login / firstLog / firstLogin 
		// 1. Get username from the token
		const { username } = res.locals.userData;
		
		// 2. Get the other data from the req (including filename and fields)
		const { 
			file, body: {
				address,
				postalCode,
				tags
			}
		} = req;

		const tagsArray = tags.split(",");

		// 3. Update the table with all the data gotten.
		var sqlUpdateQuery = `UPDATE restaurant SET rest_banner_ID="${file.filename}",`
		sqlUpdateQuery += `rest_address_info="${address}",rest_postal_code=${postalCode},rest_status="active"`

		if (tagsArray[0]) {
			sqlUpdateQuery += `,rest_tag_1="${tagsArray[0]}"`;
		}

		if (tagsArray[1]) {
			sqlUpdateQuery += `,rest_tag_2="${tagsArray[1]}"`;
		}

		if (tagsArray[2]) {
			sqlUpdateQuery += `,rest_tag_3="${tagsArray[2]}"`;
		}

		sqlUpdateQuery += ` WHERE rest_rgm_username="${username}"`;

		dbconn.query(sqlUpdateQuery, function(error, results, fields){
			if (error) {
				res.status(200).json({ api_msg: "MySQL " + error });
			}
			else {
				res.status(200).json({ api_msg: "Successful!" });
			}
		})

		console.log(req.file, req.body);
	});

/****************************************************************************
 * Retrieve all available Restaurant Tags																		*
 ****************************************************************************
 */
router.get('/tags', (req, res) => {
		// Then construct the sql query based on username to get restaurant_ID
		var sqlQuery = `SELECT restaurant_tag FROM rest_tags `;

		// Query the db and return the said fields to the frontend app
		dbconn.query(sqlQuery, function (error, results, fields) {
			if (error) {
				res.status(200).json({ api_msg: 'MySQL error: ' + error });
			}
			else {
				var restaurantTags = [];

				results.forEach(row => {
					restaurantTags.push(row.restaurant_tag);
				})

				res.status(200).json({ restaurantTags: restaurantTags });
			}
		})
	});

/*****************************************************************************************
 * Restaurant Item / Items Managment
 ****************************************************************************************
 * Item add, edit, delete, retrieve get
 * 
 */
const itemStorage = multer.diskStorage({
	destination: (req, file, cb) => {
		// Test Console I just thinking. When i thinking the mouse dances
		// console.log('Multer Config');
		// console.log(path.resolve(pathName));
		// console.log(path.resolve(pathName));

		// Step 1: Find the exact location on the server to save the file
		const pathName = process.env.ASSETS_SAVE_LOC + 'rest_items_png/';

		cb(null, path.resolve(pathName));
	},
	filename: (req, file, cb) => {
		// Step 2: Config Multer to the exact location for upload and get a uuidv4 random
		// uuid for the file name
		// console.log('Multer Config');
		if (file) {
			const itemName = Date.now() + '-' + uuidv4();
			cb(null, itemName + path.extname(file.originalname)); 
		}
	}
})
const upload = multer({storage: itemStorage}); //{ dest: '../assets'}

// Step 3: We write the post route for when we add an item to the db
router.post('/addmenuitem', upload.single('imageFile'), (req, res) => {
	// Get all the useful variables from the req
	const { username } = res.locals.userData;

  const {
		file, body: {
			itemAvailability,
			itemName, 
			itemPrice, 
			itemDesc, 
			itemAllergy,
			itemCategory
		}
	} = req;
	
	// Console log for testing, please comment out when done
	// console.log("restaurant.js line 196 ", file, req.body);

	var sqlQueryRestID = `SELECT restaurant_ID FROM restaurant `;
	sqlQueryRestID += `WHERE rest_rgm_username="${username}"`;

	dbconn.query(sqlQueryRestID, function(error, results, fields){
		if (error) {
			res.status(200).send('MySQL error: ' + error);
			// console.log(error);
		}
		else {
			// 3. Once selected, then we'll use that ID to retrieve everything else
			const rest_ID = results[0].restaurant_ID;

			// Construct insert sqlQuery 
			var sqlQuery = 'INSERT INTO `rest_item`(`ri_rest_ID`, `ri_cat_ID`, `item_name`, `item_png_ID`, ';
			sqlQuery += ' `item_desc`, `item_allergen_warning`, `item_price`, `item_availability`) ';
			sqlQuery += `VALUES (${rest_ID}, ${itemCategory}, "${itemName}", "${file.filename}", `;
			sqlQuery += `"${itemDesc}", "${itemAllergy}", ${itemPrice}, ${itemAvailability})`;

			// Make sqlQuery
			dbconn.query(sqlQuery, function(error, results, fields) {
				if (error) {
					//console.log(error);
					res.status(200).send('MySQL error: ' + error);
				}
				else {
					// console.log(results);
					res.status(200).json({ api_msg: `New item with name ${itemName} added to your restaurant!` });
				}
			});
		}
	});
});

// Step 4: Create the routes for editing and getting information
router
  .route('/restaurantItem/:itemid')
	.get((req, res) => {
		// This one simply gets the items based on the itemID (if its ever needed)
		// First we get the itemID
		const itemID = req.params.itemid;

		// Construct the SQL query based on the item
		var sqlGetQuery = `SELECT * FROM rest_item `;
		sqlGetQuery += `JOIN rest_item_categories `
		sqlGetQuery += `ON ri_cat_ID=ric_ID AND ri_item_ID=${itemID} `;

		dbconn.query(sqlGetQuery, function(error, results, fields){
			if (error) {
				res.status(200).json({ api_msg: "MySQL " + error });
			}
			else {
				res.status(200).send(results[0]);
			}
		})
	})
	.put(upload.single('imageFile'), (req, res) => {
		// console.log("PUT REQUEST");
		// 1. Get all the variables from the form and also the file
		const {
				file, 
				body: {
				itemID, itemPngID, itemRestID, itemName, itemPrice, 
				itemDesc, itemAllergy, itemCategory, itemAvailability
			}
		} = req;

		// Testing console, remember to remove
		// console.log(req.body);

		// 2. Check if there was a new file in the first place
		if (file) {
			// console.log("We need to do something about that file.");
			// 3. If there is a new file, delete the old file
			// 4. Save all the new variables into the database
			// First we find the path once again
			const pathName = process.env.ASSETS_SAVE_LOC + `rest_items_png/${itemPngID}`;

			// Once delete, we can proceed to save the data into the database
			// console.log(path.resolve(pathName));

			// Check if the file exist, if yes delete the old file first then save into MySQL
			if(fs.existsSync(path.resolve(pathName))) {
				// fs.unlink deletes old file
				fs.unlink(path.resolve(pathName), (err) => {
					if (err) 
						return res.status(200).json({ api_msg: 'Error deleteing the file' }); 
					else {
						// console.log(path.resolve(pathName) + " deleted!");
						// Construct the Update Query Yea
						var sqlUpdateQuery = `UPDATE rest_item `;
						sqlUpdateQuery += `SET ri_rest_ID=${itemRestID}, ri_cat_ID=${itemCategory}, item_name="${itemName}", `;
						sqlUpdateQuery += `item_png_ID="${file.filename}", item_desc="${itemDesc}", item_allergen_warning="${itemAllergy}", `;
						sqlUpdateQuery += `item_price=${itemPrice}, item_availability=${itemAvailability} `;
						sqlUpdateQuery += `WHERE ri_item_ID=${itemID}`; 

						// This will update with all the new stuff!
						dbconn.query(sqlUpdateQuery, function(error, results, fields){
							if (error) {
								res.status(200).json({ api_msg: 'Update error, double check for when new image is uploaded!' }); 
							}
							else {
								res.status(200).json({ api_msg: `Updated item '${itemName}'! NOTE: New image found! Old image deleted.` });
							}
						});
					}
				})
			}
			else {
				var sqlUpdateQuery = `UPDATE rest_item `;
				sqlUpdateQuery += `SET ri_rest_ID=${itemRestID}, ri_cat_ID=${itemCategory}, item_name="${itemName}", `;
				sqlUpdateQuery += `item_png_ID="${file.filename}", item_desc="${itemDesc}", item_allergen_warning="${itemAllergy}", `;
				sqlUpdateQuery += `item_price=${itemPrice}, item_availability=${itemAvailability} `;
				sqlUpdateQuery += `WHERE ri_item_ID=${itemID}`;

				// Query the MySQL
				dbconn.query(sqlUpdateQuery, function(error, results, fields){
					if (error) {
						res.status(200).json({ api_msg: "Update error, double check for when new image is uploaded!" }); 
					}
					else {
						res.status(200).json({ api_msg: `Updated item ${itemName}! NOTE: New image uploaded!` });
					}
				});
			}
		}
		else {
			// Since no new imageFile is detected, then just update the data to the MySQL database
			var sqlUpdateQuery = `UPDATE rest_item `;
			sqlUpdateQuery += `SET ri_rest_ID=${itemRestID}, ri_cat_ID=${itemCategory}, item_name="${itemName}", `;
			sqlUpdateQuery += `item_desc="${itemDesc}", item_allergen_warning="${itemAllergy}", `;
			sqlUpdateQuery += `item_price=${itemPrice}, item_availability=${itemAvailability} `;
			sqlUpdateQuery += `WHERE ri_item_ID=${itemID}`;

			// Query the MySQL
			dbconn.query(sqlUpdateQuery, function(error, results, fields){
				if (error) {
					res.status(200).json({ api_msg: "Update error, double check for when no image and only data is updated" }); 
				}
				else {
					res.status(200).json({ api_msg: `Updated item "${itemName}"!` });
				}
			});
		}
	})
	.delete((req, res) => {
		// NOTE: Since itemID is unique and independent of all other IDs, the MySQL query simply
		// needs to find that ID and delete it
		const itemID = req.params.itemid

		var sqlDeleteQuery = 'DELETE FROM `rest_item` ';
		sqlDeleteQuery += `WHERE ri_item_ID=${itemID}`;

		dbconn.query(sqlDeleteQuery, function(error, results, fields) {
			if (error) {
				res.status(200).json({ api_msg: 'MySQL ' + error });
			}
			else {
				res.status(200).json({ api_msg: 'Item with itemID: ' + itemID + ' deleted.' });
			}
		})
	});

// Route Param link for itemID
// router.param("itemid", (req, res, next, itemid) => {
// 	// console.log(itemid);
// 	next();
// });

/****************************************************************************
 * Retrieve restaurant's status																							*
 ****************************************************************************
 */
router.get('/restaurantStatus', (req, res) => {
	// To get the restaurant's status we just need to get to the restaurant table 
	// and match it to the restaurant's status
	// 1. First step is to get username from the middleware
	const { username } = res.locals.userData;

	// 2. Then we construct the query
	var sqlGetQuery = `SELECT rest_status FROM restaurant `;
	sqlGetQuery += `WHERE rest_rgm_username="${username}"`;
	
	// 3. Then after that we make the dbconn
	dbconn.query(sqlGetQuery, function(error, results, fields){
		if (error) {
			res.status(200).json({ api_msg: "MySQL " + error });
		}
		else {
			// 4. Return the restaurant's status
			res.status(200).send(results[0].rest_status);
		}
	})
});

/****************************************************************************
 * Get all restaurant subusers																							*
 ****************************************************************************
 */
router.get('/rgm/allsubusers', (req, res) => {
	// This one gets the users and returns all the users accordingly
	// 1. We'll need to once again get the restaurant's ID based on RGM username
	const { username } = res.locals.userData;

	var sqlQuery = `SELECT restaurant_ID FROM restaurant `;
	sqlQuery += `WHERE rest_rgm_username="${username}"`;

	dbconn.query(sqlQuery, function(error, results, fields){
		if (error) {
			res.status(200).send({ api_msg: "MySQL " + error });
		}
		else {
			// 2. Using the ID, we get all the subusers
			const rest_ID = results[0].restaurant_ID;

			var sqlGetQuery = `SELECT subuser_ID, subuser_rest_ID, subuser_username, `;
			sqlGetQuery += ` first_name, last_name, phone_no, email, subuser_type `;
			sqlGetQuery += `FROM restaurant_subuser WHERE subuser_rest_ID=${rest_ID}`;

			// 3. With that we can return the whole result query from the SQL, and then
			// we'll parse the data accordingly with an async function at the frontend
			dbconn.query(sqlGetQuery, function(error, results, fields){
				if (error) {
					res.status(200).send({ api_msg: "MySQL " + error });
				}
				else {
					res.status(200).send(results);
				}
			})
		}
	})
});

/****************************************************************************
 * Add new restaurant subuser																								*
 ****************************************************************************
 */
router.post('/rgm/addsubuser', (req, res) => {
	// We're trying to add the subuser here
	// 1. Get the RGM that is making the request, cos we need the restaurant ID
	const { username } = res.locals.userData;

	const {subuser_username, fname, lname, email, phone, role} = req.body;

	console.log(req.body);

	var sqlGetQuery = `SELECT restaurant_ID, restaurant_name FROM restaurant `;
	sqlGetQuery += `WHERE rest_rgm_username="${username}"`;

	dbconn.query(sqlGetQuery, function(error, results, fields){
		if (error) {
			res.status(200).send({ api_msg: "MySQL " + error });
		}
		else {
			// 2. Once we get the restaurant ID, we can then construct a POST query to create the new
			// user. We must generate a default password for that user as well and create a user in the
			// app_user table
			// Get restaurant ID and name
			const { restaurant_ID, restaurant_name } = results[0];
			console.log(restaurant_ID, restaurant_name);
			
			// Generate a default password
			const subuser_pw = default_pw;
			
			// Create new user in app_user
			var sqlPostQuery = "INSERT INTO app_user(`username`, `user_password`, `user_type`, `account_status`)";
			sqlPostQuery += `VALUES ("${subuser_username}", "${subuser_pw}", "${role}", "first")`;

			dbconn.query(sqlPostQuery, function(error, results, fields){
				if (error) {
					res.status(200).send({ api_msg: "MySQL " + error });
				}
				else {
					if (results.affectedRows > 0) {
						// Insert successful, proceed on with the profile creation
						var sqlProfilePostQuery = "INSERT INTO restaurant_subuser(`subuser_rest_ID`, `subuser_username`, "
						sqlProfilePostQuery += "`first_name`, `last_name`, `phone_no`, `email`, `subuser_type`) ";
						sqlProfilePostQuery += `VALUES (${restaurant_ID}, "${subuser_username}", "${fname}", "${lname}", `
						sqlProfilePostQuery += `${phone}, "${email}", "${role}")`

						dbconn.query(sqlProfilePostQuery, function(error, results, fields){
							if (error) {
								res.status(200).send({ api_msg: "MySQL " + error });
							}
							else {
								sendSubUserEmail(subuser_username, subuser_pw, email, restaurant_name)
									.then((mailOptions) => {
										sendMail(mailOptions)
											.then((response) => {
												// Console log
												console.log("Send mail has been triggered successfully for adding a subuser");

												// send response back to frontend
												res.status(200).send({ api_msg: `Successful subuser creation for subuser ${subuser_username}!` });
											})
											.catch(error => console.log(error));
									})
									.catch(error => console.log(error));								
							}
						}); // Closed for third query


						
					}
					
				}
			})



			// res.status(200).send({ api_msg: results });


		}
	})
	
	// 3. Once done with that, we send an email to the subuser with the login details

	var sqlPostQuery = ``
});

/****************************************************************************
 * RGM edit details of subuser																							*
 ****************************************************************************
 * The idea for this part is to allow the RGM to change the role of the subuser
 * or other details if that is ever required
 */
router
  .route('/rgm/subuser/:subuser_ID')
	.get((req, res) => {
		// constructing the sql query
		var sqlGetQuery = `SELECT subuser_ID, subuser_rest_ID, subuser_username, `;
		sqlGetQuery += ` first_name, last_name, phone_no, email, subuser_type `;
		sqlGetQuery += `FROM restaurant_subuser WHERE subuser_ID=${req.params.subuser_ID}`;

		dbconn.query(sqlGetQuery, function(error, results, fields){
			if (error) {
				res.status(200).send({ api_msg: "MySQL " + error });
			}
			else {
				res.status(200).send(results[0]);
			}
		});
	})
	.put((req, res) => {
		res.send(`Get item with itemID ${req.params.subuser_ID}`);
	})
	.delete((req, res) => {
		res.send(`Get item with itemID ${req.params.subuser_ID}`);
	});


module.exports = router;

/*  */
// router.param('subuser_ID', (req, res, next, subuser_ID) => {
// 	// console.log(subuser_ID);
// 	next();
// });