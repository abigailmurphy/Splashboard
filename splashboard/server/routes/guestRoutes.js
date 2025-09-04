const router = require("express").Router();
const { checkUser, requireAdmin,requireMemberOrAdmin  } = require("../controllers/authMiddleware");


const C = require("../controllers/guestController");

router.use(checkUser);
router.use(requireMemberOrAdmin);


router.get("/availability", C.getAvailability);
router.get("/mine",         C.getMySignups);
router.get("/day/:day",     C.getDaySignups);
router.put("/signup",       C.upsertSignup);
router.patch("/capacity-season", requireAdmin, C.setSeasonCapacity);

module.exports = router;
