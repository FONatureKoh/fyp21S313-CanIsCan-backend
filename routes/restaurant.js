const express = require("express");
const router = express.Router();
const dbconn = require("../models/db_model");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const authTokenMiddleware = require("../middleware/authTokenMiddleware");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require('uuid');

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

function retrieveRestID(rgm_username) {
	// Then, we construct the sql query with the username in mind.
	var sqlQuery = "SELECT rgm_restaurant_ID ";
	sqlQuery += "FROM restaurant_gm ";
	sqlQuery += `WHERE rgm_username='${rgm_username}'`;

	// Query the db and return the said fields to the frontend app
	dbconn.query(sqlQuery, function (error, results, fields) {
		if (error) {
			console.log("MySQL error at restaurant.j line 42");
		}
		else {
			console.log(results[0].rgm_restaurant_ID);
			return results[0].rgm_restaurant_ID;
		}
	})
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
	.get(authTokenMiddleware, (req, res) => {
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
	// Save the restaurantID first from the URL
	var restaurantID = req.query.restaurantID;

	// Then construct the sql query based on the query
	var sqlQuery = "SELECT ric_name, ri_item_ID, item_name, item_desc, ";
	sqlQuery += "item_allergen_warning, item_price "; 
	sqlQuery += "FROM rest_item_categories JOIN rest_item ";
	sqlQuery += `ON ric_restaurant_ID=${restaurantID} AND ric_ID=ri_cat_ID `;
	sqlQuery += "ORDER BY ric_name, item_name";

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
		});
});

/*****************************************************************************************
 * Restaurant Items Add, Get, Put, Delete
 *****************************************************************************************/
// Step 1: Find the exact location on the server to save the file
const pathName = process.env.ASSETS_SAVE_LOC + "rest_items_png/"

// Step 2: Config Multer to the exact location for upload and get a uuidv4 random
// uuid for the file name
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, path.resolve(pathName));
	},
	filename: (req, file, cb) => {
		const itemName = Date.now() + '-' + uuidv4();
		cb(null, itemName + path.extname(file.originalname)); 
	}
})
const upload = multer({storage: storage}); //{ dest: '../assets'}

// Step 3: We write the post route for when we add an item to the db
router.post('/addmenuitem', authTokenMiddleware, upload.single("imageFile"), (req, res) => {
	// Get all the useful variables from the req
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
	console.log("restaurant.js line 196 ", file, req.body);

	// Construct insert sqlQuery 
	var sqlQuery = "INSERT INTO `rest_item`(`ri_cat_ID`, `item_name`, `item_png_ID`, ";
	sqlQuery += " `item_desc`, `item_allergen_warning`, `item_price`, `item_availability`) ";
	sqlQuery += `VALUES (${itemCategory}, '${itemName}', '${file.filename}', `;
	sqlQuery += `'${itemDesc}', '${itemAllergy}', ${itemPrice}, ${itemAvailability})`;

	// Make sqlQuery
	dbconn.query(sqlQuery, function(error, results, fields) {
		if (error) {
			console.log(error);
			res.status(400).send({ errorMsg: "MySQL error: " + error });
		}
		else {
			console.log(results);
			res.status(200).send(`File uploaded for ${itemName} with image name ${file.filename}`);
		}
	});
});

// Step 4: Create the routes for editing and getting information
router
  .route('/restaurantItem/:itemid')
	.get((req, res) => {
		res.send(`Get item with itemID ${req.params.itemid}`);
	})
	.put((req, res) => {
		res.send(`Updating item with itemID ${req.params.itemid}`);
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