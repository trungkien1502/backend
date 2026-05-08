const express = require("express");
const router = express.Router();

const showtimeController = require("../showtime/showtimeController");
const authMiddleware = require("../../middlewares/authMiddleware");
const requireAdmin = require("../../middlewares/requireAdmin");

router.get("/", showtimeController.getShowtimes);
router.get("/:id", showtimeController.getShowtimeById);
router.post("/", authMiddleware, requireAdmin, showtimeController.createShowtime);
router.put("/:id", authMiddleware, requireAdmin, showtimeController.updateShowtime);
router.delete("/:id", authMiddleware, requireAdmin, showtimeController.deleteShowtime);

module.exports = router;    
