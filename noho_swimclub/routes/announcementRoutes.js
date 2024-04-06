const router = require("express").Router();
const announcementController = require("../controllers/announcementController");

router.get("/", announcementController.index, announcementController.indexView);

router.get("/new", announcementController.new);
router.post(
  "/create",
  announcementController.validate,
  announcementController.create,
  announcementController.redirectView
);

router.get("/:id/edit", announcementController.edit);
router.put(
  "/:id/update",
  announcementController.update,
  announcementController.redirectView
);
router.delete(
  "/:id/delete",
  announcementController.delete,
  announcementController.redirectView
);
module.exports = router;