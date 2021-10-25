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
  sendSubUserEmail: sendSubUserEmail
}