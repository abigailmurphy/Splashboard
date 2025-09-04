const mongoose = require("mongoose");

const GuestSignupSchema = new mongoose.Schema(
  {
    season: { type: String, required: true },
    day:    { type: Date,   required: true }, 
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    guests: { type: Number, min: 0, max: 5, required: true },
  },
  { timestamps: true }
);

// One signup per (user, day, season)
GuestSignupSchema.index({ season: 1, day: 1, userId: 1 }, { unique: true });
// Day roster queries
GuestSignupSchema.index({ season: 1, day: 1 });
// "My signups" queries
GuestSignupSchema.index({ season: 1, userId: 1 });

module.exports = mongoose.model("GuestSignup", GuestSignupSchema);
