// username, email, phone, rest name
const express = require("express");
const authTokenMiddleware = require("../middleware/authTokenMiddleware");
const router = express.Router();
const dbconn = require("../models/db_model");

// Body / form parser
router.use(express.json());
router.use(express.urlencoded({ extended: true }));

// Universal Middleware
// All middleware for this route comes here

/****************************************************************************
 * Restaurant Register for an account 																			*
 ****************************************************************************
 */
router.post("/restaurant", (req, res) => {
  // Assuming that we pass the form data into the route
  // 1. We will need to decode the form and draw out the data
  console.log(req.body);
  
  // On succesful register
  res.status(200).json({ api_msg: "Successful Register" });
});

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

module.exports = router;