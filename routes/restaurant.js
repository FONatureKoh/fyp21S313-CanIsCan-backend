const express = require("express");
const router = express.Router();
const dbconn = require("../models/db_model");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const authTokenMiddleware = require("../middleware/authTokenMiddleware");
const jwt = require("jsonwebtoken");

// Body Parser
router.use(express.json());
router.use(express.urlencoded({extended: true}));

/**************************************************************************
 * Router functions 																											*
 **************************************************************************
 * 
 */
function accessTokenParser(bearerToken) {
	// console.log("Parser function token: " + bearerToken);
	const authHeader = bearerToken;
  const token = authHeader && authHeader.split(' ')[1]

	return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, userData) => {
    if (err) return null;

		// console.log(userData);
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
	var sqlQuery = "SELECT * FROM rest_menu JOIN menu_item ";
	sqlQuery += `ON restaurant_ID=${restaurantID} AND menu_ID=item_menu_ID`

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
 * Retrieve restaurant's item categories information												*
 ****************************************************************************
 */
router.get("/retrieveCategories", (req, res) => {
	// Save the restaurantID first from the URL
	var restaurantID = req.query.restaurantID;

	// Then construct the sql query based on the query
	var sqlQuery = "SELECT menu_type FROM rest_menu ";
	sqlQuery += `WHERE rm_restaurant_ID=${restaurantID} `;
	sqlQuery += "GROUP BY menu_type";

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
 * Retrieve restaurant's items based on categories ID information						*
 ****************************************************************************
 */
router.get("/retrieveCategoriesItems", (req, res) => {
	// Save the restaurantID first from the URL
	var restaurantID = req.query.restaurantID;

	// Then construct the sql query based on the query
	var sqlQuery = "SELECT menu_type, menu_item_ID, item_name, item_desc, ";
	sqlQuery += "item_allergen_warning, item_price "; 
	sqlQuery += "FROM rest_menu JOIN menu_item ";
	sqlQuery += `ON rm_restaurant_ID=${restaurantID} AND menu_ID=item_menu_ID `;
	sqlQuery += "ORDER BY menu_type, item_name";

	// Query the db and return the said fields to the frontend app
	dbconn.query(sqlQuery, function (error, results, fields) {
		if (error) {
			res.send("MySQL error: " + error);
    }
    else {
			// console.log(results);
      res.status(200).send(results);
		}
	})
});

/****************************************************************************
 * Retrieve restaurant's information																				*
 ****************************************************************************
 */
router
	.route("/restaurantProfile")
	.get(authTokenMiddleware, (req, res) => {
		// Firstly, we get the username of the RGM of the restaurant
		const { username } = res.locals.userData;

		// Then, we construct the sql query with the username in mind.
		var sqlQuery = "SELECT restaurant_ID, restaurant_name, rest_address_info, ";
		sqlQuery += "postal_code, rest_phone_no, rest_email, restaurant_cat, ";
		sqlQuery += "restaurant_closing_time, rest_op_hours ";
		sqlQuery += "FROM restaurant JOIN restaurant_gm ";
		sqlQuery += `ON restaurant_ID = rgm_restaurant_ID AND rgm_username='${username}'`;

		// Query the db and return the said fields to the frontend app
		dbconn.query(sqlQuery, function (error, results, fields) {
			if (error) {
				res.status(400).send({ errorMsg: "MySQL error: " + error });
			}
			else {
				res.status(200).send(results[0]);
			}
		})
});

/********************************************************************
 * Add Menu Item route
 ********************************************************************/
// Step 1 is to find the exact location on the server to save the file
const pathName = process.env.ASSETS_SAVE_LOC + "rest_items_png/"

// We first set some multer config for this route. This is a middleware
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, path.resolve(pathName));
	},
	filename: (req, file, cb) => {
		// req.body should have all the necessary stuff for the query and entry
		// to the mysql database
		// Restaurant_ID + Menu_Item_ID + item_name .png
		const userData = accessTokenParser(req.headers['authorisation']);
		const username = userData["username"]

		console.log(req.file);
		console.log(req.body);

		const {
			body: {
				itemName, 
				itemPrice, 
				itemDesc, 
				itemAllergy
			}
		} = req;

		// var sqlQuery = "SELECT rgm_restaurant_ID FROM restaurant_gm ";
		// sqlQuery += `WHERE rgm_username='${username}'`

		// dbconn.query(sqlQuery, function (error, results, fields) {
		// 	if (error) {
		// 		console.log(error);
		// 	}
		// 	else {
		// 		console.log(results);
		// 	}
		// })

		cb(null, "itemName" + path.extname(file.originalname)); 
	}
})
const upload = multer({storage: storage}); //{ dest: '../assets'}

router.post('/addmenuitem', authTokenMiddleware, upload.single("imageFile"), (req, res) => {
  // Restaurant_ID + Menu_Item_ID + item_name .png
	// console.log(req.body);
	
	// Get all the variables
  const {
		file, body: {
			itemName, 
			itemPrice, 
			itemDesc, 
			itemAllergy
		}
	} = req;
	
	console.log(req.file, req.body);
  res.send("File uploaded as " + itemName);
});

/* 	=== All routes for /restaurant/item/:itemid ===
	Currently has get, put, delete 
	===============================================*/
router
  .route('/restaurantItem/:itemid')
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
	console.log(subuser_ID);
	next();
});

module.exports = router;