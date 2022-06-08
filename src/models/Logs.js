const mongoose = require("mongoose"), Schema = mongoose.Schema;

const aliasSchema = new Schema({
}, {
	collection: "logs",
	strict: false,
	timestamps: true
});

module.exports = mongoose.model("Logs", aliasSchema);