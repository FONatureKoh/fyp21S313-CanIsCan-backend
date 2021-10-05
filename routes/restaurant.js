const express = require("express");
const router = express.Router();
const dbconn = require("../models/db_model");

/* === Returns current users === */
router.get("/list", (req, res) => {
	dbconn.query('SELECT * FROM app_users', function (error, results, fields) {
    if (error) {
      res.send("MySQL error: " + error);
    }
    else {
      res.send(results);
    }
  });
});

router.post('/addmenuitem', (req, res) => {
  // Restaurant_ID + Menu_Item_ID + item_name .png
});

/* === All routes for /restaurant/item/:itemid ===
	Currently has get, put, delete
	*/
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

module.exports = router;