const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");
const randToken = require ("rand-token");


const bcrypt = require('bcryptjs');



const SpouseSchema = new Schema(
  {
    sfirst: { type: String, trim: true },
    slast:  { type: String, trim: true },
    semail: { type: String, trim: true },
  },
  { _id: true } // keep an _id so you *can* reference if needed later
);

const ChildSchema = new Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName:  { type: String, required: true,  trim: true },
    dob:       { type: Date,   required: true },
  },
  { _id: true }
);

const AddressSchema = new Schema(
  {
    street:  { type: String, trim: true },
    city:    { type: String, trim: true },
    state:   { type: String, trim: true },
    zipCode: { type: String, trim: true },
  },
  { _id: false }
);

// Define the schema for the User model
const userSchema = Schema({

    name: {
      first: {
        type: String,
        trim: true,
      },
      last: {
        type: String,
        trim: true,
      },
    },
    email: { type: String, required: true, unique: true }, // User's email (unique)
    password: { type: String, required: true }, // User's password
    spouse: SpouseSchema,
    address: AddressSchema,
    
    cell: {type: String},
    cell2: {type: String},
    homePhone: {type: String},
    workPhone: {type: String},
    children: [ChildSchema],
    
    
    isAdmin: {type: Boolean, default: false},
    hasOffer: {type: Boolean, default: false},
    hasPaid: {type: Boolean, default: false},
    isMember: {type: Boolean, default: false},
    appliedMember: {type: Boolean, default: false},

    activeMembershipRecord: {
      type: Schema.Types.ObjectId,
      ref: "MembershipRecord",
    },
    
    //First date as a member
    membershipCreated: {
      type: Date,
      default: null,
    },
    
    amountOwed: {
      type: Number,
      default: 0,
    },
    postponed: {
      type: Number,
      default: 0,
    },
    
    years: [{type: Number}],
    },
    {
        timestamps: true,
        toObject: { virtuals: true }
      }
);
userSchema.virtual("fullName").get(function () {
  return `${this.name.first} ${this.name.last}`;
});

userSchema.virtual("spouseFull").get(function () {
  return `${this.spouse.sfirst} ${this.spouse.slast}`;
});

userSchema.virtual("familySize").get(function() {
  let totalMembers = 1; // Current user is a member

  // Check if there's a spouse
  if (this.spouse &&
    this.spouse.slast &&
    this.spouse.slast.trim() !== "") {
    totalMembers += 1;
  }
  

  // Count the number of children
  if (this.children && this.children.length > 0 && this.children[0] !=="") {
    totalMembers += this.children.length;
  }
  return totalMembers;
});


userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt();
  this.password = await bcrypt.hash(this.password, salt);
  next();
});


userSchema.statics.login = async function (email, password) {
  const user = await this.findOne({ email });
  if (user) {
    const auth = await bcrypt.compare(password, user.password);
    if (auth) {
      return user;
    }
    throw Error("incorrect password");
  }
  throw Error("incorrect email");
};
  
// Export the User model with the defined schema
module.exports = mongoose.model("User", userSchema);
