const prisma = require("../../config/prisma");

const REVIEW_STATUSES = new Set(["PUBLISHED", "HIDDEN"]);

const hasOwn = (object, key) => Object.prototype.hasOwnProperty.call(object, key);

const parseReviewId = (id) => {
    const reviewId = Number(id);

    if (!Number.isInteger(reviewId) || reviewId <= 0) {
        throw new Error("Invalid review id");
    }

    return reviewId;
};

const parseMovieId = (id) => {
    const movieId = Number(id);

    if (!Number.isInteger(movieId) || movieId <= 0) {
        throw new Error("Invalid movie id");
    }

    return movieId;
};

const parseBookingId = (id) => {
    const bookingId = Number(id);

    if (!Number.isInteger(bookingId) || bookingId <= 0) {
        throw new Error("Invalid booking id");
    }

    return bookingId;
};

const parseRating = (rating) => {
    const value = Number(rating);

    if (!Number.isInteger(value) || value < 1 || value > 5) {
        throw new Error("Rating must be an integer from 1 to 5");
    }

    return value;
};

const parseContent = (content) => {
    const value = String(content || "").trim();

    if (!value) {
        throw new Error("Review content is required");
    }

    return value;
};

const parseBoolean = (value) => value === true || value === "true" || value === 1 || value === "1";

const formatReview = (review) => ({
    id: review.id,
    rating: review.rating,
    content: review.content,
    spoiler: review.spoiler,
    status: review.status,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
    user: review.user
        ? {
            id: review.user.id,
            name: review.user.name
        }
        : null,
    movie: review.movie
        ? {
            id: review.movie.id,
            title: review.movie.title,
            poster: review.movie.poster
        }
        : null,
    bookingId: review.bookingId
});

const refreshMovieReviewStats = async (movieId, tx = prisma) => {
    const stats = await tx.movieReview.aggregate({
        where: {
            movieId,
            status: "PUBLISHED"
        },
        _avg: {
            rating: true
        },
        _count: {
            rating: true
        }
    });

    await tx.movie.update({
        where: { id: movieId },
        data: {
            rating: stats._count.rating ? Number(stats._avg.rating) : null,
            reviewCount: stats._count.rating
        }
    });
};

const verifyReviewOwnership = (review, userId, isAdmin) => {
    if (!isAdmin && review.userId !== Number(userId)) {
        throw new Error("You can only manage your own review");
    }
};

exports.getMovieReviews = async (movieId) => {
    const parsedMovieId = parseMovieId(movieId);

    const reviews = await prisma.movieReview.findMany({
        where: {
            movieId: parsedMovieId,
            status: "PUBLISHED"
        },
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            rating: true,
            content: true,
            spoiler: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            bookingId: true,
            user: {
                select: {
                    id: true,
                    name: true
                }
            },
            movie: {
                select: {
                    id: true,
                    title: true,
                    poster: true
                }
            }
        }
    });

    return reviews.map(formatReview);
};

exports.getMyReviews = async (userId) => {
    const reviews = await prisma.movieReview.findMany({
        where: {
            userId: Number(userId)
        },
        orderBy: { createdAt: "desc" },
        select: {
            id: true,
            rating: true,
            content: true,
            spoiler: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            bookingId: true,
            user: {
                select: {
                    id: true,
                    name: true
                }
            },
            movie: {
                select: {
                    id: true,
                    title: true,
                    poster: true
                }
            }
        }
    });

    return reviews.map(formatReview);
};

exports.getReviewById = async (id, userId, isAdmin = false) => {
    const reviewId = parseReviewId(id);

    const review = await prisma.movieReview.findUnique({
        where: { id: reviewId },
        select: {
            id: true,
            userId: true,
            movieId: true,
            bookingId: true,
            rating: true,
            content: true,
            spoiler: true,
            status: true,
            createdAt: true,
            updatedAt: true,
            user: {
                select: {
                    id: true,
                    name: true
                }
            },
            movie: {
                select: {
                    id: true,
                    title: true,
                    poster: true
                }
            }
        }
    });

    if (!review) {
        return null;
    }

    verifyReviewOwnership(review, userId, isAdmin);

    return formatReview(review);
};

