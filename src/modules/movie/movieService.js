const prisma = require("../../config/prisma");

const movieRelationsInclude = {
    people: {
        include: {
            person: true
        }
    },
    genres: {
        include: {
            genre: true
        }
    }
};

const parseMovieId = (id) => {
    const movieId = Number(id);

    if (!Number.isInteger(movieId)) {
        const error = new Error("Invalid movie id");
        error.statusCode = 400;
        throw error;
    }

    return movieId;
};

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
        include: movieRelationsInclude,
        orderBy: { createdAt: "desc" },
    });
};
exports.getMovieNowShowing = async () => {

    return await prisma.movie.findMany({
        where: {
            status: "NOW_SHOWING",
        },
        include: movieRelationsInclude,
        orderBy: { createdAt: "desc" }
    });
};

exports.getMovieComingSoon = async () => {

    return await prisma.movie.findMany({
        where: {
            status: "COMING_SOON",


        },
        include: movieRelationsInclude,
        orderBy: { createdAt: "desc" }
    });
};

exports.getMovieById = async (id) => {
    const movieId = parseMovieId(id);

    const movie = await prisma.movie.findUnique({
        where: { id: movieId },
        include: {
            ...movieRelationsInclude,
            showtimes: true
        }
    });

    if (!movie) {
        const error = new Error("Movie not found");
        error.statusCode = 404;
        throw error;
    }

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
    const movieId = parseMovieId(id);

    const movie = await prisma.movie.findUnique({
        where: { id: movieId }
    });

    if (!movie) {
        const error = new Error("Movie not found");
        error.statusCode = 404;
        throw error;
    }

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
        where: { id: movieId },
        data: updateData
    });
};



exports.deleteMovie = async (id) => {
    const movieId = parseMovieId(id);

    const movie = await prisma.movie.findUnique({
        where: { id: movieId }
    });

    if (!movie) {
        const error = new Error("Movie not found");
        error.statusCode = 404;
        throw error;
    }

    return await prisma.movie.delete({
        where: { id: movieId }
    });
};
