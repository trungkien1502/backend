const express = require("express");
const router = express.Router();

const authController = require("../controllers/authController");
const authMiddleware = require("../../middlewares/authMiddleware");



router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/me", authMiddleware, authController.getCurrentUser);
router.post("/changepassword", authMiddleware, authController.changePassword);
router.post("/forgotpassword", authController.forgotPassword);
router.post("/resetpassword", authController.resetPassword);
//router.post("/verifyotp", authController.verifyOTP);


//admin db
// router.delete("/",);

module.exports = router;