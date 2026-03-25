const express = require("express");
const router = express.Router();

const roomController = require("../room/roomController");
const authMiddleware = require("../../middlewares/authMiddleware");

router.get("/rooms", roomController.getAllRooms);
router.get("/rooms/:id", roomController.getRoomById);
router.post("/rooms", authMiddleware, roomController.createRoom);
router.put("/rooms/:id", authMiddleware, roomController.updateRoom);
router.delete("/rooms/:id", authMiddleware, roomController.deleteRoom);

module.exports = router;