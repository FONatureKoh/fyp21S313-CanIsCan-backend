require('dotenv').config();
const dbconn = require('./models/db_model.js');
const express = require('express');
const app = express();
const cors = require('cors');
const path = require('path');

app.use(express.static("public"));

// CORS matters
const corsOptions ={
    origin:'http://localhost:3000', 
    credentials:true,            //access-control-allow-credentials:true
    optionSuccessStatus:200
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

// Image Test API
app.get('/image/:imageName', (req, res) => {
  // console.log(path.resolve(`../0-test-pictures/${req.params.imageName}`));
  console.log(req.params.imageName);
  
  const pathName = process.env.ASSETS_SAVE_LOC + "rest_items_png/" + req.params.imageName;
  console.log(pathName);

  res.sendFile(path.resolve(pathName));
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