const router = require("express").Router();
const {
  getAppSettings,
  patchWorkingSeason,
  getPublicSettings,
  upsertSeasonSettings,
} = require("../controllers/settingsController");

const { requireAdmin } = require("../controllers/authMiddleware.js");

// returns { workingSeason }
router.get("/", getAppSettings);

// admin: change working season
router.patch("/working-season", requireAdmin, patchWorkingSeason);

// public reader for a season's settings
router.get("/public", getPublicSettings);

// admin writer/upserter for a season
router.put("/admin/:season", requireAdmin, upsertSeasonSettings);

module.exports = router;
