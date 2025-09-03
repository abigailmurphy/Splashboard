// models/membershipRecord.js
const { Schema, model, Types } = require("mongoose");

const AddressSchema = new Schema(
    {
      street:  { type: String, trim: true },
      city:    { type: String, trim: true },
      state:   { type: String, trim: true },
      zipCode: { type: String, trim: true },
    },
    { _id: false }
  );
 

const MembershipRecord = new Schema({
  userId:  { type: Types.ObjectId, ref: "User", required: true, index: true },
  season:  { type: String, required: true, index: true },   
  membershipType: { type: String, enum: ["family","individual"], required: true },
  address: AddressSchema,
  cell: {type: String},
  cell2: {type: String},
  homePhone: {type: String},
  workPhone: {type: String},

  status:  { type: String, enum: ["draft","submitted","waitlist","offered","accepted","rejected","revoked","expired","returnOffer"], default: "draft", index: true },
  applicationDate: Date,
  offeredAt:  Date,
  acceptedAt: Date,
  rejectedAt: Date,
  revokedAt:  Date,
  membershipPeople: [
    {
      type: {
        type: String,
        enum: ["Self", "Spouse", "Child"],
        required: true,
      },
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
      semail: {type: String, trim: true},
      dob: { type: Date },
      id: {type: String},
    },

  ],

  amountOwed:     { type: Number, default: 0 },      // what they owe for the season
  estimatedCost:  { type: Number, default: 0 },      // computed at apply time (draft/submitted)
  offerExpiresAt: { type: Date, default: null },     // computed when offer is created/marked
  settingsSnapshot: {
    cost: {
        individualPerPerson: { type: Number, default: 260 },
        familyFlat:          { type: Number, default: 620 },
    },
    deadlines: {
        offerResponseDays:  { type: Number, default: 14 },
        returnResponseDays: { type: Number, default: 21 },
        hardOfferDeadline:  { type: Date, default: null },
        hardReturnDeadline: { type: Date, default: null },
    },
  },



  

  notes: String,
}, { timestamps: true });

MembershipRecord.index({ userId: 1, season: 1 }, { unique: true });
module.exports = model("MembershipRecord", MembershipRecord);
