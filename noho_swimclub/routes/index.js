const router = require("express").Router();

const userRoutes = require("./userRoutes"),
  errorRoutes = require("./errorRoutes"),
  homeRoutes = require("./homeRoutes"),
  anRoutes = require("./announcementRoutes");
  //apiRoutes = require("./apiRoutes");

router.use("/users", userRoutes);
router.use("/announcements", anRoutes);
//router.use("/api", apiRoutes);
router.use("/", homeRoutes);
router.use("/", errorRoutes);

module.exports = router;
