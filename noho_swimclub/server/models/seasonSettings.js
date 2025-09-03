// models/seasonSetting.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

function startOfDay(d){ if(!d) return null; d.setHours(0,0,0,0); return d; }
function endOfDay(d){ if(!d) return null; d.setHours(23,59,59,999); return d; }

function june1(seasonStr){ return startOfDay(new Date(Number(seasonStr), 5, 1)); }   // June = 5
function sept1(seasonStr){ return endOfDay(new Date(Number(seasonStr), 8, 1)); }     // Sept = 8

function toValidDateOrUndefined(v) {
  if (v instanceof Date) return isNaN(v) ? undefined : v;
  const d = new Date(v);
  return isNaN(d) ? undefined : d;
}

const SeasonSettingSchema = new Schema(
  {
    season: { type: String, required: true, match: /^\d{4}$/, unique: true },

    seasonRange: {
      start: {
        type: Date,
        default: function(){ return june1(this.season); },
        set: v => {
          const d = toValidDateOrUndefined(v);
          return d ? startOfDay(new Date(d)) : undefined; // undefined = "unset"
        },
      },
      end: {
        type: Date,
        default: function(){ return sept1(this.season); },
        set: v => {
          const d = toValidDateOrUndefined(v);
          return d ? endOfDay(new Date(d)) : undefined;
        },
      },
    },

    guestCapPerDay: { type: Number, min: 0, default: 25 },
    guestCapPerPersonPerDay: { type: Number, min: 0, default: 5 },

    cost: {
      individualPerPerson: { type: Number, default: 260, min: 0 },
      familyFlat:          { type: Number, default: 620, min: 0 },
    },

    deadlines: {
      hardOfferDeadline:  { type: Date, default: null },
      hardReturnDeadline: { type: Date, default: null },
      offerResponseDays:  { type: Number, default: 14, min: 0 },
      returnResponseDays: { type: Number, default: 21, min: 0 },
    },

    visible:   { type: Boolean, default: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);


SeasonSettingSchema.pre("validate", function(next){
  const s = this.seasonRange?.start;
  const e = this.seasonRange?.end;
  if (!s || !e) return next(new Error("seasonRange.start and seasonRange.end are required"));
  if (e < s) return next(new Error("seasonRange.end must be on/after seasonRange.start"));
  next();
});

module.exports = mongoose.model("SeasonSetting", SeasonSettingSchema);
