var mongoose = require("mongoose");


var BtsSchema = new mongoose.Schema({
    projectName: String,
    status: String,
    dateCreated: String,
    title: String,
    description: String,
    dateSolved: String,
    comments:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment"
        }
    ]
});

module.exports = mongoose.model("Bts", BtsSchema);