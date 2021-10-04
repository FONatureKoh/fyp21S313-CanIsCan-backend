require('dotenv').config()
const dbconn = require('./models/db_model.js');
const express = require('express');
const app = express();

app.use(express.static("public"));

app.get('/', (req, res) => {
  console.log("Route success");
  res.json({message: "Server Load successful!"});
});

app.get('/cow', (req, res) => {
  console.log("Route success");
  res.send("Hi Kelvin. More Cows This is your Cow.");
});

/* === Test DB Connection === */
app.get('/dbtest', (req, res) => {
  dbconn.query('SELECT 1', function (error, results, fields) {
    if (error) throw error;
    // connected!
  });
});

/* === All /users routes matters === */
const userRouter = require("./routes/users");
app.use("/users", userRouter);

app.listen(5000, () => {
  console.log("Listening on port 5000!")
});