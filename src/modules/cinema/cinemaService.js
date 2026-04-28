const prisma = require("../../config/prisma");

const toCinemaId = (id) => {
    const cinemaId = Number(id);

    if (!Number.isInteger(cinemaId) || cinemaId <= 0) {
        throw new Error("Invalid cinema id");
    }

    return cinemaId;
};

const getAllCinemas = async () => {
    return await prisma.cinema.findMany();
};

const getCinemaById = async (id) => {
    return await prisma.cinema.findUnique({
        where: { id: toCinemaId(id) }
    });
};

const createCinema = async (cinemaData) => {
    return await prisma.cinema.create({
        data: cinemaData
    });
};

const updateCinema = async (id, cinemaData) => {
    return await prisma.cinema.update({
        where: { id: toCinemaId(id) },
        data: cinemaData
    });
};

const deleteCinema = async (id) => {
    return await prisma.cinema.delete({
        where: { id: toCinemaId(id) }
    });
};

module.exports = {
    getAllCinemas,
    getCinemaById,
    createCinema,
    updateCinema,
    deleteCinema
};
