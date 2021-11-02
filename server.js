require('dotenv').config();
const dbconn = require('./models/db_model.js');
const sendMail = require('./models/email_model.js');
const express = require('express');
const app = express();
const cors = require('cors');
const path = require('path');
const { google } = require('googleapis');
const nodemailer = require('nodemailer');
const ical = require('ical-generator');

app.use(express.static("public"));

// CORS matters
const corsOptions ={
  // origin: ['http://localhost:3000', 'https://cancanfoodapp.xyz'],
  // credentials: true,            //access-control-allow-credentials:true
  allowedHeaders: ['Content-Type', 'authorisation'],
  optionSuccessStatus: 200
}

app.use(cors());

app.get('/', (req, res) => {
  console.log("Route success");
  res.json({message: "Server Load successful!"});
});

// Cow Test api
app.get('/cow', (req, res) => {
  console.log("Route success");
  res.send("Hi Kelvin. More Cows This is your cat Cow. FUN FUN");
});

// Cat test API
app.get('/cats', (req, res) => {
  console.log("Route success");
  res.send("This is a cat. Can you see the cat?");
});

/* === Test DB Connection === */
app.get('/dbtest', (req, res) => {
  dbconn.query('SELECT 1', function (error, results, fields) {
    if (error) {
      res.send("MySQL error: " + error);
    }
    else {
      res.send("MySQL Connected successfully");// connected!
    }
  });
});

/* === All /users routes matters === */
const userRouter = require("./routes/users");
app.use("/users", userRouter);

/* === All /auth routes matters === */
const authRouter = require("./routes/auth");
app.use("/auth", authRouter);

/* === All /auth routes matters === */
const restaurantRouter = require("./routes/restaurant");
app.use("/restaurant", restaurantRouter);

/* === All /register routes matters === */
const registerRouter = require("./routes/register");

app.use("/register", registerRouter);

/* === All /admin routes matters === */
const adminRouter = require("./routes/admin");

app.use("/admin", adminRouter);

/* === All /admin routes matters === */
const customerRouter = require("./routes/customer");
const { calendar } = require('googleapis/build/src/apis/calendar');

app.use("/customer", customerRouter);

/*******************************************************************************************
 * API SERVER TEST FUNCTIONS TO BE PLACED BELOW THIS DIVIDER
 *******************************************************************************************
 * functions to test email, test database connection and others should come here
 */
app.get('/testemail/:emailaddress', (req, res) => {
  const emailAdd = req.params.emailaddress;

  const mailOptions = {
    from: 'Administrator <cancanfoodapp@gmail.com>',
    to: emailAdd,
    subject: 'This is a test for the gmail API',
    text: 'Hello world, plain text test for cancanfoodapp Gmail',
    html: '<h1>Hello world</h1>' + '<h2>This is a test for cancanfoodapp Gmail API</h2>'
  };
  
  // console.log(mailOptions);

  sendMail(mailOptions)
    .then(result => {
      console.log("sendmail triggered")
      console.log(result);
      res.status(200).json(result);
    })
    .catch((error) => console.log(error.message));
});

/*******************************************************************************************
 * API SERVER TEST FUNCTIONS TO BE PLACED BELOW THIS DIVIDER
 *******************************************************************************************
 * functions to test email, test database connection and others should come here
 */
app.get('/icalgen', (req, res) => {
  // First we have to create the Calendar object like this
  const cal = new ical.ICalCalendar({ domain: "github.com", name: "my first iCal" });
  // cal.domain("example.net");

  // Then we create the said event
  cal.createEvent({
    start: new Date(),
    end: new Date(new Date().getTime() + 3600000),
    summary: 'Example Event',
    description: 'It works ;)',
    location: 'my room',
    url: 'http://sebbo.net/'
  });

  console.log(cal.toString());
  const calString = cal.toString();

  console.log(Buffer.from(calString).toString('base64'));
  const cal64 = Buffer.from(calString).toString('base64');
  
  // res.status(200).json({ calString, cal64 });

  const mailOptions = {
    from: 'Administrator <cancanfoodapp@gmail.com>',
    to: 'fonaturekoh@gmail.com',
    subject: 'This is a test for the gmail API',
    icalEvent: {
      filename: 'invite.ics',
      method: 'request',
      content: cal64,
      encoding: 'base64'
    },
    text: 'Hello world, plain text test for cancanfoodapp Gmail',
    html: '<h1>Hello world</h1>' + '<h2>This is a test for cancanfoodapp Gmail API</h2>'
    // alternatives: [{
    //     contentType: 'text/calendar; charset="utf-8"; method=REQUEST',
    //     content: createdCalObj
    // }]
  };

  sendMail(mailOptions)
    .then(result => {
      console.log("sendmail triggered")
      console.log(result);
      res.status(200).json(result);
    })
    .catch((error) => console.log(error.message));
});

/*******************************************************************************************
 * NO ROUTES FUNCTIONS OR DECLARATIONS BELOW THIS DIVIDER 
 *******************************************************************************************
 * Everything below here is only for starting up
 */
app.listen(5000, () => {
  // States port listening
  console.log("API SERVER STARTING...");
  console.log("DATE TIME CHECK: " + new Date());

  console.log("cancanfoodapp API server listening on port 5000!");

  // Respond based on app_status
  if (process.env.APP_STATUS == "test") {
    console.log("APP_STATUS is test. No checks will be ran!")
  }
  else {
    console.log("APP_STATUS is deployed. Running checks...");

    // Challenge MySQL Database connection
    dbconn.query('SELECT 1', function (err, results, fields) {
      if (err) {
        console.log("MySQL error on start: " + err);
      }
      else {
        console.log("MySQL Database Connected successfully");// connected!
      }
    });

    // Challenge gmail API - Sends email to fonaturekoh@outlook.sg on restart
    const mailOptions = {
      from: 'Administrator <cancanfoodapp@gmail.com>',
      to: 'fonaturekoh@outlook.sg',
      subject: 'API server restarted!',
      text: `NOTE: API server restarted @ ${new Date()}`,
      html: `<h1>API server restarted @ ${new Date()}</h1><h2>This is a test for cancanfoodapp Gmail API</h2>`
    };

    sendMail(mailOptions)
      .then(result => {
        console.log("Gmail API check triggered! Attempting to send an email...")
        console.log(result);
      })
      .catch((err) => console.log(err));
  }
});

/****************************************************************************
 * Retrieve restaurant's items imaage																				*
 ****************************************************************************
 */
// app.get('/itemImage/:imageName', (req, res) => {
//   // console.log(path.resolve(`../0-test-pictures/${req.params.imageName}`));
//   // console.log(req.params.imageName);
//   // console.log(pathName);

//   const pathName = process.env.ASSETS_SAVE_LOC + "rest_items_png/" + req.params.imageName;
  
//   res.sendFile(path.resolve(pathName));
// });