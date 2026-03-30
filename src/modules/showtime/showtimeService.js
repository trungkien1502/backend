const prisma = require("../../config/prisma");
const bcrypt = require("bcrypt");

// exports.getAllShowtime = async (query = {}) => {
//     return await prisma.showtime.findMany({
//         orderBy: { id: "desc" }
//     });
// };

exports.getShowtimeById = async (id) => { //get theo id showtime
    const showtime = await prisma.showtime.findUnique({
        where: { id: parseInt(id) }
    });

    if (!showtime) {
        throw new Error("Showtime not found");
    }
    return showtime;
};
exports.getShowtimes = async ({ movieId, cinemaId, date }) => { // get showtime theo movieId, cinemaId và date 
    const where = {};

    if (movieId) where.movieId = Number(movieId);

    if (cinemaId) {
        where.room = {
            cinemaId: Number(cinemaId)
        };
    }

    if (date) {
        const start = new Date(date);
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);

        where.startTime = {
            gte: start,
            lte: end
        };
    }

    return await prisma.showtime.findMany({
        where,
        include: {
            movie: true,
            room: {
                include: {
                    cinema: true
                }
            }
        },
        orderBy: { startTime: "asc" }
    });
};

// exports.createShowtime = async (data) => {
//     return await prisma.showtime.create({
//         data: {
//             startTime: new Date(data.startTime),
//             endTime: new Date(data.endTime),
//             movieId: data.movieId,
//             roomId: data.roomId,
//             price: data.price
//         }
//     });
// };
exports.createShowtime = async (data) => {
    return await prisma.$transaction(async (tx) => {
        // 🔥 validate cơ bản
        if (!data.startTime || !data.endTime) {
            throw new Error("Missing time");
        }
        if (new Date(data.startTime) >= new Date(data.endTime)) {
            throw new Error("Invalid time range");
        }
        // 🔥 check trùng lịch phòng (CỰC QUAN TRỌNG)
        const conflict = await tx.showtime.findFirst({
            where: {
                roomId: data.roomId,
                AND: [
                    { startTime: { lt: new Date(data.endTime) } },
                    { endTime: { gt: new Date(data.startTime) } }
                ]
            }
        });
        if (conflict) {
            throw new Error("Showtime bị trùng lịch phòng");
        }
        // 1. tạo showtime
        const showtime = await tx.showtime.create({
            data: {
                startTime: new Date(data.startTime),
                endTime: new Date(data.endTime),
                movieId: data.movieId,
                roomId: data.roomId,
                price: data.price
            }
        });
        // 2. lấy seat
        const seats = await tx.seat.findMany({
            where: { roomId: data.roomId },
            select: { id: true }
        });
        // 🔥 tránh crash nếu chưa có ghế
        if (seats.length === 0) {
            throw new Error("Room chưa có seat");
        }
        // 3. tạo showtimeSeat
        await tx.showtimeSeat.createMany({
            data: seats.map(seat => ({
                showtimeId: showtime.id,
                seatId: seat.id,
                status: "AVAILABLE"
            }))
        });
        return showtime;
    });
};

exports.updateShowtime = async (id, data) => {
    return await prisma.showtime.update({
        where: { id: Number(id) },
        data: {
            startTime: new Date(data.startTime),
            endTime: new Date(data.endTime),
            movieId: data.movieId,
            roomId: data.roomId,
            price: data.price
        }
    });
};


exports.deleteShowtime = async (id) => {
    const showtimeId = Number(id);

    // 1. check có booking không
    const hasBooking = await prisma.booking.findFirst({
        where: { showtimeId }
    });

    if (hasBooking) {
        throw new Error("Không thể xoá showtime đã có người đặt vé");
    }
    // 2. xoá showtimeSeat trước
    await prisma.showtimeSeat.deleteMany({
        where: { showtimeId }
    });

    // 3. xoá showtime
    return await prisma.showtime.delete({
        where: { id: showtimeId }
    });
};

// exports.getShowtimesByMovieId = async (movieId) => {
//     return await prisma.showtime.findMany({
//         where: {
//             movieId: Number(movieId)
//         },
//         orderBy: { startTime: "asc" }
//     });
// };

// exports.getShowtimesByRoomId = async (roomId) => {
//     return await prisma.showtime.findMany({
//         where: {
//             roomId: Number(roomId)
//         },
//         orderBy: { startTime: "asc" }
//     });
// };




