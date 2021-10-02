const express = require('express');
const app = express();

app.use(express.static("public"));

app.get('/', (req, res) => {
  console.log("Route success");
  res.json({message: "Server Load successful!"});
});

/* === All /users routes matters === */
const userRouter = require("./routes/users");
app.use("/users", userRouter);

app.listen(5000, () => {
  console.log("Listening on port 5000!")
});