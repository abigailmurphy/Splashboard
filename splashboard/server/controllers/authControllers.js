const User = require("../models/user");
const jwt = require("jsonwebtoken");

const maxAge = 3 * 24 * 60 * 60; // 3 days
const JWT_SECRET = process.env.JWT_SECRET;

const createToken = (user) => {
  return jwt.sign({ id: user._id, isAdmin: user.isAdmin, }, JWT_SECRET, { expiresIn: maxAge });
};

const handleErrors = (err) => {
  let errors = { email: "", password: "" };
  if (err.message === "incorrect email") errors.email = "That email is not registered";
  if (err.message === "incorrect password") errors.password = "That password is incorrect";
  if (err.code === 11000) {
    errors.email = "Email is already registered";
    return errors;
  }
  if (err.message.includes("Users validation failed")) {
    Object.values(err.errors).forEach(({ properties }) => {
      errors[properties.path] = properties.message;
    });
  }
  return errors;
};

module.exports.register = async (req, res) => {
  try {
    const { first, last, email, password, cell } = req.body;

    const user = await User.create({
      name: { first, last },
      email,
      password,
      cell,
    });

    const token = createToken(user);
    res.cookie("jwt", token, {
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
      maxAge: maxAge * 1000,
    });

    res.status(201).json({
      status: true,
      user: {
        id: user._id,
        fullName: user.fullName,
        isAdmin: user.isAdmin,
        isMember: user.isMember,
        hasOffer: user.hasOffer,
        hasApplied: user.appliedMember
      },
    });
  } catch (err) {
    console.error("Registration error:", err);
    const errors = handleErrors(err);
    res.status(400).json({ errors, status: false });
  }
};




module.exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.login(email, password);
    const token = createToken(user);

    res.cookie("jwt", token, {
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
      maxAge: maxAge * 1000,
    });

    res.status(200).json({
      status: true,
      user: {
        id: user._id,
        fullName: user.fullName,
        isAdmin: user.isAdmin,
        isMember: user.isMember,
        hasOffer: user.hasOffer,
        hasApplied: user.appliedMember
      },
    });
  } catch (err) {
    const errors = handleErrors(err);
    res.json({ errors, status: false });
  }
};
// In authControllers.js
module.exports.logout = (req, res) => {
  res.clearCookie("jwt", {
    httpOnly: true,
    sameSite: "Lax",
    secure: false,
  });
  res.status(200).json({ status: true, message: "Logged out" });
};

