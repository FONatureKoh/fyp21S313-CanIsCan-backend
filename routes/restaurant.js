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
const chalk = require('chalk');

// For image uploads
const multer = require('multer');

// Email Modules
const sendMail = require('../models/email_model');
const { sendSubUserEmail } = require('../models/credentials_email_template');

// Middle Ware stuffs
const authTokenMiddleware = require('../middleware/authTokenMiddleware');
const asyncHandler = require('express-async-handler');
const consoleLogger = require('../middleware/loggerMiddleware');

/**************************************************************************
 * Router Middlewares and parsers																					*
 **************************************************************************/
router.use(express.json());
router.use(express.urlencoded({ extended: true }));
router.use(authTokenMiddleware);
router.use(consoleLogger);

/**************************************************************************
 * Router Constants																												*
 **************************************************************************/
// Generate a default password
const default_pw = pw_gen.generate({
	length: 15,
	numbers: true,
	symbols: '!@#$*?%^&',
	strict: true
});

const timestamp = `[${chalk.green(datetime_T.format(new Date(), 'YYYY-MM-DD HH:mm:ss'))}] `;

/****************************************************************************
 * Retrieve restaurant's menu and all items information											*
 ****************************************************************************
 */
router.get('/retrieveAllItems', asyncHandler(async(req, res, next) => {
	// Refracting code to get the image encoding into base64 so that it can be sent
	// as part of the json so that there is no need to go through getting of an image
	// 1. As always we get the restaurant ID first from the username
	const { username } = res.locals.userData;

	// Construct getQuery
	var sqlGetQuery =  `SELECT restaurant_ID FROM restaurant `;
	sqlGetQuery += `WHERE rest_rgm_username='${username}'`;

	const restID = await new Promise((resolve, reject) => {
		dbconn.query(sqlGetQuery, function(err, results, fields) {
			if (err) {
				console.log(timestamp + err);
				reject(err);
			}
			else {
				if (results[0]) {
					resolve(results[0].restaurant_ID);
				}
				else {
					resolve(0);
				}				
			}
		});
	});

	// 2. Then we get all the items that belongs to that restaurant.
	var sqlQuery = 'SELECT ric_name, ri_item_ID, ri_rest_ID, ri_cat_ID, item_name, ';
	sqlQuery += 'item_png_ID, item_desc, item_allergen_warning, '; 
	sqlQuery += 'item_price, item_availability ';
	sqlQuery += 'FROM rest_item_categories JOIN rest_item ';
	sqlQuery += `ON ric_restaurant_ID=${restID} AND ric_ID=ri_cat_ID `;
	sqlQuery += `WHERE item_availability!=2 `
	sqlQuery += 'ORDER BY ric_name, item_name';

	const allItems = await new Promise((resolve, reject) => {
		dbconn.query(sqlQuery, function (err, results, fields) {
			if (err) {
				console.log(err);
				reject(err);
			}
			else {
				// console.log(results);
				resolve(results);
			}
		});
	});

	// 3. Once these two promises are resolved, we then parse the data, into a useable
	// JSON for the front end.
	var tempItemsArray = [];

	for (let item of allItems) {
		var tempJSON = {
			ric_name: item.ric_name,
			ri_item_ID: item.ri_item_ID,
			ri_rest_ID: item.ri_rest_ID,
			ri_cat_ID: item.ri_cat_ID,
			item_name: item.item_name,
			item_png_ID: item.item_png_ID,
			item_desc: item.item_desc,
			item_allergen_warning: item.item_allergen_warning,
			item_price: item.item_price,
			item_availability: item.item_availability
		}

		if (item.item_png_ID) {
			const pathName = process.env.ASSETS_SAVE_LOC + 'rest_items_png/' + item.item_png_ID;

			// Check if path exist. If yes, great, otherwise send an err image instead
			// Of course, we use our favourite promises
			const imagebase64 = await new Promise((resolve, reject) => {
				fs.access(pathName, fs.F_OK, (err) => {
					if (err) {
						// Console log the err
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

			tempJSON['item_png_base64'] = imagebase64;
			tempItemsArray.push(tempJSON);	
		}
	}

	if (tempItemsArray.length != 0) {
		res.status(200).send(tempItemsArray);
	}
	else {
		res.status(200).send([]);
	}
}));

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
	dbconn.query(sqlQuery, function (err, results, fields) {
		if (err) {
			res.send('MySQL err: ' + err);
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
router.get('/itemCategories', (req, res) => {
		// Some useful variables for this route
		var selectedRestID;
		// Save the restaurantID first from the header and also auth
		const { username } = res.locals.userData;

		// Then construct the sql query based on username to get restaurant_ID
		var sqlQuery = 'SELECT DISTINCT ric_name, ric_ID ';
		sqlQuery += 'FROM rest_item_categories JOIN restaurant ';
		sqlQuery += `WHERE rest_rgm_username="${username}" AND ric_restaurant_ID=restaurant_ID `;
		sqlQuery += `AND ric_status=1`

		// Query the db and return the said fields to the afrontend app
		dbconn.query(sqlQuery, function (err, results, fields) {
			if (err) {
				res.status(200).json({ api_msg: 'MySQL err: ' + err });
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

	dbconn.query(sqlGetQuery, function(err, results, fields){
		if (err) {
			res.status(200).json({ api_msg: "MySQL " + err });
		}
		else {
			// Set the rest_ID first 
			const rest_ID = results[0].restaurant_ID;

			// 3. Create a new entry in the rest_item_categories
			var sqlInsertQuery = "INSERT INTO rest_item_categories(`ric_restaurant_ID`, `ric_name`) ";
			sqlInsertQuery += `VALUES (${rest_ID}, "${ric_name}")`;

			dbconn.query(sqlInsertQuery, function(err, results, fields){
				if (err) {
					res.status(200).json({ api_msg: "MySQL " + err });
				}
				else {
					// console.log(results);
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
	.put((req, res) => {
		// 1. We get some useful variables
		const { catID, newCatName } = req.body;

		// 2. We construct the query
		var updateQuery = `UPDATE rest_item_categories SET ric_name="${newCatName}" WHERE ric_ID=${catID}`;

		// 3. We execute the query
		dbconn.query(updateQuery, function(err, results, fields){
			if (err) {
				console.log(err);
				res.status(200).send({ api_msg: "fail" });
			}
			else {
				// console.log(results);
				res.status(200).send({ api_msg: "success" });
			}
		});
	})
	.delete(asyncHandler(async(req, res, next) => {
		// 1. We get some useful variables
		const { catID, safeDelete } = req.body;
		
		// console.log(catID, safeDelete);

		// 2. We construct the query
		if (safeDelete == true) {
			var deleteQuery = `DELETE FROM rest_item_categories WHERE ric_ID=${catID}`;

			// 3. We execute the query
			dbconn.query(deleteQuery, function(err, results, fields){
				if (err) {
					console.log(err);
					res.status(200).send({ api_msg: "fail" });
				}
				else {
					// console.log(results);
					res.status(200).send({ api_msg: "success" });
				}
			});
		}
		else {
			var deleteQuery = `UPDATE rest_item_categories SET ric_status=2 WHERE ric_ID=${catID}`;

			// 3. We execute the query
			dbconn.query(deleteQuery, function(err, results, fields){
				if (err) {
					console.log(err);
					res.status(200).send({ api_msg: "fail" });
				}
				else {
					// console.log(results);
					res.status(200).send({ api_msg: "success" });
				}
			});
		}
	}));

/****************************************************************************
 * Restaurant Items Category Management																			*
 ****************************************************************************
 */
router.get('/checkcategory/:catID', asyncHandler(async(req, res) => {
	// 1. We get some useful variables
	const catID = req.params.catID;

	// THIS CHECKS IF CATEGORY IS IN USE BY ANY ITEMS
	var checkQuery = `SELECT COUNT(ri_cat_ID) AS count FROM rest_item `
	checkQuery += `WHERE ri_cat_ID=${catID} AND item_availability IN (0, 1)`;

	const itemsUsingCat = await new Promise((resolve, reject) => {
		dbconn.query(checkQuery, function(err, results, fields){
			if (err) {
				console.log(err);
				reject(err);
			}
			else {
				resolve(results[0].count);
			}
		});
	});
	
	if (itemsUsingCat == 0) {
		// IF NO RESTAURANT ITEMS ARE USING THIS CATEGORY, PERFORM DELETED ITEMS CHECK
		var checkQuery = `SELECT COUNT(ri_cat_ID) AS count FROM rest_item `
		checkQuery += `WHERE ri_cat_ID=${catID} AND item_availability=2`;

		const deletedItemsUsingCat = await new Promise((resolve, reject) => {
			dbconn.query(checkQuery, function(err, results, fields){
				if (err) {
					console.log(err);
					reject(err);
				}
				else {
					console.log(results);
					resolve(results[0].count);		
				}
			});
		});

		// IF THE CATEGORY IS IN USE BY AN ITEM (even if item was deleted deleted), THEN 
		// MARK THE CATEGORY AS DELETED IN THE ric_statu COLUMN
		if (deletedItemsUsingCat != 0) {
			console.log(deletedItemsUsingCat);
			res.status(200).send({ api_msg: "category in use", canDelete: "yes" });
		}
		else {
			// IF THE CHECK REACHS HERE IT MEANS THAT THE CATEGORY IS NOT USED AT ALL AND CAN BE
			// DELETED SAFELY
			res.status(200).send({ api_msg: "category not used", canDelete: "yes" });
		}
	}
	else {
		res.status(200).send({ api_msg: "category in use", canDelete: "no" })
	}
}));

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

	dbconn.query(sqlGetQuery, function(err, results, fields){
		if (err) {
			res.status(200).json({ api_msg: 'MySQL ' + err});
			// console.log(err);
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
 * Restaurant Status retrieval																*
 ****************************************************************************
 * GET route will get the information based on the rgm's username
 */


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
	.get(asyncHandler(async(req, res) => {
		// Firstly, we get the username of the RGM of the restaurant
		const { username } = res.locals.userData;

		// Then, we construct the sql query with the username in mind.
		var sqlQuery = 'SELECT * FROM restaurant ';
		sqlQuery += `WHERE rest_rgm_username="${username}"`;

		// Query the db and return the said fields to the frontend app
		const profileInfo = await new Promise((resolve, reject) => {
			dbconn.query(sqlQuery, function (err, results, fields) {
				if (err) {
					console.log(err);
					reject(err);
				}
				else {
					resolve(results[0]);
				}
			});
		});

		// For this purpose, we should be creating a template to send back to the frontend
		// based on the information that is needed to be displayed.
		// 1. First, understand that the results form both tables together.
		// 2. We need to transform 2 things:
		//		- Time
		var rest_op_hours = datetime_T.transform(profileInfo.rest_opening_time, 'HH:mm:ss', 'hh:mm A');
		rest_op_hours += ' to ' + datetime_T.transform(profileInfo.rest_closing_time, 'HH:mm:ss', 'hh:mm A');

		//		- Tags
		var rest_tags = [];

		if (profileInfo.rest_tag_1) 
			rest_tags.push(profileInfo.rest_tag_1);

		if (profileInfo.rest_tag_2) 
			rest_tags.push(profileInfo.rest_tag_2);

		if (profileInfo.rest_tag_3) 
			rest_tags.push(profileInfo.rest_tag_3);

		// 3. Then we send the other necessary information together with it back to the frontend
		// in json format
		var restaurantProfileData = {
			restaurant_ID: profileInfo.restaurant_ID,
			restaurant_name: profileInfo.restaurant_name,
			rest_banner_ID: profileInfo.rest_banner_ID ?? "no_file.png",
			rest_op_hours: rest_op_hours,
			rest_phone_no: profileInfo.rest_phone_no,
			rest_email: profileInfo.rest_email,
			rest_address_info: profileInfo.rest_address_info ?? "NIL",
			rest_postal_code: profileInfo.rest_postal_code ?? 0,
			rest_tags: rest_tags,
			rest_status: profileInfo.rest_status ,
			rest_opening_time: profileInfo.rest_opening_time,
			rest_closing_time: profileInfo.rest_closing_time,
			rest_tag_1: profileInfo.rest_tag_1 ?? "NIL", 
			rest_tag_2: profileInfo.rest_tag_2 ?? "NIL",
			rest_tag_3: profileInfo.rest_tag_3 ?? "NIL"
		}

		// console.log(restaurantProfileData);
		// res.status(200).json(restaurantProfileData);

		// Image conversion to base64
		const pathName = process.env.ASSETS_SAVE_LOC + 'rest_banners/' + profileInfo.rest_banner_ID;

		// Check if path exist. If yes, great, otherwise send an err image instead
		// Of course, we use our favourite promises
		const imagebase64 = await new Promise((resolve, reject) => {
			fs.access(pathName, fs.F_OK, (err) => {
				if (err) {
					// Console log the err
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

		restaurantProfileData['banner_base64'] = imagebase64;
		res.status(200).send(restaurantProfileData);
	}))
	.put(bannerUpload.single('bannerImage'), (req, res) => {
		// Updating of the restaurant's profile
		const { username } = res.locals.userData;
		// 1. Upon receiving all the data from the edit form, we need to check for
		// any new picture uploaded by the restaurant manager
		// So lets get all the data from the req body
		const {
			file, 
			body: {
				originalImageID, restaurantName, phoneNo, email, address, postal_code, 
				opening_time, closing_time, tags
			}
		} = req

		// Transforms string to Array
		const tagsArray = tags.split(",");

		console.log(file, req.body);

		if (file) {
			var sqlUpdateQuery = `UPDATE restaurant SET restaurant_name="${restaurantName}",`;
			sqlUpdateQuery += `rest_banner_ID="${file.filename}",rest_phone_no=${phoneNo},`;
			sqlUpdateQuery += `rest_email="${email}",rest_address_info="${address}",`;
			sqlUpdateQuery += `rest_postal_code=${postal_code},rest_opening_time="${opening_time}",`;
			sqlUpdateQuery += `rest_closing_time="${closing_time}"`;
			
			if (tagsArray[0]) 
				sqlUpdateQuery += `,rest_tag_1="${tagsArray[0]}"`;
			
			if (tagsArray[1]) 
				sqlUpdateQuery += `,rest_tag_2="${tagsArray[1]}"`;
			
			if (tagsArray[2]) 
				sqlUpdateQuery += `,rest_tag_3="${tagsArray[2]}"`;

			sqlUpdateQuery += ` WHERE rest_rgm_username="${username}"`;

			// Path of original file
			const pathName = process.env.ASSETS_SAVE_LOC + 'rest_banners/' + originalImageID ;

			// Check if the file exist, if yes delete the old file first then save into MySQL
			if(fs.existsSync(path.resolve(pathName))) {
				// fs.unlink deletes old file
				fs.unlink(path.resolve(pathName), (err) => {
					if (err) 
						return res.status(200).json({ api_msg: 'Error deleteing the file' }); 
					else {
						dbconn.query(sqlUpdateQuery, function(err, results, fields){
							if (err) {
								res.status(200).json({ api_msg: "MySql " + err});
							}
							else {
								res.status(200).send({ api_msg: "There's a file. Update successful!" });
							}
						});	
					}
				});
			}
			else {
				dbconn.query(sqlUpdateQuery, function(err, results, fields){
					if (err) {
						res.status(200).json({ api_msg: "MySql " + err});
					}
					else {
						res.status(200).send({ api_msg: "There's a file. Update successful!" });
					}
				});
			}
		}
		else {
			var sqlUpdateQuery = `UPDATE restaurant SET restaurant_name="${restaurantName}",`;
			sqlUpdateQuery += `rest_phone_no=${phoneNo},`;
			sqlUpdateQuery += `rest_email="${email}",rest_address_info="${address}",`;
			sqlUpdateQuery += `rest_postal_code=${postal_code},rest_opening_time="${opening_time}",`;
			sqlUpdateQuery += `rest_closing_time="${closing_time}"`;
			
			if (tagsArray[0]) 
				sqlUpdateQuery += `,rest_tag_1="${tagsArray[0]}"`;
			
			if (tagsArray[1]) 
				sqlUpdateQuery += `,rest_tag_2="${tagsArray[1]}"`;
			
			if (tagsArray[2]) 
				sqlUpdateQuery += `,rest_tag_3="${tagsArray[2]}"`;

			sqlUpdateQuery += ` WHERE rest_rgm_username="${username}"`;
			
			dbconn.query(sqlUpdateQuery, function(err, results, fields){
				if (err) {
					res.status(200).json({ api_msg: "MySql " + err});
				}
				else {
					res.status(200).send({ api_msg: "There's no file. Update successful!" });
				}
			});
		}
		// 2. Also need to see if the Date object received can be inserted into the
		// MySQL database
		// 3. We can then construct the query accordingly
		// 4. Try the query and see if it is successful. If yes return success api_msg

	})
	.post(bannerUpload.single('bannerImage'), asyncHandler(async(req, res, next) => {
		// This post route is for first login / firstLog / firstLogin 
		// 1. Get username from the token
		const { username } = res.locals.userData;
		
		// 2. Get the other data from the req (including filename and fields)
		const { 
			file, body: {
				address,
				postalCode,
				tags,
				openingTime,
				closingTime
			}
		} = req;

		console.log(req.body);

		const tagsArray = tags.split(",");

		// 3. Update the table with all the data gotten.
		var sqlUpdateQuery = `UPDATE restaurant SET `;

		if (file) {
			sqlUpdateQuery += `rest_banner_ID="${file.filename}",`;
		}

		sqlUpdateQuery += `rest_address_info="${address}",rest_postal_code=${postalCode},rest_status="closed",`

		if (tagsArray[0]) {
			sqlUpdateQuery += `rest_tag_1="${tagsArray[0]}",`;
		}

		if (tagsArray[1]) {
			sqlUpdateQuery += `rest_tag_2="${tagsArray[1]}",`;
		}

		if (tagsArray[2]) {
			sqlUpdateQuery += `rest_tag_3="${tagsArray[2]}",`;
		}

		sqlUpdateQuery += `rest_opening_time="${openingTime}",rest_closing_time="${closingTime}" `
		sqlUpdateQuery += `WHERE rest_rgm_username="${username}"`;

		const updateResponse = await new Promise((resolve, reject) => {
			dbconn.query(sqlUpdateQuery, function(err, results, fields){
				if (err) {
					console.log(err);
					resolve({ status: "fail" });
				}
				else {
					resolve({ status: "success" });
				}
			});
		});

		// Also insert into the db the reservation settings, but we will need to get the restID first
		var sqlQueryRestID = `SELECT restaurant_ID FROM restaurant `;
		sqlQueryRestID += `WHERE rest_rgm_username="${username}"`;

		const restID = await new Promise((resolve, reject) => {
			dbconn.query(sqlQueryRestID, function(err, results, fields){
				if (err) {
					reject(err);
				}
				else {
					resolve(results[0].restaurant_ID);
				}
			})
		});

		// Query to make the reservation settings
		var sqlCreateResSettings = "INSERT INTO `rest_reservation_setting`(`rrs_rest_ID`, `reservation_interval`, "
		sqlCreateResSettings += "`reservation_starttime`, `reservation_endtime`, `max_tables`) " 
		sqlCreateResSettings += `VALUES (${restID}, 1, "${openingTime}", "${closingTime}", 4)`

		const createResponse = await new Promise((resolve, reject) => {
			dbconn.query(sqlCreateResSettings, function(err, results, fields){
				if (err) {
					console.log(err);
					reject(err);
				}
				else {
					resolve({ status: "success" });
				}
			})
		});

		if (updateResponse.status == "success" && createResponse.status == "success") {
			res.status(200).send({ api_msg: "Restaurant First Login settings successful!" });
		}
		
		// var sqlUpdateQuery = `UPDATE rest_reservation_setting SET `;
		// sqlUpdateQuery += `reservation_starttime="${startTime}", reservation_endtime="${endTime}", `;
		// sqlUpdateQuery += `reservation_interval=${reservationIntervals}, max_tables=${noOfTables} `;
		// sqlUpdateQuery += `WHERE rrs_ID=${settingsID}`;
	}));

/****************************************************************************
 * Retrieve all available Restaurant Tags																		*
 ****************************************************************************
 */
router.get('/tags', (req, res) => {
		// Then construct the sql query based on username to get restaurant_ID
		var sqlQuery = `SELECT restaurant_tag FROM rest_tags `;

		// Query the db and return the said fields to the frontend app
		dbconn.query(sqlQuery, function (err, results, fields) {
			if (err) {
				res.status(200).json({ api_msg: 'MySQL err: ' + err });
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

	// Set the file's name
	var filename = "no_file.png";
	
	if (file) {
		filename = file.filename;
	}
	
	// Console log for testing, please comment out when done
	// console.log("restaurant.js line 196 ", file, req.body);

	var sqlQueryRestID = `SELECT restaurant_ID FROM restaurant `;
	sqlQueryRestID += `WHERE rest_rgm_username="${username}"`;

	dbconn.query(sqlQueryRestID, function(err, results, fields){
		if (err) {
			res.status(200).send('MySQL err: ' + err);
			// console.log(err);
		}
		else {
			// 3. Once selected, then we'll use that ID to retrieve everything else
			const rest_ID = results[0].restaurant_ID;

			// Construct insert sqlQuery 
			var sqlQuery = 'INSERT INTO `rest_item`(`ri_rest_ID`, `ri_cat_ID`, `item_name`, `item_png_ID`, ';
			sqlQuery += ' `item_desc`, `item_allergen_warning`, `item_price`, `item_availability`) ';
			sqlQuery += `VALUES (${rest_ID}, ${itemCategory}, "${itemName}", "${filename}", `;
			sqlQuery += `"${itemDesc}", "${itemAllergy}", ${itemPrice}, ${itemAvailability})`;

			// Make sqlQuery
			dbconn.query(sqlQuery, function(err, results, fields) {
				if (err) {
					//console.log(err);
					res.status(200).send('MySQL err: ' + err);
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

		dbconn.query(sqlGetQuery, function(err, results, fields){
			if (err) {
				res.status(200).json({ api_msg: "MySQL " + err });
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
			
			// 4. Save all the new variables into the database
			// First we find the path once again
			const pathName = process.env.ASSETS_SAVE_LOC + `rest_items_png/${itemPngID}`;

			// Once delete, we can proceed to save the data into the database
			// console.log(path.resolve(pathName));

			// 3. If there is a new file, delete the old file
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
						dbconn.query(sqlUpdateQuery, function(err, results, fields){
							if (err) {
								res.status(200).json({ api_msg: 'Update err, double check for when new image is uploaded!' }); 
							}
							else {
								res.status(200).json({ api_msg: `Item updated! NOTE: New image found! Old image deleted.` });
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
				dbconn.query(sqlUpdateQuery, function(err, results, fields){
					if (err) {
						res.status(200).json({ api_msg: "Update err, double check for when new image is uploaded!" }); 
					}
					else {
						res.status(200).json({ api_msg: `Updated item name ${itemName}! NOTE: New image uploaded!` });
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
			dbconn.query(sqlUpdateQuery, function(err, results, fields){
				if (err) {
					res.status(200).json({ api_msg: "Update err, double check for when no image and only data is updated" }); 
				}
				else {
					res.status(200).json({ api_msg: `Item updated!` });
				}
			});
		}
	})
	.delete((req, res) => {
		// NOTE: Since itemID is unique and independent of all other IDs, the MySQL query simply
		// needs to find that ID and delete it
		const itemID = req.params.itemid

		var sqlDeleteQuery = 'UPDATE rest_item SET item_availability=2 ';
		sqlDeleteQuery += `WHERE ri_item_ID=${itemID}`;

		dbconn.query(sqlDeleteQuery, function(err, results, fields) {
			if (err) {
				res.status(200).json({ api_msg: 'MySQL ' + err });
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
router.route('/restaurantStatus')
	.get((req, res) => {
		// To get the restaurant's status we just need to get to the restaurant table 
		// and match it to the restaurant's status
		// 1. First step is to get username from the middleware
		const { username } = res.locals.userData;

		// 2. Then we construct the query
		var sqlGetQuery = `SELECT rest_status FROM restaurant `;
		sqlGetQuery += `WHERE rest_rgm_username="${username}"`;
		
		// 3. Then after that we make the dbconn
		dbconn.query(sqlGetQuery, function(err, results, fields){
			if (err) {
				res.status(200).json({ api_msg: "MySQL " + err });
			}
			else {
				// 4. Return the restaurant's status
				res.status(200).send(results[0].rest_status);
			}
		})
	})
	.put((req, res) => {
		// To get the restaurant's status we just need to get to the restaurant table 
		// and match it to the restaurant's status
		// 1. First step is to get username from the middleware
		const { username } = res.locals.userData;
		const { restStatus } = req.body;

		// 2. Then we construct the query
		var sqlGetQuery = `UPDATE restaurant SET rest_status="${restStatus}" `;
		sqlGetQuery += `WHERE rest_rgm_username="${username}"`;
		
		// 3. Then after that we make the dbconn
		dbconn.query(sqlGetQuery, function(err, results, fields){
			if (err) {
				console.log(err);
				res.status(200).json({ api_msg: "MySQL " + err });
			}
			else {
				// 4. Return the restaurant's status
				res.status(200).send({ api_msg: "success" });
			}
		})
	})

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

	dbconn.query(sqlQuery, function(err, results, fields){
		if (err) {
			res.status(200).send({ api_msg: "MySQL " + err });
		}
		else {
			// 2. Using the ID, we get all the subusers
			const rest_ID = results[0].restaurant_ID;

			var sqlGetQuery = `SELECT subuser_ID, subuser_rest_ID, subuser_username, `;
			sqlGetQuery += ` first_name, last_name, phone_no, email, subuser_type `;
			sqlGetQuery += `FROM restaurant_subuser WHERE subuser_rest_ID=${rest_ID}`;

			// 3. With that we can return the whole result query from the SQL, and then
			// we'll parse the data accordingly with an async function at the frontend
			dbconn.query(sqlGetQuery, function(err, results, fields){
				if (err) {
					res.status(200).send({ api_msg: "MySQL " + err });
				}
				else {
					// Transform the results first before sending the data to the frontend
					var subuser_array = [];

					for (let subuser of results) {
						var temp_json = {
							id: subuser.subuser_ID,
							username: subuser.subuser_username,
							name: subuser.first_name + " " + subuser.last_name,
							type: subuser.subuser_type,
							userID: subuser.subuser_ID,
							fname: subuser.first_name,
							lname: subuser.last_name,
							email: subuser.email,
							phoneNo: subuser.phone_no
						};

						subuser_array.push(temp_json);
					}
					
					res.status(200).send(subuser_array);
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

	// console.log(req.body);

	var sqlGetQuery = `SELECT restaurant_ID, restaurant_name FROM restaurant `;
	sqlGetQuery += `WHERE rest_rgm_username="${username}"`;

	dbconn.query(sqlGetQuery, function(err, results, fields){
		if (err) {
			res.status(200).send({ api_msg: "MySQL " + err });
		}
		else {
			// 2. Once we get the restaurant ID, we can then construct a POST query to create the new
			// user. We must generate a default password for that user as well and create a user in the
			// app_user table
			// Get restaurant ID and name
			const { restaurant_ID, restaurant_name } = results[0];
			// console.log(restaurant_ID, restaurant_name);
			
			// Generate a default password
			const subuser_pw = default_pw;
			
			// Create new user in app_user
			var sqlPostQuery = "INSERT INTO app_user(`username`, `user_password`, `user_type`, `account_status`)";
			sqlPostQuery += `VALUES ("${subuser_username}", "${subuser_pw}", "${role}", "first")`;

			dbconn.query(sqlPostQuery, function(err, results, fields){
				if (err) {
					res.status(200).send({ api_msg: "MySQL " + err });
				}
				else {
					if (results.affectedRows > 0) {
						// Insert successful, proceed on with the profile creation
						var sqlProfilePostQuery = "INSERT INTO restaurant_subuser(`subuser_rest_ID`, `subuser_username`, "
						sqlProfilePostQuery += "`first_name`, `last_name`, `phone_no`, `email`, `subuser_type`) ";
						sqlProfilePostQuery += `VALUES (${restaurant_ID}, "${subuser_username}", "${fname}", "${lname}", `
						sqlProfilePostQuery += `${phone}, "${email}", "${role}")`

						dbconn.query(sqlProfilePostQuery, function(err, results, fields){
							if (err) {
								console.log(err) 
								res.status(200).send({ api_msg: "fail" });
							}
							else {
								// 3. Once done with that, we send an email to the subuser with the login details
								// sendSubUserEmail calls a template
								sendSubUserEmail(subuser_username, subuser_pw, email, restaurant_name)
									.then((mailOptions) => {
										// Call the sendMail transporter
										sendMail(mailOptions)
											.then((response) => {
												// Console log
												console.log(timestamp + `Send mail has been triggered successfully for adding subuser ${subuser_username}`);

												// send response back to frontend
												res.status(200).send({ api_msg: "success" });
											})
											.catch(err => console.log(err));
									})
									.catch(err => console.log(err));								
							}
						}); // Closed for third query
					}
				}
			}); // Close for second Query
		}
	}); // Close first query
});

/****************************************************************************
 * RGM edit details of subuser																							*
 ****************************************************************************
 * The idea for this part is to allow the RGM to change the role of the subuser
 * or other details if that is ever required
 */
router.route('/rgm/subuser/:subuser_ID')
	.get((req, res) => {
		// constructing the sql query
		var sqlGetQuery = `SELECT subuser_ID, subuser_rest_ID, subuser_username, `;
		sqlGetQuery += ` first_name, last_name, phone_no, email, subuser_type `;
		sqlGetQuery += `FROM restaurant_subuser WHERE subuser_ID=${req.params.subuser_ID}`;

		dbconn.query(sqlGetQuery, function(err, results, fields){
			if (err) {
				res.status(200).send({ api_msg: "MySQL " + err });
			}
			else {
				res.status(200).send(results[0]);
			}
		});
	})
	.put((req, res) => {
		// Get some useful constants
		const subUserID = req.params.subuser_ID;
		const {
			username, fname, lname, email, phone, role
		} = req.body;

		// console.log(subUserID);
		// console.log(req.body);

		// 1. Construct the update query
		var updateQuery = "UPDATE restaurant_subuser SET "
		updateQuery += `first_name="${fname}",last_name="${lname}",phone_no=${phone},email="${email}",subuser_type="${role}" ` 
		updateQuery += `WHERE subuser_ID=${subUserID}`

		dbconn.query(updateQuery, function(err, results, fields){
			if (err) {
				console.log(err);
				res.status(200).send({ api_msg: "fail" });
			}
			else {
				res.status(200).send({ api_msg: "success" });
			}
		})
	})
	.delete((req, res) => {
		// 1. Construct the delete query 
		// DELETE FROM `restaurant_subuser` WHERE `subuser_ID`=2
		// Get some useful constants
		const subUserID = req.params.subuser_ID;
		const {
			username
		} = req.body;

		// 1. Construct the update query
		var sqlDeleteQuery = `DELETE FROM app_user WHERE username="${username}"`

		dbconn.query(sqlDeleteQuery, function(err, results, fields){
			if (err) {
				console.log(err);
				res.status(200).send({ api_msg: "fail" });
			}
			else {
				console.log(timestamp + `Subuser with ${username} deleted successfully`)
				res.status(200).send({ api_msg: "success" });
			}
		})
	});

/****************************************************************************
 * Everything below is for the subuser 																			*
 ***************************************************************************
 * Subuser covers for the Deliveries Manager and Reservations Manager
 * */

/****************************************************************************
 * Deliveries Manager (DM): Retrieve all the pending delivery 
 * orders for that restaurant             
 ****************************************************************************/
router.get('/pendingdeliveryorders', asyncHandler(async(req, res) => {
	// Save the restaurantID first from the URL
	const { username } = res.locals.userData;

  // 1. Get the restaurant's ID from the restaurant_subuser table
	var sqlGetIDQuery = `SELECT subuser_rest_ID FROM restaurant_subuser `;
  sqlGetIDQuery += `WHERE subuser_username="${username}"`;

	const restID = await new Promise((resolve, reject) => {
		dbconn.query(sqlGetIDQuery, function(err, results, fields){
			if (err) {
				console.log(timestamp + err);
				reject(err); // THIS WILL ENSURE THE ROUTE RUNS 
			}
			else {
				if (results[0]) 
					resolve(results[0].subuser_rest_ID);
				else 
					resolve(0); // THIS WILL ENSURE THE ROUTE RUNS 
			}
		});
	});

	// 2. Use that to get all the orders belonging to that restaurant
	var sqlGetQuery = `SELECT * FROM delivery_order `
	sqlGetQuery += `WHERE o_rest_ID=${restID} AND order_status="Pending"`;

	const pendingDOs = await new Promise((resolve, reject) => {
		dbconn.query(sqlGetQuery, function(err, results, fields){
			if (err) {
				console.log(timestamp + err);
				reject(err); // THIS WILL ENSURE THE ROUTE RUNS 
			}
			else {
				resolve(results);
			}
		})
	});
	
	// 3. After getting all the pending orders, we can then get the do_items from the
	// do_item table
	var tempOrdersArray = [];

	for (let order of pendingDOs) {
		// GET ITEMS QUERY
		var sqlGetItems = `SELECT * FROM do_item `;
		sqlGetItems += `WHERE do_order_ID="${order.order_ID}"`;

		const doItems = await new Promise((resolve, reject) => {
			dbconn.query(sqlGetItems, function(err, results, fields){
				if (err) {
					console.log(timestamp + err);
					reject(err);
				}
				else{
					resolve(results);
				}
			}); // CLOSING THE DB QUERY
		}); // CLOSING THE PROMISE

		var tempJSON = {
			orderID: order.order_ID,
			restID: order.o_rest_ID,
			customerName: order.o_cust_name,
			address: order.delivery_address + " S(" + order.delivery_postal_code + ")",
			price: order.total_cost,
			status: order.order_status,
			items: doItems
		}

		tempOrdersArray.push(tempJSON);
	}

	// 4. Put that all into an array and then return it to the frontend
	res.status(200).send(tempOrdersArray);
}));

/****************************************************************************
 * Deliveries Manager (DM):  Retrieve all the ongoing delivery 
 * orders for that restaurant           
 ****************************************************************************/
router.get('/ongoingdeliveryorders', asyncHandler(async(req, res) => {
	// Save the restaurantID first from the URL
	const { username } = res.locals.userData;

  // 1. Get the restaurant's ID from the restaurant_subuser table
  var sqlGetIDQuery = `SELECT subuser_rest_ID FROM restaurant_subuser `;
  sqlGetIDQuery += `WHERE subuser_username="${username}"`;

	const restID = await new Promise((resolve, reject) => {
		dbconn.query(sqlGetIDQuery, function(err, results, fields){
			if (err) {
				console.log(timestamp + err);
				reject(err); // THIS WILL ENSURE THE ROUTE RUNS 
			}
			else {
				if (results[0]) 
					resolve(results[0].subuser_rest_ID);
				else 
					resolve(0); // THIS WILL ENSURE THE ROUTE RUNS 
			}
		});
	});

  // 2. Use that to get all the orders belonging to that restaurant
	var sqlGetQuery = `SELECT * FROM delivery_order `
	sqlGetQuery += `WHERE o_rest_ID=${restID} AND order_status IN ("Preparing", "Delivering") `;
	sqlGetQuery += `ORDER BY order_status ASC`;

	const ongoingDOs = await new Promise((resolve, reject) => {
		dbconn.query(sqlGetQuery, function(err, results, fields){
			if (err) {
				console.log(timestamp + err);
				reject(err); // THIS WILL ENSURE THE ROUTE RUNS 
			}
			else {
				resolve(results);
			}
		})
	});
	
	// 3. After getting all the pending orders, we can then get the do_items from the
	// do_item table
	var tempOrdersArray = [];

	for (let order of ongoingDOs) {
		// GET ITEMS QUERY
		var sqlGetItems = `SELECT * FROM do_item `;
		sqlGetItems += `WHERE do_order_ID="${order.order_ID}"`;

		const doItems = await new Promise((resolve, reject) => {
			dbconn.query(sqlGetItems, function(err, results, fields){
				if (err) {
					console.log(timestamp + err);
					reject(err);
				}
				else{
					resolve(results);
				}
			}); // CLOSING THE DB QUERY
		}); // CLOSING THE PROMISE

		var tempJSON = {
			orderID: order.order_ID,
			restID: order.o_rest_ID,
			customerName: order.o_cust_name,
			address: order.delivery_address + " S(" + order.delivery_postal_code + ")",
			price: order.total_cost,
			status: order.order_status,
			items: doItems
		}

		tempOrdersArray.push(tempJSON);
	}

	// 4. Put that all into an array and then return it to the frontend
	res.status(200).send(tempOrdersArray);
}));

/****************************************************************************
 * Deliveries Manager (DM): Retrieve all the fufilled delivery 
 * orders for that restaurant            
 ****************************************************************************/
router.get('/fulfilledorders', asyncHandler(async(req, res) => {
	// Save the username from the token middleware
	const { username } = res.locals.userData;

  // 1. Get the restaurant's ID from the restaurant_subuser table
  var sqlGetIDQuery = `SELECT subuser_rest_ID FROM restaurant_subuser `;
  sqlGetIDQuery += `WHERE subuser_username="${username}"`;

  const restID = await new Promise((resolve, reject) => {
		dbconn.query(sqlGetIDQuery, function(err, results, fields){
			if (err) {
				console.log(timestamp + err);
				reject(err); // THIS WILL ENSURE THE ROUTE RUNS 
			}
			else {
				if (results[0]) 
					resolve(results[0].subuser_rest_ID);
				else 
					resolve(0); // THIS WILL ENSURE THE ROUTE RUNS 
			}
		});
	});

  // 2. Use that to get all the orders belonging to that restaurant
	var sqlGetQuery = `SELECT * FROM delivery_order `
	sqlGetQuery += `WHERE o_rest_ID=${restID} AND order_status IN ("fulfilled") `;
	sqlGetQuery += `ORDER BY o_datetime`;

	const fulfilledDOs = await new Promise((resolve, reject) => {
		dbconn.query(sqlGetQuery, function(err, results, fields){
			if (err) {
				console.log(timestamp + err);
				reject(err); // THIS WILL ENSURE THE ROUTE RUNS 
			}
			else {
				resolve(results);
			}
		})
	});
	
	// 3. After getting all the pending orders, we can then get the do_items from the
	// do_item table
	var tempOrdersArray = [];

	for (let order of fulfilledDOs) {
		// GET ITEMS QUERY
		var sqlGetItems = `SELECT * FROM do_item `;
		sqlGetItems += `WHERE do_order_ID="${order.order_ID}"`;

		const doItems = await new Promise((resolve, reject) => {
			dbconn.query(sqlGetItems, function(err, results, fields){
				if (err) {
					console.log(timestamp + err);
					reject(err);
				}
				else{
					resolve(results);
				}
			}); // CLOSING THE DB QUERY
		}); // CLOSING THE PROMISE

		var tempJSON = {
			orderID: order.order_ID,
			restID: order.o_rest_ID,
			customerName: order.o_cust_name,
			address: order.delivery_address + " S(" + order.delivery_postal_code + ")",
			price: order.total_cost,
			status: order.order_status,
			items: doItems
		}

		tempOrdersArray.push(tempJSON);
	}

	// 4. Put that all into an array and then return it to the frontend
	res.status(200).send(tempOrdersArray);
}));

/****************************************************************************
 * Deliveries Manager (DM): Updates order status for order
 ****************************************************************************/
router.get('/updateorderstatus/:orderID/:orderStatus', (req, res) => {
	// Save the restaurantID first from the URL
	const { username } = res.locals.userData;
  const orderID = req.params.orderID;
	const orderStatus = req.params.orderStatus;

	console.log(orderID, orderStatus);

  // 1. Get the customer's ID from the customer_users table
  var sqlGetIDQuery = `UPDATE delivery_order SET order_status="${orderStatus}" `;
  sqlGetIDQuery += `WHERE order_ID="${orderID}"`;

  dbconn.query(sqlGetIDQuery, function(err, results, fields){
    if (err) {
      res.status(200).send({ api_msg: "MySQL " + err });
    }
    else{
      res.status(200).send({ api_msg: `Successful update for Delivery Order ID ${orderID}` });
    }
  }) // close first query
});

/****************************************************************************
 * Reservations Manager (RM): Retrieve all pending reservations
 ****************************************************************************/
router.get('/pendingreservations', asyncHandler(async (req, res, next) => {
	// Get the username first from the token
	const { username } = res.locals.userData;

	// Other important variables
	var reservationsArray = [];

	// We're trying a new way of retrieving all the data, so that the server send the data back
	// already transformed and we treat it as a result OK status response
	// 1. First we need to get the restaurant's ID 
	var sqlGetIDQuery = `SELECT subuser_rest_ID FROM restaurant_subuser `;
  sqlGetIDQuery += `WHERE subuser_username="${username}"`;

	const subuser_query_results = await new Promise((resolve, reject) => {
		dbconn.query(sqlGetIDQuery, function(err, results, fields) {
			if (err) {
				console.log(err);
				reject(err);
			}
			else {
				resolve(results[0]);
			}
		});
	});

	const restID = subuser_query_results.subuser_rest_ID;
	
	// 2. With the restaurant ID, we can then select all the details from the reservation's table
	// and construct a temp JSON, and also save the reservation ID
	// First check for the date today
	var sqlGetReservations = `SELECT * FROM cust_reservation WHERE cr_rest_ID=${restID} `;
	sqlGetReservations += `AND DATE(cr_date) >= DATE(NOW()) `
	sqlGetReservations += `AND cr_status="Pending" `;
	sqlGetReservations += `ORDER BY cr_date`;

	const reservations = await new Promise((resolve, reject) => {
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

	// 3. With the reservation ID, we can then get the IDs by looking for the pre-order ID (if any)
	// and then construct an items array to send back in an array.
	for (let reservation of reservations) {
		// console.log(reservation);
		const reservation_ID = reservation.cust_reservation_ID;

		// Gets all the PO items
		var sqlGetPOItems = `SELECT * FROM pre_order JOIN pre_order_item `;
		sqlGetPOItems += `ON po_crID=poi_crID `;
		sqlGetPOItems += `WHERE po_crID="${reservation_ID}"`;

		// Await query for the items
		const po_items = await new Promise((resolve, reject) => {
			dbconn.query(sqlGetPOItems, function(err, results, fields) {
				if (err) { 
					console.log(err);
					reject(err);
				}
				else {
					resolve(results);
				}
			});
		});

		// Some conversions
		// NOTE: Got to convert date to localstring
		const reservationDate = new Date(reservation.cr_date);
		const pattern = datetime_T.compile('ddd, DD MMM YYYY');
		const convertedDate = datetime_T.format(reservationDate, pattern);

		// NOTE: Convert the timeslot to AM PM
		const convertedTime = datetime_T.transform(reservation.cr_timeslot, 'HH:mm:ss', 'h:mm A');

		// Some important Variables
		var tempItemsArray = [];

		if (po_items.length != 0) {
			for (let item of po_items) {
				var tempJSON = {
					itemID: item.poi_rest_item_ID,
					itemName: item.poi_item_name,
					itemPrice: parseFloat(item.poi_item_price).toFixed(2),
					itemQty: item.poi_item_qty,
					itemSO: item.poi_special_order
				}
				tempItemsArray.push(tempJSON);
			}
		}

		if (tempItemsArray.length != 0) {
			// NOTE: since the selected pre-order items will belong to the same PO, it is okay to
			// take just the first result's order details
			var tempJSON = {
				cust_RID: reservation.cust_reservation_ID,
				cust_name: reservation.cr_custname,
				pax: reservation.cr_pax,
				date: convertedDate,
				timeslot: convertedTime,
				po_ID: po_items[0].po_ID,
				po_status: po_items[0].po_status,
				po_total_cost: `$ ${parseFloat(po_items[0].total_cost).toFixed(2)}`,
				po_items: tempItemsArray,
				reservation_status: reservation.cr_status,
				reservation_madeon: reservation.cr_datetime_made
			};
			
			reservationsArray.push(tempJSON);
		}
		else {
			var tempJSON = {
				cust_RID: reservation.cust_reservation_ID,
				cust_name: reservation.cr_custname,
				pax: reservation.cr_pax,
				date: convertedDate,
				timeslot: convertedTime,
				po_total_cost: "NIL",
				po_items: "none",
				reservation_status: reservation.cr_status,
				reservation_madeon: reservation.cr_datetime_made
			};
			
			reservationsArray.push(tempJSON);
		}
	}
	res.status(200).send(reservationsArray);
}));

/****************************************************************************
 * Reservations Manager (RM): Retrieve all accepted reservations
 ****************************************************************************/
router.get('/ongoingreservations', asyncHandler(async (req, res, next) => {
	// Get the username first from the token
	const { username } = res.locals.userData;

	// Other important variables
	var reservationsArray = [];

	// We're trying a new way of retrieving all the data, so that the server send the data back
	// already transformed and we treat it as a result OK status response
	// 1. First we need to get the restaurant's ID 
	var sqlGetIDQuery = `SELECT subuser_rest_ID FROM restaurant_subuser `;
  sqlGetIDQuery += `WHERE subuser_username="${username}"`;

	const subuser_query_results = await new Promise((resolve, reject) => {
		dbconn.query(sqlGetIDQuery, function(err, results, fields) {
			if (err) {
				console.log(err);
				reject(err);
			}
			else {
				resolve(results[0]);
			}
		});
	});

	const restID = subuser_query_results.subuser_rest_ID;
	
	// 2. With the restaurant ID, we can then select all the details from the reservation's table
	// and construct a temp JSON, and also save the reservation ID
	// First check for the date today
	var sqlGetReservations = `SELECT * FROM cust_reservation WHERE cr_rest_ID=${restID} `;
	sqlGetReservations += `AND cr_status="Arrived" `;
	sqlGetReservations += `ORDER BY cr_date`;

	const reservations = await new Promise((resolve, reject) => {
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

	// 3. With the reservation ID, we can then get the IDs by looking for the pre-order ID (if any)
	// and then construct an items array to send back in an array.
	for (let reservation of reservations) {
		// console.log(reservation);
		const reservation_ID = reservation.cust_reservation_ID;

		// Gets all the PO items
		var sqlGetPOItems = `SELECT * FROM pre_order JOIN pre_order_item `;
		sqlGetPOItems += `ON po_crID=poi_crID `;
		sqlGetPOItems += `WHERE po_crID="${reservation_ID}"`;

		// Await query for the items
		const po_items = await new Promise((resolve, reject) => {
			dbconn.query(sqlGetPOItems, function(err, results, fields) {
				if (err) { 
					console.log(err);
					reject(err);
				}
				else {
					resolve(results);
				}
			});
		});

		// Some conversions
		// NOTE: Got to convert date to localstring
		const reservationDate = new Date(reservation.cr_date);
		const pattern = datetime_T.compile('ddd, DD MMM YYYY');
		const convertedDate = datetime_T.format(reservationDate, pattern);

		// NOTE: Convert the timeslot to AM PM
		const convertedTime = datetime_T.transform(reservation.cr_timeslot, 'HH:mm:ss', 'h:mm A');

		// Some important Variables
		var tempItemsArray = [];

		if (po_items.length != 0) {
			for (let item of po_items) {
				var tempJSON = {
					itemID: item.poi_rest_item_ID,
					itemName: item.poi_item_name,
					itemPrice: item.poi_item_price,
					itemQty: item.poi_item_qty,
					itemSO: item.poi_special_order
				}
				tempItemsArray.push(tempJSON);
			}
		}

		if (tempItemsArray.length != 0) {
			// NOTE: since the selected pre-order items will belong to the same PO, it is okay to
			// take just the first result's order details
			var tempJSON = {
				cust_RID: reservation.cust_reservation_ID,
				cust_name: reservation.cr_custname,
				pax: reservation.cr_pax,
				date: convertedDate,
				timeslot: convertedTime,
				po_ID: po_items[0].po_ID,
				po_status: po_items[0].po_status,
				po_total_cost: `$ ${parseFloat(po_items[0].total_cost).toFixed(2)}`,
				po_items: tempItemsArray,
				reservation_status: reservation.cr_status,
				reservation_madeon: reservation.cr_datetime_made
			};
			
			reservationsArray.push(tempJSON);
		}
		else {
			var tempJSON = {
				cust_RID: reservation.cust_reservation_ID,
				cust_name: reservation.cr_custname,
				pax: reservation.cr_pax,
				date: convertedDate,
				timeslot: convertedTime,
				po_total_cost: "NIL",
				po_items: "none",
				reservation_status: reservation.cr_status,
				reservation_madeon: reservation.cr_datetime_made
			};
			
			reservationsArray.push(tempJSON);
		}
	}
	res.status(200).send(reservationsArray);
}));

/****************************************************************************
 * Reservations Manager (RM): Updates reservation status 
 ****************************************************************************/
router.get('/updatereservationstatus/:reservationID/:reservationStatus', (req, res) => {
	// Save the restaurantID first from the URL
	const { username } = res.locals.userData;
  const reservationID = req.params.reservationID;
	const reservationStatus = req.params.reservationStatus;

	console.log(reservationID, reservationStatus);

  // 1. Get the customer's ID from the customer_users table
  var sqlUpdateQuery = `UPDATE cust_reservation SET cr_status="${reservationStatus}" `;
  sqlUpdateQuery += `WHERE cust_reservation_ID="${reservationID}"`;

  dbconn.query(sqlUpdateQuery, function(err, results, fields){
    if (err) {
      res.status(200).send({ api_msg: "MySQL " + err });
    }
    else{
      res.status(200).send({ api_msg: `Successful update for Reservation ${reservationID}` });
    }
  }) // close first query
});

/****************************************************************************
 * Reservations Manager (RM): Updates pre-order status
 ****************************************************************************/
router.get('/updatepostatus/:poid/:postatus', asyncHandler (async (req, res) => {
	// Save the restaurantID first from the URL
	const { username } = res.locals.userData;
  const poid = req.params.poid;
	const postatus = req.params.postatus;

	console.log(poid, postatus);

	// Get the pre-order's customer reservation ID
	var sqlGetCRID = `SELECT po_crID FROM pre_order WHERE po_ID=${poid}`;

	const getResponse = await new Promise((resolve, reject) => {
		dbconn.query(sqlGetCRID, function(err, results, fields){
			if (err) reject(err);
			resolve(results);
		});
	});

	const po_crID = getResponse[0].po_crID;

  // 1. Get the customer's ID from the customer_users table
  var sqlUpdateQuery = `UPDATE pre_order SET po_status="${postatus}" `;
  sqlUpdateQuery += `WHERE po_ID=${poid}`;

  dbconn.query(sqlUpdateQuery, function(err, results, fields){
    if (err) {
      res.status(200).send({ 
				api_msg: "MySQL " + err,
				updateStatus: "fail"
			 });
    }
    else{
      res.status(200).send({ 
				api_msg: `Successful update for reservation ${po_crID} with PO_ID ${poid}`,
				updateStatus: `success`
			 });
    }
  }) // close first query
}));

/****************************************************************************
 * Reservations Manager (RM): Reservation settings things
 ****************************************************************************/
router.route('/reservationSettings')
	.get((req, res) => {
		// Save the restaurantID first from the URL
		const { username } = res.locals.userData;

		// 1. Get the restaurant's ID from the subuser type
		var sqlGetQuery = `SELECT subuser_rest_ID FROM restaurant_subuser `;
		sqlGetQuery += `WHERE subuser_username="${username}"`;

		dbconn.getConnection(function(err, conn){
			if (err) {
				console.log(err); 
				res.status(200).send("MySQL " + err);
			}

			conn.query(sqlGetQuery, function(err, results, fields) {
				if (err) {
					console.log(err);
					res.status(400).send("MySQL " + err);
				}
				else {
					const restID = results[0].subuser_rest_ID;

					// 2. Use this ID to retrieve the reservation settings from MySQL
					var sqlGetSettings = `SELECT * FROM rest_reservation_setting JOIN restaurant `;
					sqlGetSettings += `ON rrs_rest_ID=restaurant_ID WHERE rrs_rest_ID=${restID}`;

					conn.query(sqlGetSettings, function(err, results, fields) {
						if (err) {
							console.log(err);
							res.status(400).send({ 
								api_msg: "Unable to retrieve settings.",
								mysql_err: err
							});
						}
						else {
							var tempJSON = {
								rest_opening_time: results[0].rest_opening_time, 
								rest_closing_time: results[0].rest_closing_time, 
								rrs_ID: results[0].rrs_ID, 
								rrs_rest_ID: results[0].rrs_rest_ID, 
								reservation_interval: results[0].reservation_interval, 
								reservation_starttime: results[0].reservation_starttime, 
								reservation_endtime: results[0].reservation_endtime, 
								max_tables: results[0].max_tables
							}
							res.status(200).send(tempJSON);
							conn.release();
						}
					}); // Close nested Query
				}
			}); // Close first query
		}); // Get an open connection	
	})
	.put((req,res) => {
		// Get some constants from the req parameters
		const {
			settingsID, restID, startTime, endTime, reservationIntervals, noOfTables
		} = req.body

		console.log(req.body);

		// First we verify that the restaurant's opening and closing time has not been exceeded and also
		// make sure that the selected starttime and end time is okay

		var sqlUpdateQuery = `UPDATE rest_reservation_setting SET `;
		sqlUpdateQuery += `reservation_starttime="${startTime}", reservation_endtime="${endTime}", `;
		sqlUpdateQuery += `reservation_interval=${reservationIntervals}, max_tables=${noOfTables} `;
		sqlUpdateQuery += `WHERE rrs_ID=${settingsID}`;

		dbconn.query(sqlUpdateQuery, function(err, results, fields) {
			if (err) console.log(err);

			// Check results
			console.log(results);
			res.status(200).send({ api_msg: "success" });
		})
	})

/****************************************************************************
 * Retrieve delivery statistics for restaurant
 ****************************************************************************
 */
router.get('/rgm/getdeliverystatistics', asyncHandler(async(req, res, next) => {
	// Get the usual constants
	const { username } = res.locals.userData;
	const { startDate, endDate } = req.query;

	// Restrieve the restaurant ID from the restaurant table
	var sqlGetIDQuery = `SELECT restaurant_ID FROM restaurant WHERE rest_rgm_username="${username}"`

	const restID = await new Promise((resolve, reject) => {
		dbconn.query(sqlGetIDQuery, function(err, results, fields){
			if(err) {
				console.log(err);
				reject(err);
				next();
			}
			else {
				resolve(results[0].restaurant_ID);
			}
		})
	})

	// 1. With the two dates, we can get the range that the restaurant manager wants to see
	// Therefore we convert them to the useable format first
	const convertedStartDate = datetime_T.format(new Date(startDate), 'YYYY-MM-DD HH:mm:ss');
	const convertedEndDate = datetime_T.format(new Date(endDate), 'YYYY-MM-DD HH:mm:ss');

	// console.log(convertedStartDate, convertedEndDate);

	var statsQuery = `SELECT DATE(o_datetime) AS date, COUNT(*) AS count, SUM(total_cost) AS sum FROM delivery_order `;
	statsQuery += `WHERE o_datetime BETWEEN "${convertedStartDate}" AND "${convertedEndDate}" `
	statsQuery += `AND o_rest_ID=${restID} `
	statsQuery += `GROUP BY DATE(o_datetime) ORDER BY DATE(o_datetime)`;

	const statsResponse = await new Promise((resolve, reject) => {
		dbconn.query(statsQuery, function(err, results, fields){
			if (err) {
				reject(err);
			}
			else {
				// console.log(results);
				resolve(results);
			}
		})
	})

	var doStatsArray = [];
	var totalEarnings = 0;

	for (let stat of statsResponse) {
		const tempJSON = {
			dateValue: datetime_T.format(new Date(stat.date), "YYYY-MM-DD"),
			count: stat.count,
			dailyEarnings: stat.sum
		}
		// Total Cost
		totalEarnings += stat.sum;

		doStatsArray.push(tempJSON);
	}

	// Get the most popular item

	var sqlDOQuery = `SELECT order_ID FROM delivery_order `;
	sqlDOQuery += `WHERE o_datetime BETWEEN "${convertedStartDate}" AND "${convertedEndDate}" `
	sqlDOQuery += `AND o_rest_ID=${restID}`;

	const doQueryResponse = await new Promise((resolve, reject) => {
		dbconn.query(sqlDOQuery, function(err, results, fields){
			if (err) {
				reject(err);
			}
			else {
				// First we put all the orders into an array
				var tempArray = [];

				for (let doItem of results) {
					tempArray.push(`"${doItem.order_ID}"`);
				}

				resolve(tempArray);
			}
		})
	})

	// Now we find the most popular item
	if (doQueryResponse.length != 0) {
		var itemsQuery = `SELECT do_item_name AS itemName, SUM(do_item_qty) AS sum FROM do_item `;
		itemsQuery += `WHERE do_order_ID IN (${doQueryResponse.toString()}) `;
		itemsQuery += `GROUP BY do_item_name ORDER BY sum DESC`;

		const itemsQueryResponse = await new Promise((resolve, reject) => {
			dbconn.query(itemsQuery, function(err, results, field){
				if (err) {
					console.log(err);
					reject(err);
				}
				else {
					resolve(results);
				}
			})
		});
	}
	else {
		res.status(200).send({doStatsArray, totalEarnings, mostPopItem: { itemName: "No data yet", sum: 0 }});
	}
}));

/****************************************************************************
 * Retrieve statistics for restaurant
 ****************************************************************************
 */
router.get('/rgm/getreservationstatistics', asyncHandler(async(req, res, next) => {
	// Get the usual constants
	const { username } = res.locals.userData;
	const { startDate, endDate } = req.query;

	// 1. With the two dates, we can get the range that the restaurant manager wants to see
	// Therefore we convert them to the useable format first
	const convertedStartDate = datetime_T.format(new Date(startDate), 'YYYY-MM-DD');
	const convertedEndDate = datetime_T.format(new Date(endDate), 'YYYY-MM-DD');
	// console.log(convertedStartDate, convertedEndDate);

		// Restrieve the restaurant ID from the restaurant table
	var sqlGetIDQuery = `SELECT restaurant_ID FROM restaurant WHERE rest_rgm_username="${username}"`

	const restID = await new Promise((resolve, reject) => {
		dbconn.query(sqlGetIDQuery, function(err, results, fields){
			if(err) {
				console.log(err);
				reject(err);
				next();
			}
			else {
				resolve(results[0].restaurant_ID);
			}
		})
	})

	// CONSTRUCT THE QUERY TO SEARCH FOR PARAMS WITHIN A RANGE
	var statsQuery = `SELECT cr_date AS date, COUNT(*) AS count FROM cust_reservation `;
	statsQuery += `WHERE cr_date BETWEEN "${convertedStartDate}" AND "${convertedEndDate}" `;
	statsQuery += `AND cr_rest_ID=${restID} `;
	statsQuery += `GROUP BY cr_date ORDER BY cr_date`;

	const statsResponse = await new Promise((resolve, reject) => {
		dbconn.query(statsQuery, function(err, results, fields){
			if (err) {
				reject(err);
			}
			else {
				resolve(results);
			}
		})
	})

	var tempDataArray = [];

	// CONSTRUCT THE DATA INTO A READABLE FORMAT FOR FRONTEND
	for (let stat of statsResponse) {
		const tempJSON = {
			dateValue: datetime_T.format(new Date(stat.date), "YYYY-MM-DD"),
			count: stat.count
		}
		tempDataArray.push(tempJSON);
	}

	// CONSTRUCT THE QUERY TO SEARCH FOR PARAMS WITHIN A RANGE
	var timeslotQuery = `SELECT cr_timeslot, COUNT(*) AS count FROM cust_reservation `;
	timeslotQuery += `WHERE cr_date BETWEEN "${convertedStartDate}" AND "${convertedEndDate}" `
	timeslotQuery += `AND cr_rest_ID=${restID} `;
	timeslotQuery += `GROUP BY cr_timeslot ORDER BY count DESC, cr_timeslot`;

	const timeslotResponse = await new Promise((resolve, reject) => {
		dbconn.query(timeslotQuery, function(err, results, fields){
			if (err) {
				reject(err);
			}
			else {
				resolve(results);
			}
		})
	})

	// FIND THE HIGHEST COUNT
	var tempArray = []

	for (let element of timeslotResponse) {
		tempArray.push(element.count);
	};

	const maxCount = tempArray[0];
	
	var tempTimeslotArray = [];
	
	if (timeslotResponse.length != 0) {
		for (let timeslotStat of timeslotResponse) {
			if (timeslotStat.count == maxCount) {
				const time = datetime_T.transform(timeslotStat.cr_timeslot, 'HH:mm:ss', 'h:mm A');
				tempTimeslotArray.push(time);
			}
		}
		res.status(200).send({ dataArray: tempDataArray, timeslotArray: tempTimeslotArray });
	}
	else {
		res.status(200).send({ dataArray: tempDataArray, timeslotArray: ["No data yet"] });
	}

}));

/*******************************************************************************************
 * NO ROUTES FUNCTIONS OR DECLARATIONS BELOW THIS DIVIDER 
 *******************************************************************************************
 * You only export and do nothing else here
 */

module.exports = router;
/*  */
// router.param('subuser_ID', (req, res, next, subuser_ID) => {
// 	// console.log(subuser_ID);
// 	next();
// });