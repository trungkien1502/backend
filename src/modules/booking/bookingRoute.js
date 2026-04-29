const express = require("express");
const router = express.Router();
const controller = require("./bookingController");

router.get("/", controller.getAllBookings);
router.post("/", controller.createBooking);
router.get("/user/:userId", controller.getBookingsByUser);
router.get("/:id", controller.getBookingById);
router.post("/:id/cancel", controller.cancelBooking);

module.exports = router;
