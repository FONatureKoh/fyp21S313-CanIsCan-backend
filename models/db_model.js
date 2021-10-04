var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : process.env.DB_HOST,
  user     : process.env.DB_USER,
  password : process.env.DB_PASS,
  database : process.env.DB_NAME
});

console.log(process.env.DB_PASS);
console.log(process.env.DB_USER);

module.exports = connection;