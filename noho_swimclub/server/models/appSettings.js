const mongoose = require("mongoose");

const AppSettingsSchema = new mongoose.Schema(
  {
    _id: { type: String, default: "global" },     // enforce single doc
    workingSeason: { type: String, required: true } // e.g. "2025"
    // add other knobs here: guestDailyLimit, seasonOpenDates, etc.
  },
  { timestamps: true }
);

module.exports = mongoose.model("AppSettings", AppSettingsSchema, "app_settings");
