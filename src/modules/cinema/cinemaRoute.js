const express = require("express");
const router = express.Router();

const cinemaController = require("../cinema/cinemaController");
const authMiddleware = require("../../middlewares/authMiddleware");

router.get("/cinemas", cinemaController.getAllCinemas);
router.get("/cinemas/:id", cinemaController.getCinemaById);
router.post("/cinemas", authMiddleware, cinemaController.createCinema);
router.put("/cinemas/:id", authMiddleware, cinemaController.updateCinema);
router.delete("/cinemas/:id", authMiddleware, cinemaController.deleteCinema);

module.exports = router;

