async function sendSubUserEmail(username, password, email, restaurant) {
  // Put a try catch to create the template and then return the template
  try {
    var mailTo = `${email}`;
          
    var mailSubject = `Login credentials for ${restaurant} employee`;

    var mailText = `Welcome to Food On Click! \n`
    mailText += `Your login details as follows: \n\n`
    mailText += `\t\tUsername: ${username}\n`
    mailText += `\t\tPassword: ${password}\n\n`
    mailText += `You will be prompted to key in your restaurant's details on your first login!`;

    var mailHTML = `<h2>Your login details as follows:</h2>`
    mailHTML += `<p>\t\tUsername: ${username}\n`
    mailHTML += `\t\tPassword: ${password}\n\n`
    mailHTML += `You will be prompted to key in your restaurant's details on your first login!</p>`;

    mailHTML = `<!DOCTYPE html><html><head>
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
      body,
      table,
      td,
      a {
          -webkit-text-size-adjust: 100%;
          -ms-text-size-adjust: 100%;
      }

      table,
      td {
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
                        <td bgcolor="#ffffff" align="center" valign="top" style="padding: 40px 20px 20px 20px; border-radius: 4px 4px 0px 0px; color: #111111; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 48px; font-weight: 400; letter-spacing: 4px; line-height: 48px;">
              
              <!---TITLE---> <!---ADD LOGO LINK HERE--->
                            <h1 style="font-size: 48px; font-weight: 400; margin: 2;">Welcome!</h1> <img src="file:///Users/duncanfok/Documents/SIM/FYP/CanIsCan2.png" width="125" height="120" style="display: block; border: 0px;" />
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
                        <td bgcolor="#ffffff" align="left" style="padding: 20px 30px 10px 30px; color: #666666; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 800; line-height: 25px;"> 
                            <p style="margin: 0;">Thank you for registering your business with us!
              </p>
                        </td>
                    </tr>
          <tr>
          <td bgcolor="#ffffff" align="left" style="padding: 0px 30px 40px 30px; color: #666666; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 400; line-height: 25px;"> 
                        <p style="margin: 0;">You will receive another email in 7-14 days with your login credentials. 
            </p>
                    </td>
        </tr>
                    <tr>
            <!---PARA 1 BG COLOUR--->
                        <td bgcolor="#ffffff" align="left" style="padding: 0px 30px 0px 30px; color: #666666; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 400; line-height: 25px;">
                            <p style="margin: 0;">Meanwhile check out our promotional website for more information on what we do!
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
                                                <td align="center" style="border-radius: 3px;" bgcolor="#c2c2c2"><a href="https://teamcaniscan.wixsite.com/caniscan" target="_blank" style="font-size: 20px; font-family: Helvetica, Arial, sans-serif; color: #ffffff; text-decoration: none; color: #ffffff; text-decoration: none; padding: 15px 25px; border-radius: 2px; border: 1px solid #c2c2c2; display: inline-block;">View Website</a></td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr> <!-- COPY -->
                    <tr>
            <!---PARA 4 BG COLOUR--->
                        <td bgcolor="#ffffff" align="left" style="padding: 0px 30px 40px 30px; border-radius: 0px 0px 4px 4px; color: #666666; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 400; line-height: 25px;">
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
                        <td bgcolor="#c2c2c2" align="center" style="padding: 30px 30px 30px 30px; border-radius: 4px 4px 4px 4px; color: #666666; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 400; line-height: 25px;">
                            <h2 style="font-size: 20px; font-weight: 400; color: #111111; margin: 0;">Need help?</h2>
                            <p style="margin: 0;"><a href="#" target="_blank" style="color: #666666;">foodonclick@support.com</a></p>
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
                        <td bgcolor="#f4f4f4" align="left" style="padding: 0px 30px 30px 30px; color: #666666; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 14px; font-weight: 400; line-height: 18px;"> <br>
                            <p style="margin: 0;">If these emails get annoying, please feel free to <a href="#" target="_blank" style="color: #111111; font-weight: 700;">unsubscribe</a>.</p>
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
      text: mailText
    };

    return mailOptions;
  }
  catch(error) {
    console.log(error);
  }
}

/********************************************************************************************************************
 * Send customer delivery order email / DO email / customer only template
 ********************************************************************************************************************
 * Takes in customer's email and also the data that needs to be sent to the customer
 */
async function sendCustOrderEmail(email, dataBody) {
  // Put a try catch to create the template and then return the template
  try {
    var mailTo = `${email}`;
          
    var mailSubject = `Login credentials for ${restaurant} employee`;

    var mailText = `Welcome to Food On Click! \n`
    mailText += `Your login details as follows: \n\n`
    mailText += `\t\tUsername: ${username}\n`
    mailText += `\t\tPassword: ${password}\n\n`
    mailText += `You will be prompted to key in your restaurant's details on your first login!`;

    var mailHTML = `<h2>Your login details as follows:</h2>`
    mailHTML += `<p>\t\tUsername: ${username}\n`
    mailHTML += `\t\tPassword: ${password}\n\n`
    mailHTML += `You will be prompted to key in your restaurant's details on your first login!</p>`;

    const mailOptions = {
      from: 'Administrator <cancanfoodapp@gmail.com>',
      to: mailTo,
      subject: mailSubject,
      text: mailText
    };

    return mailOptions;
  }
  catch(error) {
    console.log(error);
  }
}

async function sendRestOrderEmail(username, password, email, restaurant) {
  // Put a try catch to create the template and then return the template
  try {
    var mailTo = `${email}`;
          
    var mailSubject = `Login credentials for ${restaurant} employee`;

    var mailText = `Welcome to Food On Click! \n`
    mailText += `Your login details as follows: \n\n`
    mailText += `\t\tUsername: ${username}\n`
    mailText += `\t\tPassword: ${password}\n\n`
    mailText += `You will be prompted to key in your restaurant's details on your first login!`;

    var mailHTML = `<h2>Your login details as follows:</h2>`
    mailHTML += `<p>\t\tUsername: ${username}\n`
    mailHTML += `\t\tPassword: ${password}\n\n`
    mailHTML += `You will be prompted to key in your restaurant's details on your first login!</p>`;

    const mailOptions = {
      from: 'Administrator <cancanfoodapp@gmail.com>',
      to: mailTo,
      subject: mailSubject,
      text: mailText
    };

    return mailOptions;
  }
  catch(error) {
    console.log(error);
  }
}



module.exports = {
  sendSubUserEmail: sendSubUserEmail,
  sendCustOrderEmail: sendCustOrderEmail,
  sendRestOrderEmail: sendRestOrderEmail
}