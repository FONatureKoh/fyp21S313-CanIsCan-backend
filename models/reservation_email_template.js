// Key modules
const datetime_T = require('date-and-time');

/*******************************************************************************************************************************
 * Email Template to send order confirmation to the customer 
 * *****************************************************************************************************************************
 * Order email sent to customer
 */
async function sendCustomerReservation(iCalString, crID, custEmail, restName, custName,
  restAddressPostal, reservationDateTime, pax, preOrderStatus, preOrderItems, preOrderTotal) {
  // Put a try catch to create the template and then return the template
  try {
    // console.log(custEmail);
    // Some conversion first
    // const convertedTime = "about " + datetime_T.transform(etd, 'HH:mm:ss', 'm') + " mins";

    // Sets the email address to receive email
    var mailTo = `${custEmail}`;
          
    // Sets email title
    var mailSubject = `${crID} confirmation email`;

    // Sets email plain text
    var mailText = `Your reservation for a table at ${restName} is confirmed!\n\n
    Restaurant's Address:\n
    ${restAddressPostal}\n
    Reservation Received Date/Time: ${reservationDateTime}\n
    Reservation Number: ${crID}\n 
    Pre-order items:\n\n`;

    if (Array.isArray(preOrderItems) == true && preOrderStatus == 'true'){
      for(let selectedItem of preOrderItems) {
        const item = JSON.parse(selectedItem)
        mailText += `${item.itemName}\tQty: ${item.itemQty}\tPrice: $${item.itemPrice.toFixed(2)}`;
        mailText += `Total Price: $${parseFloat(preOrderTotal).toFixed(2)}\n`
      }
    }
    else if (preOrderStatus == 'true'){
      const item = JSON.parse(preOrderItems)
      mailText += `${item.itemName}\tQty: ${item.itemQty}\tPrice: $${item.itemPrice.toFixed(2)}`;
      mailText += `Total Price: $${parseFloat(preOrderTotal).toFixed(2)}\n`
    }
    else {
      mailText += `No pre-order`
    }

    mailText += `Thank you for making a reservation!\n\n
    Cheers,\n
    FoodOnClick Team\n\n`;

    // Sets email HTML 
    var mailHTML = `<!DOCTYPE html>
    <html>

    <head>
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
      <div
        style="display: none; font-size: 1px; color: #fefefe; line-height: 1px; font-family: 'Lato', Helvetica, Arial, sans-serif; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
      </div>
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
                  <h1 style="font-size: 48px; font-weight: 400; margin: 2;">Table Reserved!</h1> <img
                    src="https://api.cancanfoodapp.xyz/assets/cancanlogo.png" width="125" height="120"
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
                <td bgcolor="#ffffff" align="left"
                  style="padding: 0px 30px 40px 30px; color: #666666; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 400; line-height: 25px;">
                  <p style="margin: 0;">Hi ${custName},
                  </p>
                </td>
              </tr>
              <tr>
                <!---SUBTITLE BG COLOUR--->
                <td bgcolor="#ffffff" align="left"
                  style="padding: 0px 30px 10px 30px; color: #666666; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 800; line-height: 25px;">
                  <p style="margin: 0;">Your Reservation Details:
                  </p>
                </td>
              </tr>
              <tr>
                <td bgcolor="#ffffff" align="left"
                  style="padding: 0px 30px 40px 30px; color: #666666; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 400; line-height: 25px;">
                  <p style="margin: 0;">${restName}
                    <br>${restAddressPostal}
                    <br><br>${reservationDateTime}
                    <br><br>Your reservation is for ${pax} guests
                    <br>
                  </p>
                </td>
              </tr>`
    if (preOrderStatus == 'true') {
      mailHTML += `<tr>
                <!---PARA 1 BG COLOUR--->
                <td bgcolor="#ffffff" align="left"
                  style="padding: 0px 30px 0px 30px; color: #666666; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 400; line-height: 25px;">
                  <p style="margin: 0;">You have made a pre order for your reservation! Details are below! Please note that payment is to be made at the restaurant
                    and will be subjected to tax and other charges.<br></br></p>
                </td>
              </tr> <!-- COPY -->

              <tr>
                <td align="left" style="padding-top: 10px;">
                  <table cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td width="70%" align="left" bgcolor="#c2c2c2"
                        style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 800; line-height: 24px; padding: 10px;">
                        Items</td>
                      <td width="10%" align="left" bgcolor="#c2c2c2"
                        style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 800; line-height: 24px; padding: 10px;">
                        Qty </td>
                      <td width="20%" align="left" bgcolor="#c2c2c2"
                        style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 800; line-height: 24px; padding: 10px;">
                        Price ($)</td>
                    </tr>`;
      
      if(Array.isArray(preOrderItems) == true) {
        for(let selectedItem of preOrderItems){
          const item = JSON.parse(selectedItem);
          mailHTML += `<tr>
            <td width="70%" align="left" bgcolor="#ffffff"
              style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 400; line-height: 24px; padding: 15px 10px 5px 10px;">
              ${item.itemName} </td>
            <td width="10%" align="left" bgcolor="#ffffff"
              style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 800; line-height: 24px; padding: 10px;">
              ${item.itemQty} </td>
            <td width="20%" align="left" bgcolor="#ffffff"
              style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 400; line-height: 24px; padding: 15px 10px 5px 10px;">
              $${item.itemPrice.toFixed(2)}</td>
          </tr>`
        }
      }
      else {
        // Parse the item into a JSON object
        const item = JSON.parse(preOrderItems);
        mailHTML += `<tr>
          <td width="70%" align="left" bgcolor="#ffffff"
            style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 400; line-height: 24px; padding: 15px 10px 5px 10px;">
            ${item.itemName} </td>
          <td width="10%" align="left" bgcolor="#ffffff"
            style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 800; line-height: 24px; padding: 10px;">
            ${item.itemQty} </td>
          <td width="20%" align="left" bgcolor="#ffffff"
            style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 400; line-height: 24px; padding: 15px 10px 5px 10px;">
            $${item.itemPrice.toFixed(2)}</td>
        </tr>`
      }

      mailHTML += `</table>
                </td>
              </tr>
              <tr>
                <td align="left" style="padding-top: 5px; padding-bottom: 10px;">
                  <table cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td width="80%" align="left" bgcolor="#ffffff"
                        style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 800; line-height: 24px; padding: 10px; border-top: 3px solid #eeeeee; border-bottom: 3px solid #eeeeee;">
                        TOTAL </td>
                      <td width="20%" align="left" bgcolor="#ffffff"
                        style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 800; line-height: 24px; padding: 10px; border-top: 3px solid #eeeeee; border-bottom: 3px solid #eeeeee;">
                        $${parseFloat(preOrderTotal).toFixed(2)} </td>
                    </tr>
                  </table>
                </td>
              </tr>`
    }
    mailHTML += `<tr>
                <!---PARA 2 BG COLOUR--->
                <td bgcolor="#ffffff" align="left"
                  style="padding: 30px 30px 20px 30px; color: #666666; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 400; line-height: 25px;">
                  <p style="margin: 0;"> 
                    A calendar invite has been attached with this email, please use it to create your calendar invite! <br>
                    <br>
                    Hope to see you soon!</p>
                </td>
              </tr>
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
                  <p style="margin: 0;"><a href="#" target="_blank" style="color: #666666;">foodonclick@support.com</a></p>
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
      icalEvent: {
        filename: 'invite.ics',
        content: iCalString
      },
      text: mailText,
      html: mailHTML
    };

    return mailOptions;
  }
  catch(err) {
    console.log(err);
  }
}

/*******************************************************************************************************************************
 * EMAIL TEMPLATE TO SEND EMAILS TO RGM FOR WHEN THEY FIRST REGISTER
 * *****************************************************************************************************************************
 * THIS HERE SHOULD TAKE IN USERNAME PASSWORD EMAIL RESTAURANT NAME AND CREATE EMAIL BASED ON WHEN THE ADMIN APPROVES
 * THE ACCOUNT
 */
async function sendResToRestaurant(crID, restEmail, custName, reservationDateTime, pax, preOrderStatus, preOrderItems, preOrderTotal) {
  // Put a try catch to create the template and then return the template
  try {
    // Sets the email address to receive email
    var mailTo = `${restEmail}`;
          
    // Sets email title
    var mailSubject = `Reservation ${crID} received`;

    // Sets email plain text
    var mailText = `Reservation details as follows!\n\n
    Made by:\n
    ${custName}\n\n
    Date and time:\n
    ${reservationDateTime}\n\n
    Reservation Number: ${crID}\n\n    
    Pre-order items:\n`;

    if (Array.isArray(preOrderItems) == true && preOrderStatus == 'true'){
      for(let selectedItem of preOrderItems) {
        const item = JSON.parse(selectedItem)
        mailText += `${item.itemName}\tQty: ${item.itemQty}\tPrice: ${item.itemPrice.toFixed(2)}\n`;
        mailText +=`\nTotal: $${parseFloat(preOrderTotal).toFixed(2)}\n`
      }
    }
    else if (preOrderStatus == 'true') {
      const item = JSON.parse(preOrderItems)
      mailText += `${item.itemName}\tQty: ${item.itemQty}\tPrice: ${item.itemPrice.toFixed(2)}\n`;
      mailText +=`\nTotal: $${parseFloat(preOrderTotal).toFixed(2)}\n`
    }
    else {
      mailText += `No pre-order found`
    }

    mailText +=`\nPlease login to https://cancanfoodapp.xyz for further details!\n\n
    Cheers,\n
    FoodOnClick Team`;

    // Sets email HTML 
    var mailHTML = `<!DOCTYPE html>
    <html>

    <head>
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
      <div
        style="display: none; font-size: 1px; color: #fefefe; line-height: 1px; font-family: 'Lato', Helvetica, Arial, sans-serif; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
      </div>
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
                  <h1 style="font-size: 48px; font-weight: 400; margin: 2;">New Table Reservation!</h1> <img
                    src="https://api.cancanfoodapp.xyz/assets/cancanlogo.png" width="125" height="120" 
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
                <td bgcolor="#ffffff" align="left"
                  style="padding: 0px 30px 20px 30px; color: #666666; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 400; line-height: 25px;">
                  <p style="margin: 0;">Hi Sir / Ma'am,
                    <br></br>A new table reservation has been made at your restaurant,
                  </p>
                </td>
              </tr>
              <tr>
                <!---SUBTITLE BG COLOUR--->
                <td bgcolor="#ffffff" align="left"
                  style="padding: 0px 30px 10px 30px; color: #666666; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 800; line-height: 25px;">
                  <p style="margin: 0;">Reservation Details are as follows:
                  </p>
                </td>
              </tr>
              <tr>
                <td bgcolor="#ffffff" align="left"
                  style="padding: 0px 30px 20px 30px; color: #666666; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 400; line-height: 25px;">
                  <p style="margin: 0;"><b>Customer Name:</b> ${custName}
                    <br><b>Date/Time:</b> ${reservationDateTime}
                    <br><b>Table for:</b> ${pax} guests
                  </p>
                </td>
              </tr>`
    if (preOrderStatus == 'true') {
      mailHTML+=`<tr>
                <!---PARA 1 BG COLOUR--->
                <td bgcolor="#ffffff" align="left"
                  style="padding: 0px 30px 0px 30px; color: #666666; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 400; line-height: 25px;">
                  <p style="margin: 0;">Customer has made a pre-order, the order details below
                    below.<br></br></p>
                </td>
              </tr> <!-- COPY -->

              <tr>
                <td align="left" style="padding-top: 10px;">
                  <table cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td width="70%" align="left" bgcolor="#c2c2c2"
                        style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 800; line-height: 24px; padding: 10px;">
                        Pre Order # 2345678</td>
                      <td width="10%" align="left" bgcolor="#c2c2c2"
                        style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 800; line-height: 24px; padding: 10px;">
                        Qty </td>
                      <td width="20%" align="left" bgcolor="#c2c2c2"
                        style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 800; line-height: 24px; padding: 10px;">
                        Price ($)</td>
                    </tr>`;

      if(Array.isArray(preOrderItems) == true) {
        for(let selectedItem of preOrderItems){
          const item = JSON.parse(selectedItem);
          mailHTML += `<tr>
            <td width="70%" align="left" bgcolor="#ffffff"
              style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 400; line-height: 24px; padding: 15px 10px 5px 10px;">
              ${item.itemName} </td>
            <td width="10%" align="left" bgcolor="#ffffff"
              style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 800; line-height: 24px; padding: 10px;">
              ${item.itemQty} </td>
            <td width="20%" align="left" bgcolor="#ffffff"
              style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 400; line-height: 24px; padding: 15px 10px 5px 10px;">
              $${item.itemPrice.toFixed(2)}</td>
          </tr>`
        }
      }
      else {
        // Parse the item into a JSON object
        const item = JSON.parse(preOrderItems);
        mailHTML += `<tr>
          <td width="70%" align="left" bgcolor="#ffffff"
            style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 400; line-height: 24px; padding: 15px 10px 5px 10px;">
            ${item.itemName} </td>
          <td width="10%" align="left" bgcolor="#ffffff"
            style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 800; line-height: 24px; padding: 10px;">
            ${item.itemQty} </td>
          <td width="20%" align="left" bgcolor="#ffffff"
            style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 400; line-height: 24px; padding: 15px 10px 5px 10px;">
            $${item.itemPrice.toFixed(2)}</td>
        </tr>`
      };

      mailHTML +=`</table>
                </td>
              </tr>
              <tr>
                <td align="left" style="padding-top: 5px; padding-bottom: 10px;">
                  <table cellspacing="0" cellpadding="0" border="0" width="100%">
                    <tr>
                      <td width="80%" align="left" bgcolor="#ffffff"
                        style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 800; line-height: 24px; padding: 10px; border-top: 3px solid #eeeeee; border-bottom: 3px solid #eeeeee;">
                        TOTAL </td>
                      <td width="20%" align="left" bgcolor="#ffffff"
                        style="font-family: Open Sans, Helvetica, Arial, sans-serif; font-size: 16px; font-weight: 800; line-height: 24px; padding: 10px; border-top: 3px solid #eeeeee; border-bottom: 3px solid #eeeeee;">
                        $${parseFloat(preOrderTotal).toFixed(2)} </td>
                    </tr>
                  </table>
                </td>
              </tr>`;
    }
    mailHTML += `<tr>
                <td bgcolor="#ffffff" align="left">
                  <table width="100%" border="0" cellspacing="0" cellpadding="0">
                    <tr>
                      <td bgcolor="#ffffff" align="center" style="padding: 20px 30px 30px 30px;">
                        <table border="0" cellspacing="0" cellpadding="0">
                          <tr>
                            <!-- LINK TO CAL INVITE-->
                            <td align="center" style="border-radius: 3px;" bgcolor="#c2c2c2"><a
                                href="http://cancanfoodapp.xyz" target="_blank"
                                style="font-size: 20px; font-family: Helvetica, Arial, sans-serif; color: #ffffff; text-decoration: none; color: #ffffff; text-decoration: none; padding: 15px 25px; border-radius: 2px; border: 1px solid #c2c2c2; display: inline-block;">Login</a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr> <!-- COPY -->
              <tr>
                <!---PARA 2 BG COLOUR--->
                <td bgcolor="#ffffff" align="left"
                  style="padding: 0px 30px 20px 30px; color: #666666; font-family: 'Lato', Helvetica, Arial, sans-serif; font-size: 18px; font-weight: 400; line-height: 25px;">
                  <p style="margin: 0;"> Login using the button above to view and manage reservations.</p>
                </td>
              </tr>
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
                  <p style="margin: 0;"><a href="#" target="_blank" style="color: #666666;">foodonclick@support.com</a></p>
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
  sendCustomerReservation: sendCustomerReservation,
  sendResToRestaurant: sendResToRestaurant
}