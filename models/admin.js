var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");


var AdminSchema = new mongoose.Schema({
    firstName: String,
    lastName:  String,
    mNumber:  Number,
    email:     String,
    username:  String,
    password:  String,
    IsAdmin: Number,
});

AdminSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("Admin", AdminSchema);