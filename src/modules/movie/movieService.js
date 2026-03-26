const prisma = require("../../config/prisma");
const bcrypt = require("bcrypt");

exports.getAllMovies = async (query) => {
    const { search } = query;

    return await prisma.movie.findMany({
        where: search
            ? {
                title: {
                    contains: search,
                },
            }
            : {},
        orderBy: { createdAt: "desc" },
    });
};

exports.getMovieById = async (id) => {
    const movie = await prisma.movie.findUnique({
        where: { id: parseInt(id) }
    });

    if (!movie) {
        throw new Error("Movie not found");
    }
    return movie;
};

exports.createMovie = async (data) => {
    const payload = {
        title: data.title,
        description: data.description,
        duration: Number(data.duration),
        poster: data.poster
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

exports.updateMovie = async (id, data) => {
    const movie = await prisma.movie.findUnique({
        where: { id: parseInt(id) }
    });

    if (!movie) {
        throw new Error("Movie not found");
    }

    return await prisma.movie.update({
        where: { id: parseInt(id) },
        data: {
            title: data.title,
            description: data.description,
            releaseDate: new Date(data.releaseDate),
            rating: data.rating
        }
    });
};

exports.deleteMovie = async (id) => {
    const movie = await prisma.movie.findUnique({
        where: { id: parseInt(id) }
    });

    if (!movie) {
        throw new Error("Movie not found");
    }

    return await prisma.movie.delete({
        where: { id: parseInt(id) }
    });
};

