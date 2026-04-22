const prisma = require("../../config/prisma");

exports.getAllMovies = async (query) => {
    const { search, status } = query;

    return await prisma.movie.findMany({
        where: {
            ...(search && {
                title: {
                    contains: search,
                    mode: "insensitive"
                }
            }),
            ...(status && {
                status
            })
        },
        orderBy: { createdAt: "desc" },
    });
};
exports.getMovieNowShowing = async () => {

    return await prisma.movie.findMany({
        where: {
            status: "NOW_SHOWING",
        },
        orderBy: { createdAt: "desc" }
    });
};

exports.getMovieComingSoon = async () => {

    return await prisma.movie.findMany({
        where: {
            status: "COMING_SOON",
        },
        orderBy: { createdAt: "desc" }
    });
};

exports.getMovieById = async (id) => {
    const movie = await prisma.movie.findUnique({
        where: { id: parseInt(id) },
        include: {
            cast: true,
            showtimes: true
        }
    });

    if (!movie) throw new Error("Movie not found");

    return movie;
};


exports.createMovie = async (data) => {

    const payload = {
        title: data.title,
        description: data.description,
        duration: data.duration ? Number(data.duration) : null,
        poster: data.poster,
        backdrop: data.backdrop || null,
        rating: data.rating ? Number(data.rating) : null,
        tmdbId: data.tmdbId ? Number(data.tmdbId) : null
    };

    if (data.releaseDate) {
        const date = new Date(data.releaseDate);
        if (isNaN(date)) throw new Error("releaseDate không hợp lệ");
        payload.releaseDate = date;
    }

    if (data.status) {
        payload.status = data.status;
    }

    return await prisma.movie.create({ data: payload });
};


// 🔹 UPDATE MOVIE
exports.updateMovie = async (id, data) => {

    const movie = await prisma.movie.findUnique({
        where: { id: parseInt(id) }
    });

    if (!movie) throw new Error("Movie not found");

    const updateData = {
        ...(data.title && { title: data.title }),
        ...(data.description && { description: data.description }),
        ...(data.rating && { rating: Number(data.rating) }),
        ...(data.poster && { poster: data.poster }),
        ...(data.backdrop && { backdrop: data.backdrop }),
        ...(data.status && { status: data.status })
    };

    if (data.releaseDate) {
        const date = new Date(data.releaseDate);
        if (isNaN(date)) throw new Error("releaseDate không hợp lệ");
        updateData.releaseDate = date;
    }

    return await prisma.movie.update({
        where: { id: parseInt(id) },
        data: updateData
    });
};



exports.deleteMovie = async (id) => {

    const movie = await prisma.movie.findUnique({
        where: { id: parseInt(id) }
    });

    if (!movie) throw new Error("Movie not found");

    return await prisma.movie.delete({
        where: { id: parseInt(id) }
    });
};