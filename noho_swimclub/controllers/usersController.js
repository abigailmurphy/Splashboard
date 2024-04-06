const User = require("../models/user");
const passport = require("passport");
const token = process.env.TOKEN || "kitchent0k3n";
const getUserParams = (body) => {
  return {
    name: {
      first: body.first,
      last: body.last,
    },
    email: body.email,
    password: body.password,
    zipCode: body.zipCode,
    spouse: {
      sfirst: body.sfirst,
      slast: body.slast,
    },
    cell: body.cell,
    cell2: body.cell,
    homePhone: body.homePhone,
    workPhone: body.workPhone,
    address: body.address,
    city: body.city,
    state: body.state,
    zipCode: body.zipCode,
    children: body.children.split(',').map((children) => children.trim()),
    membershipType: body.membershipType,
  };
  
};

module.exports = {
  index: (req, res, next) => {
    User.find()
      .sort({ createdAt: 'asc' })
      .then((users) => {
        res.locals.users = users;
        next();
      })
      .catch((error) => {
        console.log(`Error fetching users: ${error.message}`);
        next(error);
      });
  },
  indexView: (req, res) => {
    res.render("users/index");
  },
  waitlistView: (req,res) => {
    res.render("users/waitlist");
  },
  thankyou: (req,res) => {
    res.render("users/thankyou");
  },
  membership: (req,res) => {
    if(res.locals.loggedIn){
      res.render('users/membership', { user: res.locals.currentUser });
    }else{
      res.render("users/membership");
    }
    
  },
  profile: (req, res) => {
    res.render("users/profile", { user: req.user });
  },
  offer: (req,res) =>{
    const memberId = req.params.id;
    
    User.findByIdAndUpdate(memberId, {
      $set: { hasOffer: 'true' }
    })
      .then((event) => {
        req.flash('success', 'Membership has been offered.');
        res.locals.redirect = `users/waitlist`;
        res.locals.user = memberId;
        next();
    
      })
      .catch((error) => {
        console.log(`Error updating user by ID: ${error.message}`);
        res.locals.redirect = `users/waitlist`;
        next(error);
      });
  },
  accept: (req,res) =>{
    const memberId = req.params.id;
    
    User.findByIdAndUpdate(memberId, {
      $set: { isMember: 'true' }
    })
      .then((event) => {
        req.flash('success', 'Membership has been Accepted.');
        res.locals.redirect = `users/membership`;
        res.locals.user = memberId;
        next();
    
      })
      .catch((error) => {
        console.log(`Error updating user by ID: ${error.message}`);
        res.locals.redirect = `users/waitlist`;
        next(error);
      });
  },
  new: (req, res) => {
    res.render("users/new");
  },
  create: (req, res, next) => {
    if (req.skip) next();
    let newUser = new User(getUserParams(req.body));
    User.register(newUser, req.body.password, (error, user) => {
      if (user) {
        req.flash(
          "success",
          `${user.fullName}'s account created successfully!`
        );
        res.locals.redirect = "/users/thankyou";
        next();
      } else {
        req.flash(
          "error",
          `Failed to create user account because:${error.message}.`
        );
        res.locals.redirect = "/users/new";
        next();
      }
    });
  },
  redirectView: (req, res, next) => {
    let redirectPath = res.locals.redirect;
    if (redirectPath) res.redirect(redirectPath);
    else next();
  },
  show: (req, res, next) => {
    let userId = req.params.id;
    User.findById(userId)
      .then((user) => {
        res.locals.user = user;
        next();
      })
      .catch((error) => {
        console.log(`Error fetching user by ID: ${error.message}`);
        next(error);
      });
  },
  showView: (req, res) => {
    res.render("users/show");
  },
  edit: (req, res, next) => {
    let userId = req.params.id;
    User.findById(userId)
      .then((user) => {
        res.render("users/edit", {
          user: user,
        });
      })
      .catch((error) => {
        console.log(`Error fetching user by ID: ${error.message}`);
        next(error);
      });
  },
  update: (req, res, next) => {
    let userId = req.params.id,
      userParams = getUserParams(req.body);

    User.findByIdAndUpdate(userId, {
      $set: userParams,
    })
      .then((user) => {
        res.locals.redirect = `/users/${userId}`;
        res.locals.user = user;
        next();
      })
      .catch((error) => {
        console.log(`Error updating user by ID: ${error.message}`);
        next(error);
      });
  },
  delete: (req, res, next) => {
    let userId = req.params.id;
    User.findOneAndDelete({ _id: userId })
      .then(() => {
        req.flash('success', 'Application removed successfully.');
        res.locals.redirect = "/";
        next();
      })
      .catch((error) => {
        console.log(`Error deleting from waitlist by ID: ${error.message}`);
        next();
      });
  },
  login: (req, res) => {
    res.render("users/login");
  },
  authenticate: passport.authenticate("local", {
    failureRedirect: "/users/login",
    failureFlash: "Failed to login.",
    successRedirect: "/",
  }),
  validate: (req, res, next) => {
    req
      .sanitizeBody("email")
      .normalizeEmail({
        all_lowercase: true,
      })
      .trim();
    req.check("email", "Email is invalid").isEmail();
    req
      .check("zipCode", "Zip code is invalid")
      .notEmpty()
      .isInt()
      .isLength({
        min: 5,
        max: 5,
      })
      .equals(req.body.zipCode);
    req.check("password", "Password cannot be empty").notEmpty();
    req.getValidationResult().then((error) => {
      if (!error.isEmpty()) {
        let messages = error.array().map((e) => e.msg);
        req.skip = true;
        req.flash("error", messages.join(" and "));
        res.locals.redirect = "/users/new";
        next();
      } else {
        next();
      }
    });
  },
  logout: (req, res, next) => {
    req.logout(function (err) {
      if (err) {
        return next(err);
      }
    });
    req.flash("success", "You have been logged out!");
    res.locals.redirect = "/";
    next();
  },
  verifyToken: (req, res, next) => {
    let token = req.query.apiToken;

    if (token) {
      User.findOne({ apiToken: token })
        .then((user) => {
          if (user) next();
          else next(new Error("Invalid API token"));
        })
        .catch((error) => {
          next(new Error(error.message));
        });
    } else next(new Error("Invalid API token"));
  },
};
