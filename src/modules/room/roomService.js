const prisma = require("../../config/prisma");
const bcrypt = require("bcrypt");

exports.getAllRooms = async (query) => {
    const { search } = query;
    
    return await prisma.room.findMany({
        where: search
            ? {
                name: {
                    contains: search,
                },
            }
            : {},
        orderBy: { createdAt: "desc" },
    });
};

exports.getRoomById = async (id) => {
    const room = await prisma.room.findUnique({
        where: { id: parseInt(id) }
    });
    
    if (!room) {
        throw new Error("Room not found");
    }
    return room;
};

exports.createRoom = async (data) => {
    return await prisma.room.create({
        data: {
            name: data.name,
            capacity: data.capacity
        }
    });
};

exports.updateRoom = async (id, data) => {
    const room = await prisma.room.findUnique({
        where: { id: parseInt(id) }
    });

    if (!room) {
        throw new Error("Room not found");
    }

    return await prisma.room.update({
        where: { id: parseInt(id) },
        data: {
            name: data.name,
            capacity: data.capacity
        }
    });
};

exports.deleteRoom = async (id) => {
    const room = await prisma.room.findUnique({
        where: { id: parseInt(id) }
    });

    if (!room) {
        throw new Error("Room not found");
    }

    return await prisma.room.delete({
        where: { id: parseInt(id) }
    });
};

// exports.getRoomsByCinemaId = async (cinemaId) => {
//     return await prisma.room.findMany({
//         where: {
//             cinemaId: parseInt(cinemaId)
//         },
//         orderBy: { createdAt: "desc" },
//     });
// };

// exports.searchRooms = async (query) => {
//     const { search } = query;
    
//     return await prisma.room.findMany({
//         where: search
//             ? {
//                 name: {
//                     contains: search,
//                 },
//             }
//             : {},
//         orderBy: { createdAt: "desc" },
//     });
// };
