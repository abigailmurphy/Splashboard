const router = require("express").Router();
const usersController = require("../controllers/usersController");
router.get("/membership", usersController.membership);
router.get("/login", usersController.login);
router.post("/login", usersController.authenticate);
router.get("/logout", usersController.logout, usersController.redirectView);
router.get("/", usersController.index, usersController.indexView);
router.get('/profile', usersController.profile);
router.get("/waitlist", usersController.index, usersController.waitlistView);
router.get("/new", usersController.new);

router.post(
  "/create",
  usersController.validate,
  usersController.create,
  usersController.redirectView
);
router.get("/thankyou", usersController.thankyou);
router.get("/:id", usersController.show, usersController.showView);
router.get("/:id/edit", usersController.edit);
router.put("/:id/update", usersController.update, usersController.redirectView);
router.delete(
  "/:id/delete",
  usersController.delete,
  usersController.redirectView
);
router.get('/:id/offer', usersController.offer, usersController.redirectView);
router.get('/:id/accept', usersController.accept, usersController.redirectView);
module.exports = router;

