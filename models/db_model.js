// Import MySQL
var mysql      = require('mysql');

// Create a connection pool
var connPool = mysql.createPool({
  connectionLimit: 50,
  host     : process.env.DB_HOST,
  user     : process.env.DB_USER,
  password : process.env.DB_PASS,
  database : process.env.DB_NAME
});

module.exports = connPool;

// NESTED QUERY CONNECTION EXAMPLE
// pool.getConnection(function(err, connection) {
//   if (err) throw err; // not connected!
 
//   // Use the connection
//   connection.query('SELECT something FROM sometable', function (error, results, fields) {
//     // When done with the connection, release it.
//     connection.release();
 
//     // Handle error after the release.
//     if (error) throw error;
 
//     // Don't use the connection here, it has been returned to the pool.
//   });
// });