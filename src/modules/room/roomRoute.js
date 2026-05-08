const express = require("express");
const router = express.Router();

const roomController = require("../room/roomController");
const authMiddleware = require("../../middlewares/authMiddleware");
const requireAdmin = require("../../middlewares/requireAdmin");


router.get("/", roomController.getAllRooms);
router.get("/:id", roomController.getRoomById);
router.post("/", authMiddleware, requireAdmin, roomController.createRoom);
router.put("/:id", authMiddleware, requireAdmin, roomController.updateRoom);
router.delete("/:id", authMiddleware, requireAdmin, roomController.deleteRoom);

module.exports = router;
