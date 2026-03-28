const prisma = require("../../config/prisma");
const bcrypt = require("bcrypt");

const getAllCinemas = async () => {
    return await prisma.cinema.findMany();
};

const getCinemaById = async (id) => {
    return await prisma.cinema.findUnique({
        where: { id: Number(id) }
    });
};

const createCinema = async (cinemaData) => {
    return await prisma.cinema.create({
        data: cinemaData
    });
};

const updateCinema = async (id, cinemaData) => {
    return await prisma.cinema.update({
        where: { id: Number(id) },
        data: cinemaData
    });
};

const deleteCinema = async (id) => {
    return await prisma.cinema.delete({
        where: { id: Number(id) }
    });
};

module.exports = {
    getAllCinemas,
    getCinemaById,
    createCinema,
    updateCinema,
    deleteCinema
};