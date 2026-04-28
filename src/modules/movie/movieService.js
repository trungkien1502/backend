const prisma = require("../../config/prisma");

const movieDetailRelationsInclude = {
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

const movieListInclude = {
    genres: {
        include: {
            genre: true
        }
    }
};

const movieDetailInclude = {
    ...movieDetailRelationsInclude
};

const formatMovieListItem = (movie) => ({
    ...movie,
    genres: movie.genres.map((movieGenre) => movieGenre.genre.name)
});

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

    const movies = await prisma.movie.findMany({
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
        include: movieListInclude,
        orderBy: { createdAt: "desc" },
    });

    return movies.map(formatMovieListItem);
};
exports.getMovieNowShowing = async () => {

    const movies = await prisma.movie.findMany({
        where: {
            status: "NOW_SHOWING",
        },
        include: movieListInclude,
        orderBy: { createdAt: "desc" }
    });

    return movies.map(formatMovieListItem);
};

exports.getMovieComingSoon = async () => {

    const movies = await prisma.movie.findMany({
        where: {
            status: "COMING_SOON",


        },
        include: movieListInclude,
        orderBy: { createdAt: "desc" }
    });

    return movies.map(formatMovieListItem);
};

exports.getMovieById = async (id) => {
    const movieId = parseMovieId(id);

    const movie = await prisma.movie.findUnique({
        where: { id: movieId },
        include: {
            ...movieDetailInclude,
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
