const jwt = require("jsonwebtoken");
const User = require("../models/user");

const checkUser = (req, res, next) => {
  const token = req.cookies.jwt

  if (!token) {
    return res.status(401).json({ status: false, message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.locals.user = decoded; 
    next();
  } catch (err) {
    return res.status(401).json({ status: false, message: "Invalid or expired token" });
  }
};

const requireAdmin = (req, res, next) => {
  if (!res.locals.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  const isAdmin = res.locals.user.isAdmin;

  if (!isAdmin) {
    return res.status(403).json({ message: "Admin access required" });
  }

  next();
};

const requireMemberOrAdmin = async (req, res, next) => {
  const u = res.locals.user;
  if (!u?.id) return res.status(401).json({ message: "Not authenticated" });

  try {
    const dbUser = await User.findById(u.id).select("isAdmin isMember").lean();
    if (!dbUser) return res.status(401).json({ message: "User not found" });

    // Optionally cache for downstream middlewares/handlers
    res.locals.user.isAdmin = !!dbUser.isAdmin;
    res.locals.user.isMember = !!dbUser.isMember;

    if (dbUser.isAdmin || dbUser.isMember) return next();
    return res.status(403).json({ message: "Members/Admins only" });
  } catch (err) {
    console.error("requireMemberOrAdmin error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};


const hasOffer = async (req, res, next) => {
  try {
    const user = await User.findById(res.locals.user.id).select("hasOffer");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.hasOffer) {
      return res.status(403).json({ message: "User does not have offer." });
    }

    next();
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = { checkUser, requireAdmin, hasOffer, requireMemberOrAdmin };
