const express = require("express");
const router = express.Router();

const controller = require("./reviewController");
const authMiddleware = require("../../middlewares/authMiddleware");
const requireAdmin = require("../../middlewares/requireAdmin");

router.get("/movie/:movieId", controller.getMovieReviews);
router.get("/me", authMiddleware, controller.getMyReviews);
router.get("/:id", authMiddleware, controller.getReviewById);
router.post("/", authMiddleware, controller.createReview);
router.put("/:id", authMiddleware, controller.updateReview);
router.delete("/:id", authMiddleware, controller.deleteReview);
router.patch("/:id/status", authMiddleware, requireAdmin, controller.updateReviewStatus);

module.exports = router;
