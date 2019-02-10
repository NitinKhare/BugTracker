var mongoose = require("mongoose");


var contactSchema = new mongoose.Schema({
    name: String,
    email: String,
    subject: String,
    message: String,
    dateOfContact: String
});

module.exports = mongoose.model("Contact", contactSchema);