require('dotenv').config()
const dbconn = require('./models/db_model.js');
const express = require('express');
const app = express();
const cors = require('cors')

app.use(express.static("public"));
app.use(cors());

app.get('/', (req, res) => {
  console.log("Route success");
  res.json({message: "Server Load successful!"});
});

app.get('/cow', (req, res) => {
  console.log("Route success");
  res.send("Hi Kelvin. More Cows This is your Cow. FUN FUN");
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

app.listen(5000, () => {
  console.log("Listening on port 5000!")
});