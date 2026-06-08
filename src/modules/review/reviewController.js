const reviewService = require("./reviewService");

exports.getMovieReviews = async (req, res) => {
    try {
        const data = await reviewService.getMovieReviews(req.params.movieId);
        res.json({ data });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getMyReviews = async (req, res) => {
    try {
        const data = await reviewService.getMyReviews(req.userId);
        res.json({ data });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getReviewById = async (req, res) => {
    try {
        const data = await reviewService.getReviewById(req.params.id, req.userId, req.userRole === "ADMIN");

        if (!data) {
            return res.status(404).json({ message: "Review not found" });
        }

        res.json({ data });
    } catch (error) {
        const status = error.message === "Review not found" ? 404 : 403;
        res.status(status).json({ message: error.message });
    }
};

exports.createReview = async (req, res) => {
    try {
        const data = await reviewService.createReview({
            userId: req.userId,
            bookingId: req.body.bookingId,
            rating: req.body.rating,
            content: req.body.content,
            spoiler: req.body.spoiler
        });

        res.status(201).json({
            message: "Review created successfully",
            data
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.updateReview = async (req, res) => {
    try {
        const data = await reviewService.updateReview(
            req.params.id,
            req.userId,
            req.body,
            req.userRole === "ADMIN"
        );

        res.json({
            message: "Review updated successfully",
            data
        });
    } catch (error) {
        const status = error.message === "Review not found" ? 404 : 400;
        res.status(status).json({ message: error.message });
    }
};

exports.deleteReview = async (req, res) => {
    try {
        const data = await reviewService.deleteReview(
            req.params.id,
            req.userId,
            req.userRole === "ADMIN"
        );

        res.json(data);
    } catch (error) {
        const status = error.message === "Review not found" ? 404 : 400;
        res.status(status).json({ message: error.message });
    }
};

exports.updateReviewStatus = async (req, res) => {
    try {
        const data = await reviewService.updateReviewStatus(req.params.id, req.body.status);
        res.json({
            message: "Review status updated successfully",
            data
        });
    } catch (error) {
        const status = error.message === "Review not found" ? 404 : 400;
        res.status(status).json({ message: error.message });
    }
};
