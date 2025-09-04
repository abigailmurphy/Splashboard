// routes/membershipRoutes.js
const express = require("express");
const router = express.Router();
const { checkUser } = require("../controllers/authMiddleware");

const {
  getActiveMembership,
  withdrawMembership,
  acceptOffer,
  declineOffer,
} = require("../controllers/membershipController");

// One page data source (+ actions)
router.get("/active", checkUser, getActiveMembership);
router.post("/withdraw", checkUser, withdrawMembership);
router.post("/offer/accept", checkUser, acceptOffer);
router.post("/offer/decline", checkUser, declineOffer);

module.exports = router;
