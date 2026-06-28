const prisma = require("../../config/prisma");
const { throwRelatedDataError } = require("../../utils/deleteGuard");

const parseRoomId = (id) => {
    const roomId = Number(id);

    if (!Number.isInteger(roomId) || roomId <= 0) {
        throw new Error("Invalid room id");
    }

    return roomId;
};

const parseRoomPayload = (data) => {
    const payload = {};

    if (data.name !== undefined) {
        payload.name = data.name;
    }

    if (data.totalSeats !== undefined) {
        const totalSeats = Number(data.totalSeats);

        if (!Number.isInteger(totalSeats) || totalSeats <= 0) {
            throw new Error("Invalid totalSeats");
        }

        payload.totalSeats = totalSeats;
    }

    if (data.cinemaId !== undefined) {
        const cinemaId = Number(data.cinemaId);

        if (!Number.isInteger(cinemaId) || cinemaId <= 0) {
            throw new Error("Invalid cinema id");
        }

        payload.cinemaId = cinemaId;
    }

    return payload;
};
    
exports.getAllRooms = async (query) => {
    const { search, cinemaId } = query;
    
    return await prisma.room.findMany({
        where: {
            ...(search && {
                name: {
                    contains: search
                }
            }),
            ...(cinemaId && {
                cinemaId: Number(cinemaId)
            })
        },
        include: {
            cinema: true,
            _count: {
                select: {
                    seats: true,
                    showtimes: true
                }
            }
        },
        orderBy: { id: "desc" }
    });
};

exports.getRoomById = async (id) => {
    const roomId = parseRoomId(id);

    const room = await prisma.room.findUnique({
        where: { id: roomId },
        include: {
            cinema: true,
            _count: {
                select: {
                    seats: true,
                    showtimes: true
                }
            }
        }
    });
    
    if (!room) {
        const error = new Error("Room not found");
        error.statusCode = 404;
        throw error;
    }
    return room;
};

exports.createRoom = async (data) => {
    const payload = parseRoomPayload(data);

    if (!payload.name || !payload.cinemaId || !payload.totalSeats) {
        throw new Error("name, cinemaId and totalSeats are required");
    }

    return await prisma.room.create({
        data: payload,
        include: {
            cinema: true,
            _count: {
                select: {
                    seats: true,
                    showtimes: true
                }
            }
        }
    });
};

exports.updateRoom = async (id, data) => {
    const roomId = parseRoomId(id);

    const room = await prisma.room.findUnique({
        where: { id: roomId }
    });

    if (!room) {
        throw new Error("Room not found");
    }

    const payload = parseRoomPayload(data);

    if (Object.keys(payload).length === 0) {
        throw new Error("No valid room fields to update");
    }

    return await prisma.room.update({
        where: { id: roomId },
        data: payload,
        include: {
            cinema: true,
            _count: {
                select: {
                    seats: true,
                    showtimes: true
                }
            }
        }
    });
};

exports.deleteRoom = async (id) => {
    const roomId = parseRoomId(id);

    const room = await prisma.room.findUnique({
        where: { id: roomId }
    });

    if (!room) {
        throw new Error("Room not found");
    }

    const [seatCount, showtimeCount] = await Promise.all([
        prisma.seat.count({ where: { roomId } }),
        prisma.showtime.count({ where: { roomId } })
    ]);

    if (seatCount > 0 || showtimeCount > 0) {
        throwRelatedDataError();
    }

    await prisma.room.delete({
        where: { id: roomId }
    });

    return { message: "Xóa thành công" };
};

// exports.getRoomsByCinemaId = async (cinemaId) => {
//     return await prisma.room.findMany({
//         where: {
//             cinemaId: Number(cinemaId)
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
