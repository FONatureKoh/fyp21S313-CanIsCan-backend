// Express Server imports
const express = require('express');
const router = express.Router();

// Database matters
const dbconn = require('../models/db_model');

// General Imports
const { v4: uuidv4 } = require('uuid');
const date = require('date-and-time');
const pw_gen = require('generate-password');
const fs = require('fs');
const path = require('path');

// For image uploads
const multer = require('multer');

// Email Modules
const sendMail = require('../models/email_model');
const { sendSubUserEmail } = require('../models/email_templates');

// Middle Ware stuffs
const authTokenMiddleware = require('../middleware/authTokenMiddleware');

/**************************************************************************
 * Router Middlewares and parsers																					*
 **************************************************************************/
router.use(express.json());
router.use(authTokenMiddleware);

