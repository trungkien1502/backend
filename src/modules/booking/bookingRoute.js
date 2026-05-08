const express = require("express");
const router = express.Router();
const controller = require("./bookingController");
const authMiddleware = require("../../middlewares/authMiddleware");
const requireAdmin = require("../../middlewares/requireAdmin");

router.get("/", authMiddleware, requireAdmin, controller.getAllBookings);
router.post("/", controller.createBooking);
router.get("/user/:userId", controller.getBookingsByUser);
router.get("/:id", controller.getBookingById);
router.post("/:id/cancel", authMiddleware, requireAdmin, controller.cancelBooking);

module.exports = router;
