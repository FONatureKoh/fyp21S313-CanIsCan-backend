const express = require("express");
const router = express.Router();
const dbconn = require("../models/db_model");

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

router.post('/addmenuitem', (req, res) => {
  // Restaurant_ID + Menu_Item_ID + item_name .png
});

/* 	=== All routes for /restaurant/item/:itemid ===
	Currently has get, put, delete 
	===============================================*/
router
  .route('/menuitem/:itemid')
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
router.param("itemid", (req, res, next, itemid) => {
	console.log(username);
	next();
});

/* === All routes for /restaurant/subusers === */
router.get('/subusers', (req, res) => {
	var sqlQuery = "";
	dbconn.query();
});

module.exports = router;