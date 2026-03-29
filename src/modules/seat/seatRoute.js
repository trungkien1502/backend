const express = require("express");
const router = express.Router();

const seatController = require("../seat/seatController");


router.get("/", seatController.getAllSeats);
router.get("/:id", seatController.getSeatById);
router.get("/room/:roomId", seatController.getSeatsByRoomId); // get all seat in a room
router.post("/", seatController.createSeat); // create multiple seats with roomId and seatNumber array in body
router.put("/:id", seatController.updateSeat);  // gần như k xài
router.delete("/room/:roomId", seatController.deleteSeat); // delete all seat

module.exports = router;