var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");


var UserSchema = new mongoose.Schema({
    FullName: String,
    mNumber:  Number,
    email:     String,
    username:  String,
    password:  String,
});

UserSchema.plugin(passportLocalMongoose);
UserSchema.index({"email": 1, "mNumber":1},{unique: true});
module.exports = mongoose.model("User", UserSchema);