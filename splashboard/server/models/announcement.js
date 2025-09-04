const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Define the schema for the Event model
const announcementSchema = Schema({

    title: { type: String, required: true }, // Title of announcement
    description: { type: String, required: true }, // Description of the event
    date: {type: Date, default: Date.now}, //the date created 
    flag: {type: Boolean, default: false},
});

// Export the Event model with the defined schema
module.exports = mongoose.model("Announcement", announcementSchema);