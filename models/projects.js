var mongoose = require('mongoose');

var projectSchema = new mongoose.Schema({
    projectName: String,
    projectDetails: String,
    techStack: String,
    dateAdded: String,
    dateModified: String,
    status: String,
    bugs:[
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Bts"
        }
    ],
    AssignedTo:{ type: mongoose.Schema.Types.ObjectId, ref: "Work"}

});
projectSchema.index({"projectName": 1,},{unique: true});

module.exports = mongoose.model("Project", projectSchema);