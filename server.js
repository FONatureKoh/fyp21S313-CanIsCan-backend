require('dotenv').config();
const dbconn = require('./models/db_model.js');
const express = require('express');
const app = express();
const cors = require('cors');
const path = require('path');
const { google } = require('googleapis');
const nodemailer = require('nodemailer');

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

/*****************************************************************************
 * Test for sending an email                                                 *
 *****************************************************************************
 */
// Basic config for the google api
const oAuth2Client = new google.auth.OAuth2(
  process.env.EMAIL_CLIENT_ID, 
  process.env.EMAIL_CLIENT_SECRET, 
  process.env.REDIRECT_URL
);

oAuth2Client.setCredentials({
  refresh_token: process.env.EMAIL_REFRESH_TOKEN
})

// Creating an async function for sending emails
async function sendMail() {
  try {
    const accessToken = await oAuth2Client.getAccessToken();

    const transport = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: 'cancanfoodapp@gmail.com',
        clientId: process.env.EMAIL_CLIENT_ID,
        clientSecret: process.env.EMAIL_CLIENT_SECRET,
        refreshToken: process.env.EMAIL_REFRESH_TOKEN,
        accessToken: accessToken
      }
    });

    const mailOptions = {
      from: 'Administrator <cancanfoodapp@gmail.com>',
      to: 'fonaturekoh@outlook.sg',
      subject: 'This is a test for the gmail API',
      test: 'Hello world',
      html: '<h1>Hello world </h1>'
    };

    const result = await transport.sendMail(mailOptions);
    return result;
  }
  catch (error) {
    return error;
  }

}

app.get('/testemail', (req, res) => {
  sendMail()
    .then(result => {
      console.log(result);
      res.status(200).json({ api_msg: result });
    })
    .catch((error) => console.log(error.message));
})

/*****************************************************************************
 * Always end with what is right below this, listen                          *
 *****************************************************************************
 */ 
app.listen(5000, () => {
  console.log("Listening on port 5000!")
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