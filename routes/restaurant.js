const express = require("express");
const router = express.Router();
const dbconn = require("../models/db_model");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const authTokenMiddleware = require("../middleware/authTokenMiddleware");

router.use(express.json());

/* === Returns all menu and menu items based on restaurantID === */
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
// We first set some multer config for this route. This is a middleware
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, './public/assets/menuitem_png');
	},
	filename: (req, file, cb) => {
		// req.body should have all the necessary stuff for the query and entry
		// to the mysql database
		// Restaurant_ID + Menu_Item_ID + item_name .png
		const {
			body: {
				username,
				itemName, 
				itemPrice, 
				itemDesc, 
				itemAllergy
			}
		} = req;

		/**********************************************************************
		 * Get the restaurant's ID based on the RGM's username since the			*
		 * RGM's account is tagged to a restaurant
		*/
		var sqlQuery = "SELECT restaurant_ID FROM restaurant_gm ";
		sqlQuery += `WHERE username='${username}'`

		dbconn.query(sqlQuery, function (error, results, fields) {
			if (error) {
				console.log(error);
			}
			else {
				console.log(results);
			}
		})

		cb(null, itemName + path.extname(file.originalname)); 
	}
})
const upload = multer({storage: storage}); //{ dest: '../assets'}

router.post('/addmenuitem', authTokenMiddleware, upload.single("file"), (req, res) => {
  // Restaurant_ID + Menu_Item_ID + item_name .png
	console.log(req.body);
	
	// Get all the variables
  const {
		file, body: {
			itemName, 
			itemPrice, 
			itemDesc, 
			itemAllergy
		}
	} = req;

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