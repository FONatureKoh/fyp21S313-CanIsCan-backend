/*******************************************************************************************************************************
 * EMAIL TEMPLATE TO SEND EMAILS TO RGM FOR WHEN THEY FIRST REGISTER
 * *****************************************************************************************************************************
 * THIS HERE SHOULD TAKE IN USERNAME PASSWORD EMAIL RESTAURANT NAME AND CREATE EMAIL BASED ON WHEN THE ADMIN APPROVES
 * THE ACCOUNT
 */
async function sendRGMEmail(username, password, email, restaurant) {
  // Put a try catch to create the template and then return the template
  try {
    // Sets the email address to receive email
    var mailTo = `${email}`;
          
    // Sets email title
    var mailSubject = `Login credentials for ${restaurant}'s Restaurant General Manager`;

    // Sets email plain text
    var mailText = `Welcome to Food On Click! \nYou've passed the vibe check! Welcome to the FoodOnClick\n
    Your login details as follows: \n\n
    \t\tUsername: ${username}\n
    \t\tPassword: ${password}\n\n
    Please login to you account to complete your registration and kick start your journey with FoodOnClick!\n
    FoodOnClick => https://cancanfoodapp.xyz`;

    // Sets email HTML 
    var mailHTML = `<!DOCTYPE html><html><head>
      <title></title>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <meta http-equiv="X-UA-Compatible" content="IE=edge" />
      <style type="text/css">
        @media screen {
          @font-face {
            font-family: 'Lato';
            font-style: normal;
            font-weight: 400;
            src: local('Lato Regular'), local('Lato-Regular'), url(https://fonts.gstatic.com/s/lato/v11/qIIYRU-oROkIk8vfvxw6QvesZW2xOQ-xsNqO47m55DA.woff) format('woff');
          }

          @font-face {
            font-family: 'Lato';
            font-style: normal;
            font-weight: 700;
            src: local('Lato Bold'), local('Lato-Bold'), url(https://fonts.gstatic.com/s/lato/v11/qdgUG4U09HnJwhYI-uK18wLUuEpTyoUstqEm5AMlJo4.woff) format('woff');
          }

          @font-face {
            font-family: 'Lato';
            font-style: italic;
            font-weight: 400;
            src: local('Lato Italic'), local('Lato-Italic'), url(https://fonts.gstatic.com/s/lato/v11/RYyZNoeFgb0l7W3Vu1aSWOvvDin1pK8aKteLpeZ5c0A.woff) format('woff');
          }

          @font-face {
            font-family: 'Lato';
            font-style: italic;
            font-weight: 700;
            src: local('Lato Bold Italic'), local('Lato-BoldItalic'), url(https://fonts.gstatic.com/s/lato/v11/HkF_qI1x_noxlxhrhMQYELO3LdcAZYWl9Si6vvxL-qU.woff) format('woff');
          }
        }

        /* CLIENT-SPECIFIC STYLES */
        body, table, td, a {
          -webkit-text-size-adjust: 100%;
          -ms-text-size-adjust: 100%;
        }

        table, td {
          mso-table-lspace: 0pt;
          mso-table-rspace: 0pt;
        }

        img {
          -ms-interpolation-mode: bicubic;
        }

        /* RESET STYLES */
        img {
          border: 0;
          height: auto;
          line-height: 100%;
          outline: none;
          text-decoration: none;
        }

        table {
          border-collapse: collapse !important;
        }

        body {
          height: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
        }

        /* iOS BLUE LINKS */
        a[x-apple-data-detectors] {
          color: inherit !important;
          text-decoration: none !important;
          font-size: inherit !important;
          font-family: inherit !important;
          font-weight: inherit !important;
          line-height: inherit !important;
        }

        /* MOBILE STYLES */
        @media screen and (max-width:600px) {
          h1 {
            font-size: 32px !important;
            line-height: 32px !important;
          }
        }

        /* ANDROID CENTER FIX */
        div[style*="margin: 16px 0;"] {
          margin: 0 !important;
        }
      </style>
    </head>

    <body style="background-color: #f4f4f4; margin: 0 !important; padding: 0 !important;">
      <!-- HIDDEN PREHEADER TEXT -->
      <div style="display: none; font-size: 1px; color: #fefefe; line-height: 1px; font-family: 'Lato', Helvetica, Arial, sans-serif; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;"></div>
      <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <!---MIDDLE BG COLOUR--->
          <td bgcolor="#303034" align="center" style="padding: 0px 10px 0px 10px;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
              <tr>
                <!---TITLE BG COLOUR--->
                <td bgcolor="#ffffff" align="center" valign="top"
                  style="padding: 40px 20px 20px 20px; border-radius: 4px 4px 0px 0px; color: #111111; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 48px; font-weight: 400; letter-spacing: 4px; line-height: 48px;">
      
                  <!---TITLE--->
                  <!---ADD LOGO LINK HERE--->
                  <h1 style="font-size: 48px; font-weight: 400; margin: 2;">Welcome!</h1> <img
                    src="https://api.cancanfoodapp.xyz/assets/cancanlogo.png" width="125" height="125"
                    style="display: block; border: 0px;" />
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <!---BOTTOM BG COLOUR--->
          <td bgcolor="#f4f4f4" align="center" style="padding: 0px 10px 0px 10px;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
              <tr>
                <!---SUBTITLE BG COLOUR--->
                <td bgcolor="#ffffff" align="left"
                  style="padding: 20px 30px 10px 30px; color: #666666; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 800; line-height: 25px;">
                  <p style="margin: 0;">You've passed the vibe check! Welcome to FoodOnClick!
                  </p>
                </td>
              </tr>
              <tr>
                <td bgcolor="#ffffff" align="left"
                  style="padding: 0px 30px 40px 30px; color: #666666; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 400; line-height: 25px;">
                  <p style="margin: 0;">Your login credentials are as follows:
                    <br><b>Username:</b> ${username}
                    <br><b>Password:</b> ${password}
                  </p>
                </td>
              </tr>
              <tr>
                <!---PARA 1 BG COLOUR--->
                <td bgcolor="#ffffff" align="left"
                  style="padding: 0px 30px 0px 30px; color: #666666; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 400; line-height: 25px;">
                  <p style="margin: 0;">Please login to you account to complete your registration and kick start your journey
                    with FoodOnClick!
                    <br></br>
                  </p>
                </td>
              </tr> <!-- COPY -->
              <tr>
                <td bgcolor="#ffffff" align="left">
                  <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <td bgcolor="#ffffff" align="center" style="padding: 20px 30px 60px 30px;">
                        <table border="0" cellspacing="0" cellpadding="0">
                          <tr>
                            <td align="center" style="border-radius: 3px;" bgcolor="#c2c2c2"><a
                                href="https://cancanfoodapp.xyz" target="_blank"
                                style="font-size: 20px; font-family: Helvetica, Arial, sans-serif; color: #ffffff; text-decoration: none; color: #ffffff; text-decoration: none; padding: 15px 25px; border-radius: 2px; border: 1px solid #c2c2c2; display: inline-block;">Login
                                Now</a></td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr> <!-- COPY -->
              <tr>
                <!---PARA 4 BG COLOUR--->
                <td bgcolor="#ffffff" align="left"
                  style="padding: 0px 30px 40px 30px; border-radius: 0px 0px 4px 4px; color: #666666; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 400; line-height: 25px;">
                  <p style="margin: 0;">Cheers,<br>FoodOnClick Team</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <!---*1 BOTTOM BAR BG COLOUR--->
          <td bgcolor="#f4f4f4" align="center" style="padding: 30px 10px 0px 10px;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
              <tr>
                <!---BOTTOM BOX BG COLOUR--->
                <td bgcolor="#c2c2c2" align="center"
                  style="padding: 30px 30px 30px 30px; border-radius: 4px 4px 4px 4px; color: #666666; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 400; line-height: 25px;">
                  <h2 style="font-size: 20px; font-weight: 400; color: #111111; margin: 0;">Need help?</h2>
                  <p style="margin: 0;"><a href="#" target="_blank" style="color: #666666;">cancanfoodapp@gmail.com</a></p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <!---*2 BOTTOM BAR BG COLOUR--->
          <td bgcolor="#f4f4f4" align="center" style="padding: 0px 10px 0px 10px;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
              <tr>
      
                <!---BOTTOM BOX BG COLOUR--->
                <td bgcolor="#f4f4f4" align="left"
                  style="padding: 0px 30px 30px 30px; color: #666666; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 400; line-height: 18px;">
                  <br>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>`

    const mailOptions = {
      from: 'Administrator <cancanfoodapp@gmail.com>',
      to: mailTo,
      subject: mailSubject,
      text: mailText,
      html: mailHTML
    };

    return mailOptions;
  }
  catch(error) {
    console.log(error);
  }
}

