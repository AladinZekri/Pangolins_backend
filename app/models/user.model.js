const mongoose = require("mongoose");

const User = mongoose.model(
  "User",
  new mongoose.Schema({
    username: String,
    email: String,
    aaze:String,
    password: String,
    age: Number,
    famille :String,
    race : String,
    nourriture : String,
    roles: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Role"
      }
    ],
    friends:[],
    friendRequestsSent:[],
    friendRequestsRecieved:[]
  })
);

module.exports = User;
