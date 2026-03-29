const prisma = require("../../config/prisma");
const bcrypt = require("bcrypt");

exports.getAllSeats = async (query = {}) => {
    const { search } = query;

    return await prisma.seat.findMany({
        where: search
            ? {
                seatNumber: {
                    contains: search,
                },
            }
            : {},
        orderBy: { id: "desc" },
    });
};


exports.getSeatById = async (id) => {
    const seat = await prisma.seat.findUnique({
        where: { id: parseInt(id) }
    });

    if (!seat) {
        throw new Error("Seat not found");
    }
    return seat;
};
exports.createSeat = async ({ roomId, rows, columns }) => {
    const seats = [];

    for (const row of rows) {
        for (let i = 1; i <= columns; i++) {
            seats.push({
                roomId,
                seatNumber: `${row}${i}`
            });
        }
    }

    await prisma.seat.createMany({
        data: seats,
        skipDuplicates: true // tránh trùng
    });
    const result = await prisma.seat.findMany({
        where: {
            roomId,
            seatNumber: {
                in: seats.map(s => s.seatNumber)
            }
        }
    });
    return result;
};
// exports.createSeat = async (data) => {
//     return await prisma.seat.create({
//         data: {
//             seatNumber: data.seatNumber,
//             roomId: data.roomId
//         }
//     });
// };

exports.updateSeat = async (id, data) => {
    const seat = await prisma.seat.findUnique({
        where: { id: parseInt(id) }
    });

    if (!seat) {
        throw new Error("Seat not found");
    }

    return await prisma.seat.update({
        where: { id: parseInt(id) },
        data: {
            seatNumber: data.seatNumber
        }

    });
};

exports.deleteSeat = async (roomId) => {
    const room = await prisma.seat.findMany({
        where: { roomId: Number(roomId) }
    });

    if (!room) {
        throw new Error("no seat found in this room");
    }
    return await prisma.seat.deleteMany({
        where: { roomId: Number(roomId) }
    });
};

exports.getSeatsByRoomId = async (roomId, query = {}) => {
    if (isNaN(roomId)) {
        throw new Error("Invalid roomId");
    }
    const { search } = query;

    return await prisma.seat.findMany({
        where: {
            roomId: Number(roomId),
            ...(search && {
                seatNumber: {
                    contains: search
                }
            })
        },
        orderBy: { id: "desc" }
    });
};

// exports.searchSeats = async (query) => {
//     const { search } = query;

//     return await prisma.seat.findMany({
//         where: search
//             ? {
//                 seatNumber: {
//                     contains: search,
//                 },
//             }
//             : {},
//         orderBy: { id: "desc" },
//     });
// };  