/*******************************************************************************************************************************
 * EMAIL TEMPLATE TO SEND EMAILS TO RGM FOR WHEN THEY FIRST REGISTER
 * *****************************************************************************************************************************
 * THIS HERE SHOULD TAKE IN USERNAME PASSWORD EMAIL RESTAURANT NAME AND CREATE EMAIL BASED ON WHEN THE ADMIN APPROVES
 * THE ACCOUNT
 */
async function sendSubUserEmail(username, password, email, restaurant) {
  // Put a try catch to create the template and then return the template
  try {
    var mailTo = `${email}`;
          
    var mailSubject = `Login credentials for ${restaurant} employee`;

    var mailText = `Welcome to Food On Click! \n
    Your login details as follows: \n\n
    \t\tUsername: ${username}\n
    \t\tPassword: ${password}\n\n
    Please login to you account to complete your registration.\n
    FoodOnClick => https://cancanfoodapp.xyz`;

    var mailHTML = `<!DOCTYPE html><html><head>
      <title></title>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <meta http-equiv="X-UA-Compatible" content="IE=edge" />
      <style type="text/css">
        @media screen {
          @font-face {
            font-family: 'Lato';
            font-style: normal;
            font-weight: 400;
            src: local('Lato Regular'), local('Lato-Regular'), url(https://fonts.gstatic.com/s/lato/v11/qIIYRU-oROkIk8vfvxw6QvesZW2xOQ-xsNqO47m55DA.woff) format('woff');
          }

          @font-face {
            font-family: 'Lato';
            font-style: normal;
            font-weight: 700;
            src: local('Lato Bold'), local('Lato-Bold'), url(https://fonts.gstatic.com/s/lato/v11/qdgUG4U09HnJwhYI-uK18wLUuEpTyoUstqEm5AMlJo4.woff) format('woff');
          }

          @font-face {
            font-family: 'Lato';
            font-style: italic;
            font-weight: 400;
            src: local('Lato Italic'), local('Lato-Italic'), url(https://fonts.gstatic.com/s/lato/v11/RYyZNoeFgb0l7W3Vu1aSWOvvDin1pK8aKteLpeZ5c0A.woff) format('woff');
          }

          @font-face {
            font-family: 'Lato';
            font-style: italic;
            font-weight: 700;
            src: local('Lato Bold Italic'), local('Lato-BoldItalic'), url(https://fonts.gstatic.com/s/lato/v11/HkF_qI1x_noxlxhrhMQYELO3LdcAZYWl9Si6vvxL-qU.woff) format('woff');
          }
        }

        /* CLIENT-SPECIFIC STYLES */
        body, table, td, a {
          -webkit-text-size-adjust: 100%;
          -ms-text-size-adjust: 100%;
        }

        table, td {
          mso-table-lspace: 0pt;
          mso-table-rspace: 0pt;
        }

        img {
          -ms-interpolation-mode: bicubic;
        }

        /* RESET STYLES */
        img {
          border: 0;
          height: auto;
          line-height: 100%;
          outline: none;
          text-decoration: none;
        }

        table {
          border-collapse: collapse !important;
        }

        body {
          height: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
        }

        /* iOS BLUE LINKS */
        a[x-apple-data-detectors] {
          color: inherit !important;
          text-decoration: none !important;
          font-size: inherit !important;
          font-family: inherit !important;
          font-weight: inherit !important;
          line-height: inherit !important;
        }

        /* MOBILE STYLES */
        @media screen and (max-width:600px) {
          h1 {
            font-size: 32px !important;
            line-height: 32px !important;
          }
        }

        /* ANDROID CENTER FIX */
        div[style*="margin: 16px 0;"] {
          margin: 0 !important;
        }
      </style>
    </head>

    <body style="background-color: #f4f4f4; margin: 0 !important; padding: 0 !important;">
      <!-- HIDDEN PREHEADER TEXT -->
      <div style="display: none; font-size: 1px; color: #fefefe; line-height: 1px; font-family: 'Lato', Helvetica, Arial, sans-serif; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;"></div>
      <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <!---MIDDLE BG COLOUR--->
          <td bgcolor="#303034" align="center" style="padding: 0px 10px 0px 10px;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
              <tr>
                <!---TITLE BG COLOUR--->
                <td bgcolor="#ffffff" align="center" valign="top"
                  style="padding: 40px 20px 20px 20px; border-radius: 4px 4px 0px 0px; color: #111111; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 48px; font-weight: 400; letter-spacing: 4px; line-height: 48px;">
      
                  <!---TITLE--->
                  <!---ADD LOGO LINK HERE--->
                  <h1 style="font-size: 48px; font-weight: 400; margin: 2;">Welcome!</h1> <img
                    src="https://api.cancanfoodapp.xyz/assets/cancanlogo.png" width="125" height="125"
                    style="display: block; border: 0px;" />
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <!---BOTTOM BG COLOUR--->
          <td bgcolor="#f4f4f4" align="center" style="padding: 0px 10px 0px 10px;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
              <tr>
                <!---SUBTITLE BG COLOUR--->
                <td bgcolor="#ffffff" align="left"
                  style="padding: 20px 30px 10px 30px; color: #666666; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 800; line-height: 25px;">
                  <p style="margin: 0;">You are getting this email because you are an employee of ${restaurant}.
                  </p>
                </td>
              </tr>
              <tr>
                <td bgcolor="#ffffff" align="left"
                  style="padding: 0px 30px 40px 30px; color: #666666; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 400; line-height: 25px;">
                  <p style="margin: 0;">Your login credentials are as follows:
                    <br><b>Username:</b> ${username}
                    <br><b>Password:</b> ${password}
                  </p>
                </td>
              </tr>
              <tr>
                <!---PARA 1 BG COLOUR--->
                <td bgcolor="#ffffff" align="left"
                  style="padding: 0px 30px 0px 30px; color: #666666; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 400; line-height: 25px;">
                  <p style="margin: 0;">Please login to you account to complete your registration!
                    <br></br>
                  </p>
                </td>
              </tr> <!-- COPY -->
              <tr>
                <td bgcolor="#ffffff" align="left">
                  <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <td bgcolor="#ffffff" align="center" style="padding: 20px 30px 60px 30px;">
                        <table border="0" cellspacing="0" cellpadding="0">
                          <tr>
                            <td align="center" style="border-radius: 3px;" bgcolor="#c2c2c2"><a
                                href="https://cancanfoodapp.xyz" target="_blank"
                                style="font-size: 20px; font-family: Helvetica, Arial, sans-serif; color: #ffffff; text-decoration: none; color: #ffffff; text-decoration: none; padding: 15px 25px; border-radius: 2px; border: 1px solid #c2c2c2; display: inline-block;">Login
                                Now</a></td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr> <!-- COPY -->
              <tr>
                <!---PARA 4 BG COLOUR--->
                <td bgcolor="#ffffff" align="left"
                  style="padding: 0px 30px 40px 30px; border-radius: 0px 0px 4px 4px; color: #666666; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 400; line-height: 25px;">
                  <p style="margin: 0;">Cheers,<br>FoodOnClick Team</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <!---*1 BOTTOM BAR BG COLOUR--->
          <td bgcolor="#f4f4f4" align="center" style="padding: 30px 10px 0px 10px;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
              <tr>
                <!---BOTTOM BOX BG COLOUR--->
                <td bgcolor="#c2c2c2" align="center"
                  style="padding: 30px 30px 30px 30px; border-radius: 4px 4px 4px 4px; color: #666666; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 400; line-height: 25px;">
                  <h2 style="font-size: 20px; font-weight: 400; color: #111111; margin: 0;">Need help?</h2>
                  <p style="margin: 0;"><a href="#" target="_blank" style="color: #666666;">cancanfoodapp@gmail.com</a></p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <!---*2 BOTTOM BAR BG COLOUR--->
          <td bgcolor="#f4f4f4" align="center" style="padding: 0px 10px 0px 10px;">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
              <tr>
      
                <!---BOTTOM BOX BG COLOUR--->
                <td bgcolor="#f4f4f4" align="left"
                  style="padding: 0px 30px 30px 30px; color: #666666; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 400; line-height: 18px;">
                  <br>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>`

    const mailOptions = {
      from: 'Administrator <cancanfoodapp@gmail.com>',
      to: mailTo,
      subject: mailSubject,
      text: mailText,
      html: mailHTML
    };

    return mailOptions;
  }
  catch(error) {
    console.log(error);
  }
}

module.exports = {
  sendRGMEmail: sendRGMEmail,
  sendSubUserEmail: sendSubUserEmail
}