const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");
const randToken = require ("rand-token");

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
    spouse: {
      sfirst:{
        type: String,
        trim: true,
      },
      slast: {
        type: String,
        trim: true,
      }
    },
    address: {type: String, required: true},
    city: { type: String, required: true }, // User's city
    state: { type: String, required: true }, // User's state
    zipCode: { type: Number, min: 500, max: 99999 , required: true}, // User's ZIP code (between 10000 and 99999)
    cell: {type: String},
    cell2: {type: String},
    homePhone: {type: String},
    workPhone: {type: String},
    children: [{ type: String }], // Array of user's interests
    membershipType: {
      type: String,
      enum: ['family', 'individual'],
      required: true
    },
    apiToken: {type: String},
    isAdmin: {type: Boolean, default: false},
    hasOffer: {type: Boolean, default: false},
    hasPaid: {type: Boolean, default: false},
    isMember: {type: Boolean, defalut: false},
    years: [{type: Number}],
    },
    {
        timestamps: true,
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


userSchema.pre("save", function (next) {
  let user = this;
  if (!user.apiToken) {
    user.apiToken = randToken.generate(16);
    next();
  } else {
    next();
  }
});

  
  userSchema.plugin(passportLocalMongoose, { usernameField: "email" });
// Export the User model with the defined schema
module.exports = mongoose.model("User", userSchema);
