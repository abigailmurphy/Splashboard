const { register, login,logout } = require("../controllers/authControllers");
const { checkUser } = require("../controllers/authMiddleware");
const User = require("../models/user");


const router = require("express").Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);


// Session check route

router.get("/check", checkUser, async (req, res) => {
  try {
    // Fetch the latest user info from the database
    const user = await User.findById(res.locals.user.id).select(
      "fullName isAdmin isMember hasOffer appliedMember email"
    );

    if (!user) {
      return res.json({ status: false });
    }

    res.json({
      status: true,
      user: {
        id: user._id,
        fullName: user.fullName,
        isAdmin: user.isAdmin,
        isMember: user.isMember,
        hasOffer: user.hasOffer,
        hasApplied: user.appliedMember,
        email: user.email,
      },
    });
  } catch (err) {
    console.error("Error in /check:", err);
    res.json({ status: false, message: "Server error" });
  }
});

  router.get("/profile", checkUser, async (req, res) => {
    try {
      const user = await User.findById(res.locals.user.id).select("-password");
      res.json({ status: true, profile: user });
    } catch {
      res.json({ status: false });
    }
  });

module.exports = router;
