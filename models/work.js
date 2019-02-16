var mongoose = require("mongoose");

var WorkSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team' },
    Bug: { type: mongoose.Schema.Types.ObjectId, ref: 'Bts' },
    Project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
    dateCreated: String,
    dueDate: String,
    description: String

});

module.exports = mongoose.model('Work', WorkSchema);

