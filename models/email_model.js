const { google } = require("googleapis");
const nodemailer = require("nodemailer");

/*****************************************************************************
 * Sending Email Model                                                       *
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
async function sendMail(mailOptions) {
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

    const result = await transport.sendMail(mailOptions);
    return result;
  }
  catch (err) {
    console.log(err)
    return err;
  }
}

module.exports = sendMail;

// Mail Template
// const mailOptions = {
//   from: 'Administrator <cancanfoodapp@gmail.com>',
//   to: 'fonaturekoh@outlook.sg',
//   subject: 'This is a test for the gmail API',
//   test: 'Hello world',
//   html: '<h1>Hello world</h1>' + '<h2>This is a cow I guess</h2>'
// };