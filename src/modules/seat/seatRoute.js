const express = require("express");
const router = express.Router();

const seatController = require("../seat/seatController");
const authMiddleware = require("../../middlewares/authMiddleware");
const requireAdmin = require("../../middlewares/requireAdmin");


router.get("/", seatController.getAllSeats);
router.get("/:id", seatController.getSeatById);
router.get("/room/:roomId", seatController.getSeatsByRoomId); // get all seat in a room
router.post("/", authMiddleware, requireAdmin, seatController.createSeat); // create multiple seats with roomId and seatNumber array in body
router.put("/:id", authMiddleware, requireAdmin, seatController.updateSeat);  // gần như k xài
router.delete("/room/:roomId", authMiddleware, requireAdmin, seatController.deleteSeat); // delete all seat

module.exports = router;
