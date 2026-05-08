const express = require("express");
const router = express.Router();

const cinemaController = require("../cinema/cinemaController");
const authMiddleware = require("../../middlewares/authMiddleware");
const requireAdmin = require("../../middlewares/requireAdmin");


router.get("/", cinemaController.getAllCinemas);
router.get("/:id", cinemaController.getCinemaById);
router.post("/", authMiddleware, requireAdmin, cinemaController.createCinema);
router.put("/:id", authMiddleware, requireAdmin, cinemaController.updateCinema);
router.delete("/:id", authMiddleware, requireAdmin, cinemaController.deleteCinema);

module.exports = router;
