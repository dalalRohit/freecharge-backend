require("dotenv").config();
const mongoose = require("mongoose");

const connectionParams = {
  useNewUrlParser: true,
  useCreateIndex: true,
  useUnifiedTopology: true,
};
const url = process.env.MLAB_DB;

mongoose
  .connect(url, connectionParams)
  .then(() => {
    console.log("Connected to database");
  })
  .catch((err) => {
    console.log(err);
    console.error(`Error connecting to the database. \n${err}`);
  });
