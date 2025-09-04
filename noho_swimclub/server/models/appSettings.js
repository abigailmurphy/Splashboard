const mongoose = require("mongoose");

const AppSettingsSchema = new mongoose.Schema(
  {
    _id: { type: String, default: "global" },     
    workingSeason: { type: String, required: true } 
   
  },
  { timestamps: true }
);

module.exports = mongoose.model("AppSettings", AppSettingsSchema, "app_settings");
