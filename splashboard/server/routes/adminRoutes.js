
const express = require("express");
const { checkUser, requireAdmin } = require("../controllers/authMiddleware");


const {
  // Lists
  getWaitlist,              // GET /admin/waitlist?season=YYYY
  getMembersForSeason,      // GET /admin/members?season=YYYY
  getOfferList,             // GET /admin/offers?season=YYYY
  getReturnOfferList,       //GET /admin/returns

  // Offers
  createOffersFromLastAccepted, // POST /admin/offers/create
  markRecordsOffered,           // POST /admin/offers/mark

  // Members
  removeMembersForSeason,   // POST /admin/members/remove
} = require("../controllers/adminController");

const router = express.Router();


router.get("/waitlist", checkUser, requireAdmin, getWaitlist);
router.get("/members",  checkUser, requireAdmin, getMembersForSeason);
router.get("/offers",   checkUser, requireAdmin, getOfferList);
router.get("/returns", checkUser, requireAdmin, getReturnOfferList);


router.post("/offers/create", checkUser, requireAdmin, createOffersFromLastAccepted);
router.post("/offers/mark",   checkUser, requireAdmin, markRecordsOffered);

router.post("/members/remove", checkUser, requireAdmin, removeMembersForSeason);

router.post("/send-offers", checkUser, requireAdmin, createOffersFromLastAccepted);
router.post("/remove-members", checkUser, requireAdmin, removeMembersForSeason);

router.post("/send-confirmation", checkUser, requireAdmin, createOffersFromLastAccepted);

module.exports = router;
