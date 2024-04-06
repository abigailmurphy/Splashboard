const router = require("express").Router();
const homeController = require("../controllers/homeController");

router.get("/", homeController.respondHome);
router.get("/contact", homeController.respondContact);
router.get('/css/style.css', homeController.serveCss);
router.get('/images/:imageName', homeController.serveImage);
//router.get("/chat", homeController.chat);

module.exports = router;