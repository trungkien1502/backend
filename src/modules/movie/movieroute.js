const express = require("express");
const router = express.Router();

const movieController = require("../controllers/movieController");
const authMiddleware = require("../../middlewares/authMiddleware");

router.get("/movies", movieController.getAllMovies);
router.get("/movies/:id", movieController.getMovieById);
router.post("/movies", authMiddleware, movieController.createMovie);
router.put("/movies/:id", authMiddleware, movieController.updateMovie);
router.delete("/movies/:id", authMiddleware, movieController.deleteMovie);

module.exports = router;
