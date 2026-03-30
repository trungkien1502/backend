
// router.get("/", showtimeseatController.getAllShowtimeSeats);
// router.get("/:id", showtimeseatController.getShowtimeSeatById);
// router.post("/", showtimeseatController.createShowtimeSeat);
// router.put("/:id", showtimeseatController.updateShowtimeSeat);
// router.delete("/:id", showtimeseatController.deleteShowtimeSeat);

const express = require("express");
const router = express.Router();
const showtimeseatController = require("../showtimeseat/showtimeseatController");

// 🎯 lấy danh sách ghế theo showtime
router.get("/:showtimeId", showtimeseatController.getSeatsByShowtime);

// 🎯 giữ ghế
router.post("/hold", showtimeseatController.holdSeats);

// // 🎯 confirm booking (đặt ghế)
// router.post("/book", showtimeseatController.bookSeats);

// 🎯 release ghế (optional)
router.post("/release", showtimeseatController.releaseSeats);

module.exports = router;