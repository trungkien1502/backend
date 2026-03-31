const prisma = require("../../config/prisma");
const bcrypt = require("bcrypt");


// 🎯 lấy danh sách ghế
exports.getSeatsByShowtime = async (showtimeId) => {
    const now = new Date();

    // 🔥 clear trước
    await prisma.showtimeSeat.updateMany({
        where: {
            showtimeId: Number(showtimeId),
            status: "HOLD",
            holdUntil: { lt: now }
        },
        data: {
            status: "AVAILABLE",
            holdUntil: null,
            heldBy: null
        }
    });
    return await prisma.showtimeSeat.findMany({
        where: { showtimeId: Number(showtimeId) },
        include: {
            seat: true
        },
        orderBy: { seatId: "asc" }
    });
};

// 🎯 HOLD ghế (giữ ghế 5 phút)
exports.holdSeats = async (showtimeId, seatCodes, userId) => {
    const now = new Date();
    const holdUntil = new Date(now.getTime() + 5 * 60 * 1000);

    return await prisma.$transaction(async (tx) => {

        // 1. lấy room
        const showtime = await tx.showtime.findUnique({
            where: { id: Number(showtimeId) },
            select: { roomId: true }
        });

        if (!showtime) throw new Error("Showtime not found");

        // 2. convert seatNumber → seatId
        const seats = await tx.seat.findMany({
            where: {
                seatNumber: { in: seatCodes },
                roomId: showtime.roomId
            },
            select: { id: true }
        });

        const seatIds = seats.map(s => s.id);

        if (seatIds.length !== seatCodes.length) {
            throw new Error("Some seats not found in this room");
        }

        // 3. update HOLD (atomic)
        const result = await tx.showtimeSeat.updateMany({
            where: {
                showtimeId: Number(showtimeId),
                seatId: { in: seatIds },
                OR: [
                    { status: "AVAILABLE" },
                    { status: "HOLD", holdUntil: { lt: now } }
                ]
            },
            data: {
                status: "HOLD",
                holdUntil,
                heldBy: userId
            }
        });

        // 4. check race condition
        if (result.count !== seatIds.length) {
            throw new Error("Some seats were just taken");
        }

        return { holdUntil };
    });
};


// 🎯 RELEASE ghế
exports.releaseSeats = async (showtimeId, seatCodes, userId) => {
    return await prisma.$transaction(async (tx) => {

        // 1. lấy roomId từ showtime
        const showtime = await tx.showtime.findUnique({
            where: { id: Number(showtimeId) },
            select: { roomId: true }
        });

        if (!showtime) {
            throw new Error("Showtime not found");
        }

        // 2. convert seatCodes → seatIds (đúng phòng)
        const seats = await tx.seat.findMany({
            where: {
                seatNumber: { in: seatCodes },
                roomId: showtime.roomId   // 🔥 FIX QUAN TRỌNG
            },
            select: { id: true }
        });

        const seatIds = seats.map(s => s.id);

        if (seatIds.length !== seatCodes.length) {
            throw new Error("Some seats not found in this room");
        }

        // 3. update
        const result = await tx.showtimeSeat.updateMany({
            where: {
                showtimeId: Number(showtimeId),
                seatId: { in: seatIds },
                status: "HOLD",
                heldBy: userId
            },
            data: {
                status: "AVAILABLE",
                holdUntil: null,
                heldBy: null
            }
        });

        return result;
    });
};