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
exports.holdSeats = async (showtimeId, seatIds, userId) => {
    const now = new Date();
    const holdUntil = new Date(now.getTime() + 5 * 60 * 1000);

    return await prisma.$transaction(async (tx) => {

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

        if (result.count !== seatIds.length) {
            throw new Error("Some seats were just taken");
        }

        return { holdUntil };
    });
};

// 🎯 RELEASE ghế
exports.releaseSeats = async (showtimeId, seatIds, userId) => {
    return await prisma.$transaction(async (tx) => {

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