// routes/userRouter.js
const express = require("express");
const { 
    getUser, 
    updateUser, 
    deleteUser, 
    applyMembership,
    
    renewMembership,
    getMyMembership,
    getWizardInit } = require("../controllers/usersController");
const { checkUser, hasOffer } = require("../controllers/authMiddleware");

const router = express.Router();

// Get current user info
router.get("/", checkUser, getUser);

// Update user profile
router.put("/:id", checkUser, updateUser);

// Delete user (e.g., leave waitlist)
router.delete("/:id", checkUser, deleteUser);



router.post("/applyMembership", checkUser, applyMembership);
router.get("/record", checkUser, getMyMembership);
router.get("/init", checkUser, getWizardInit);


router.post("/renew-membership", checkUser, hasOffer, renewMembership);

module.exports = router;
