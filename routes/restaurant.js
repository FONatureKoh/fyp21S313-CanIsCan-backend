const express = require("express");
const router = express.Router();
const dbconn = require("../models/db_model");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const authTokenMiddleware = require("../middleware/authTokenMiddleware");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require('uuid');
const date = require('date-and-time');

// Body Parser
router.use(express.json());
router.use(authTokenMiddleware);

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
router.get("/retrieveMenuItems", (req, res) => {
	// Save the restaurantID first from the URL
	var restaurantID = req.query.restaurantID;

	// Then construct the sql query based on the query
	var sqlQuery = "SELECT * FROM rest_item_categories JOIN rest_item ";
	sqlQuery += `ON ric_restaurant_ID=${restaurantID} AND ric_ID=ri_cat_ID`

	// Query the db and return the said fields to the frontend app
	dbconn.query(sqlQuery, function (error, results, fields) {
		if (error) {
			res.send("MySQL error: " + error);
    }
    else {
      res.send(results);
		}
	})
});

/****************************************************************************
 * Retrieve restaurant's item category / categories information							*
 ****************************************************************************
 */
router.get("/retrieveCategories", (req, res) => {
	// Save the restaurantID first from the URL
	var restaurantID = req.query.restaurantID;

	// Then construct the sql query based on the query
	var sqlQuery = "SELECT ric_name FROM rest_item_categories ";
	sqlQuery += `WHERE ric_restaurant_ID=${restaurantID} `;
	sqlQuery += "GROUP BY ric_name";

	// Query the db and return the said fields to the frontend app
	dbconn.query(sqlQuery, function (error, results, fields) {
		if (error) {
			res.send("MySQL error: " + error);
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
router.route("/itemCategory")
	.get((req, res) => {
		// Some useful variables for this route
		var selectedRestID;
		// Save the restaurantID first from the header and also auth
		const { username } = res.locals.userData;

		// Then construct the sql query based on username to get restaurant_ID
		var sqlQuery = "SELECT DISTINCT ric_name, ric_ID ";
		sqlQuery += "FROM rest_item_categories JOIN restaurant_gm ";
		sqlQuery += `WHERE rgm_username='${username}' AND ric_restaurant_ID=rgm_restaurant_ID `;

		// Query the db and return the said fields to the frontend app
		dbconn.query(sqlQuery, function (error, results, fields) {
			if (error) {
				res.status(400).send("MySQL error: " + error);
			}
			else {
				res.status(200).send(results);
			}
		})
	});

/****************************************************************************
 * Retrieve restaurant's items based on categories ID information						*
 ****************************************************************************
 */
router.get("/retrieveCategoriesItems", (req, res) => {
	// 1. Since we only have the username in the accesstoken, a nested sqlquery
	// will be needed to bring out the correct data dynamically. Lets get the
	// variables accordingly first
	const rgmUsername = res.locals.userData.username;
	// console.log(rgmUsername);

	// 2. The first query should get the restaurant ID
	var sqlQueryRestID = `SELECT rgm_restaurant_ID FROM restaurant_gm `;
	sqlQueryRestID += `WHERE rgm_username='${rgmUsername}'`;

	dbconn.query(sqlQueryRestID, function(error, results, fields){
		if (error) {
			res.status(400).send("MySQL error: " + error);
			// console.log(error);
		}
		else {
			// 3. Once selected, then we'll use that ID to retrieve everything else
			const rest_ID = results[0].rgm_restaurant_ID;
			
			// 4. Return the data accordingly. This should not fail in retrieve, so
			// we should only account for an sql error.
			var sqlQuery = "SELECT ric_name, ri_item_ID, ri_rest_ID, ri_cat_ID, item_name, ";
			sqlQuery += "item_png_ID, item_desc, item_allergen_warning, "; 
			sqlQuery += "item_price, item_availability ";
			sqlQuery += "FROM rest_item_categories JOIN rest_item ";
			sqlQuery += `ON ric_restaurant_ID=${rest_ID} AND ric_ID=ri_cat_ID `;
			sqlQuery += "ORDER BY ric_name, item_name";

			dbconn.query(sqlQuery, function (error, results, fields) {
				if (error) {
					res.status(400).send("MySQL error: " + error);
			  }
			  else {
					// console.log(results);
			    res.status(200).send(results);
				}
			})
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
	if (req.params.imageName != "") {
		const pathName = process.env.ASSETS_SAVE_LOC + "rest_items_png/" + req.params.imageName;

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
router
	.route("/restaurantProfile")
	.get((req, res) => {
		// Firstly, we get the username of the RGM of the restaurant
		const { username } = res.locals.userData;

		// Then, we construct the sql query with the username in mind.
		var sqlQuery = "SELECT * ";
		sqlQuery += "FROM restaurant JOIN restaurant_gm ";
		sqlQuery += `ON restaurant_ID=rgm_restaurant_ID AND rgm_username='${username}'`;

		// Query the db and return the said fields to the frontend app
		dbconn.query(sqlQuery, function (error, results, fields) {
			if (error) {
				res.status(200).send({ api_msg: "MySQL error: " + error });
			}
			else {
				// For this purpose, we should be creating a template to send back to the frontend
				// based on the information that is needed to be displayed.
				// 1. First, understand that the results form both tables together.
				// 2. We need to transform 2 things:
				//		- Time
				var rest_op_hours = date.transform(results[0].rest_opening_time, 'HH:mm:ss', 'hh:mm A');
				rest_op_hours += " to " + date.transform(results[0].rest_closing_time, 'HH:mm:ss', 'hh:mm A');

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
});

/*****************************************************************************************
 * Restaurant Items Add, Get, Put, Delete
 ****************************************************************************************
 * Item add, edit, delete, retrieve get
 * 
 */
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		// Test Console I just thinking. When i thinking the mouse dances
		// console.log("Multer Config");
		// console.log(path.resolve(pathName));
		// console.log(path.resolve(pathName));

		// Step 1: Find the exact location on the server to save the file
		const pathName = process.env.ASSETS_SAVE_LOC + "rest_items_png/";

		cb(null, path.resolve(pathName));
	},
	filename: (req, file, cb) => {
		// Step 2: Config Multer to the exact location for upload and get a uuidv4 random
		// uuid for the file name
		// console.log("Multer Config");
		if (file) {
			const itemName = Date.now() + '-' + uuidv4();
			cb(null, itemName + path.extname(file.originalname)); 
		}
	}
})
const upload = multer({storage: storage}); //{ dest: '../assets'}

// Step 3: We write the post route for when we add an item to the db
router.post('/addmenuitem', upload.single("imageFile"), (req, res) => {
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

	var sqlQueryRestID = `SELECT rgm_restaurant_ID FROM restaurant_gm `;
	sqlQueryRestID += `WHERE rgm_username='${username}'`;

	dbconn.query(sqlQueryRestID, function(error, results, fields){
		if (error) {
			res.status(400).send("MySQL error: " + error);
			// console.log(error);
		}
		else {
			// 3. Once selected, then we'll use that ID to retrieve everything else
			const rest_ID = results[0].rgm_restaurant_ID;

			// Construct insert sqlQuery 
			var sqlQuery = "INSERT INTO `rest_item`(`ri_rest_ID`, `ri_cat_ID`, `item_name`, `item_png_ID`, ";
			sqlQuery += " `item_desc`, `item_allergen_warning`, `item_price`, `item_availability`) ";
			sqlQuery += `VALUES (${rest_ID}, ${itemCategory}, '${itemName}', '${file.filename}', `;
			sqlQuery += `'${itemDesc}', '${itemAllergy}', ${itemPrice}, ${itemAvailability})`;

			// Make sqlQuery
			dbconn.query(sqlQuery, function(error, results, fields) {
				if (error) {
					//console.log(error);
					res.status(400).send("MySQL error: " + error);
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
		res.send(`Get item with itemID ${req.params.itemid}`);
	})
	.put(upload.single("imageFile"), (req, res) => {
		// console.log("PUT REQUEST");
		// 1. Get all the variables from the form and also the file
		const {
				file, body: {
				itemID,
				itemPngID,
				itemRestID,
				itemName, 
				itemPrice, 
				itemDesc, 
				itemAllergy,
				itemCategory,
				itemAvailability
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
				fs.unlink(path.resolve(pathName));
				
				// Construct the Update Query Yea
				var sqlUpdateQuery = `UPDATE rest_item `;
				sqlUpdateQuery += `SET ri_rest_ID=${itemRestID}, ri_cat_ID=${itemCategory}, item_name='${itemName}', `;
				sqlUpdateQuery += `item_png_ID='${file.filename}', item_desc='${itemDesc}', item_allergen_warning='${itemAllergy}', `;
				sqlUpdateQuery += `item_price=${itemPrice}, item_availability=${itemAvailability} `;
				sqlUpdateQuery += `WHERE ri_item_ID=${itemID}`; 

				// Query the MySQL 
				dbconn.query(sqlUpdateQuery, function(error, results, fields){
					if (error) {
						res.status(200).json({ api_msg: "Update error, double check for when new image is uploaded!" }); 
					}
					else {
						res.status(200).json({ api_msg: `Updated item "${itemName}"! NOTE: New image found! Old image deleted.` });
					}
				});
			}
			else {
				var sqlUpdateQuery = `UPDATE rest_item `;
				sqlUpdateQuery += `SET ri_rest_ID=${itemRestID}, ri_cat_ID=${itemCategory}, item_name='${itemName}', `;
				sqlUpdateQuery += `item_png_ID='${file.filename}', item_desc='${itemDesc}', item_allergen_warning='${itemAllergy}', `;
				sqlUpdateQuery += `item_price=${itemPrice}, item_availability=${itemAvailability} `;
				sqlUpdateQuery += `WHERE ri_item_ID=${itemID}`;

				// Query the MySQL
				dbconn.query(sqlUpdateQuery, function(error, results, fields){
					if (error) {
						res.status(200).json({ api_msg: "Update error, double check for when new image is uploaded!" }); 
					}
					else {
						res.status(200).json({ api_msg: `Updated item "${itemName}"! NOTE: New image uploaded!` });
					}
				});
			}
		}
		else {
			// Since no new imageFile is detected, then just update the data to the MySQL database
			var sqlUpdateQuery = `UPDATE rest_item `;
			sqlUpdateQuery += `SET ri_rest_ID=${itemRestID}, ri_cat_ID=${itemCategory}, item_name='${itemName}', `;
			sqlUpdateQuery += `item_desc='${itemDesc}', item_allergen_warning='${itemAllergy}', `;
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
		res.send(`Deleted item with itemID ${req.params.itemid}`);
	});

// Route Param link for 
router.param("itemid", (req, res, next, itemid) => {
	console.log(itemid);
	next();
});

/* === All routes for RGM subuser stuff === */
router.get('/subusers', (req, res) => {
	var sqlQuery = "";
	dbconn.query();
});

router.get('/rgm/addSubUser', (req, res) => {
	var sqlQuery = "";
	dbconn.query();
});

router
  .route('/rgm/subUser/:subuser_ID')
	.get((req, res) => {
		res.send(`Get item with itemID ${req.params.itemid}`);
	})
	.put((req, res) => {
		res.send(`Get item with itemID ${req.params.itemid}`);
	})
	.delete((req, res) => {
		res.send(`Get item with itemID ${req.params.itemid}`);
	});

/*  */
router.param("subuser_ID", (req, res, next, subuser_ID) => {
	// console.log(subuser_ID);
	next();
});

module.exports = router;