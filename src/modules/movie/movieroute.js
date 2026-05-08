const express = require("express");
const router = express.Router();

const movieController = require("./movieController");
const authMiddleware = require("../../middlewares/authMiddleware");
const requireAdmin = require("../../middlewares/requireAdmin");

router.get("/", movieController.getAllMovies);
router.get("/now_showing", movieController.getMovieNowShowing);
router.get("/coming_soon", movieController.getMovieComingSoon);
router.get("/:id", movieController.getMovieById);
router.post("/", authMiddleware, requireAdmin, movieController.createMovie);
router.put("/:id", authMiddleware, requireAdmin, movieController.updateMovie);
router.delete("/:id", authMiddleware, requireAdmin, movieController.deleteMovie);

module.exports = router;