exports.createReview = async ({ userId, bookingId, rating, content, spoiler = false }) => {
    const parsedUserId = Number(userId);
    const parsedBookingId = parseBookingId(bookingId);
    const parsedRating = parseRating(rating);
    const parsedContent = parseContent(content);
    const parsedSpoiler = parseBoolean(spoiler);

    return await prisma.$transaction(async (tx) => {
        const booking = await tx.booking.findUnique({
            where: { id: parsedBookingId },
            select: {
                id: true,
                userId: true,
                status: true,
                showtime: {
                    select: {
                        movieId: true,
                        endTime: true
                    }
                },
                reviews: {
                    select: {
                        id: true
                    }
                }
            }
        });

        if (!booking) {
            throw new Error("Booking not found");
        }

        if (booking.userId !== parsedUserId) {
            throw new Error("You can only review your own booking");
        }

        if (booking.status !== "CONFIRMED") {
            throw new Error("Booking is not eligible for review");
        }

        if (new Date() < new Date(booking.showtime.endTime)) {
            throw new Error("You can only review after the showtime has ended");
        }

        if (booking.reviews.length > 0) {
            throw new Error("Review already exists for this booking");
        }

        const review = await tx.movieReview.create({
            data: {
                userId: parsedUserId,
                movieId: booking.showtime.movieId,
                bookingId: booking.id,
                rating: parsedRating,
                content: parsedContent,
                spoiler: parsedSpoiler,
                status: "PUBLISHED"
            },
            select: {
                id: true,
                rating: true,
                content: true,
                spoiler: true,
                status: true,
                createdAt: true,
                updatedAt: true,
                bookingId: true,
                user: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                movie: {
                    select: {
                        id: true,
                        title: true,
                        poster: true
                    }
                }
            }
        });

        await refreshMovieReviewStats(booking.showtime.movieId, tx);

        return formatReview(review);
    });
};

exports.updateReview = async (id, userId, data, isAdmin = false) => {
    const reviewId = parseReviewId(id);

    return await prisma.$transaction(async (tx) => {
        const review = await tx.movieReview.findUnique({
            where: { id: reviewId },
            select: {
                id: true,
                userId: true,
                movieId: true,
                bookingId: true,
                rating: true,
                content: true,
                spoiler: true,
                status: true
            }
        });

        if (!review) {
            throw new Error("Review not found");
        }

        verifyReviewOwnership(review, userId, isAdmin);

        const updateData = {};

        if (hasOwn(data, "rating")) {
            updateData.rating = parseRating(data.rating);
        }

        if (hasOwn(data, "content")) {
            updateData.content = parseContent(data.content);
        }

        if (hasOwn(data, "spoiler")) {
            updateData.spoiler = parseBoolean(data.spoiler);
        }

        if (!Object.keys(updateData).length) {
            throw new Error("No fields to update");
        }

        const updated = await tx.movieReview.update({
            where: { id: reviewId },
            data: updateData,
            select: {
                id: true,
                rating: true,
                content: true,
                spoiler: true,
                status: true,
                createdAt: true,
                updatedAt: true,
                bookingId: true,
                user: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                movie: {
                    select: {
                        id: true,
                        title: true,
                        poster: true
                    }
                }
            }
        });

        await refreshMovieReviewStats(review.movieId, tx);

        return formatReview(updated);
    });
};

exports.deleteReview = async (id, userId, isAdmin = false) => {
    const reviewId = parseReviewId(id);

    return await prisma.$transaction(async (tx) => {
        const review = await tx.movieReview.findUnique({
            where: { id: reviewId },
            select: {
                id: true,
                userId: true,
                movieId: true
            }
        });

        if (!review) {
            throw new Error("Review not found");
        }

        verifyReviewOwnership(review, userId, isAdmin);

        await tx.movieReview.delete({
            where: { id: reviewId }
        });

        await refreshMovieReviewStats(review.movieId, tx);

        return { message: "Review deleted successfully" };
    });
};

exports.updateReviewStatus = async (id, status) => {
    const reviewId = parseReviewId(id);
    const normalizedStatus = String(status || "").toUpperCase();

    if (!REVIEW_STATUSES.has(normalizedStatus)) {
        throw new Error("Invalid review status");
    }

    return await prisma.$transaction(async (tx) => {
        const review = await tx.movieReview.findUnique({
            where: { id: reviewId },
            select: {
                id: true,
                movieId: true
            }
        });

        if (!review) {
            throw new Error("Review not found");
        }

        const updated = await tx.movieReview.update({
            where: { id: reviewId },
            data: {
                status: normalizedStatus
            },
            select: {
                id: true,
                rating: true,
                content: true,
                spoiler: true,
                status: true,
                createdAt: true,
                updatedAt: true,
                bookingId: true,
                user: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                movie: {
                    select: {
                        id: true,
                        title: true,
                        poster: true
                    }
                }
            }
        });

        await refreshMovieReviewStats(review.movieId, tx);

        return formatReview(updated);
    });
};
