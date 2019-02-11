var mongoose = require('mongoose');

var TeamSchema = new mongoose.Schema({
    teamName  : String,
    dateCreated: String,
    workAssigned: String,
    users : [ { type: mongoose.Schema.Types.ObjectId, ref: 'User' } ]
  });

  module.exports = mongoose.model('Team', TeamSchema);
