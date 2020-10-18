const mongoose = require("mongoose");

var UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  account: {
    type: Number,
    required: true,
  },
  statement: {
    type: Array,
  },
});

var Users = mongoose.model("Users", UserSchema);

module.exports = Users;
