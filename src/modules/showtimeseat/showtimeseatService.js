const prisma = require("../../config/prisma");
const bcrypt = require("bcrypt");


// 🎯 lấy danh sách ghế
exports.getSeatsByShowtime = async (showtimeId) => {
    return await prisma.showtimeSeat.findMany({
        where: { showtimeId: Number(showtimeId) },
        include: {
            seat: true
        },
        orderBy: { seatId: "asc" }
    });
};

// 🎯 HOLD ghế (giữ ghế 5 phút)
exports.holdSeats = async (showtimeId, seatIds) => {
    const now = new Date();
    const holdUntil = new Date(now.getTime() + 5 * 60 * 1000);

    return await prisma.$transaction(async (tx) => {
        const seats = await tx.showtimeSeat.findMany({
            where: {
                showtimeId: Number(showtimeId),
                seatId: { in: seatIds }
            }
        });

        // ❗ check trạng thái
        for (const seat of seats) {
            if (seat.status === "BOOKED") {
                throw new Error(`Seat ${seat.seatId} already booked`);
            }

            if (seat.status === "HOLD" && seat.holdUntil > now) {
                throw new Error(`Seat ${seat.seatId} is being held`);
            }
        }

        // update HOLD
        await tx.showtimeSeat.updateMany({
            where: {
                showtimeId: Number(showtimeId),
                seatId: { in: seatIds }
            },
            data: {
                status: "HOLD",
                holdUntil
            }
        });

        return { holdUntil };
    });
};

// 🎯 BOOK ghế
exports.bookSeats = async (showtimeId, seatIds) => {
    return await prisma.$transaction(async (tx) => {
        const seats = await tx.showtimeSeat.findMany({
            where: {
                showtimeId: Number(showtimeId),
                seatId: { in: seatIds }
            }
        });

        for (const seat of seats) {
            if (seat.status !== "HOLD") {
                throw new Error(`Seat ${seat.seatId} must be held first`);
            }
        }

        await tx.showtimeSeat.updateMany({
            where: {
                showtimeId: Number(showtimeId),
                seatId: { in: seatIds }
            },
            data: {
                status: "BOOKED",
                holdUntil: null
            }
        });

        return true;
    });
};

// 🎯 RELEASE ghế
exports.releaseSeats = async (showtimeId, seatIds) => {
    return await prisma.showtimeSeat.updateMany({
        where: {
            showtimeId: Number(showtimeId),
            seatId: { in: seatIds }
        },
        data: {
            status: "AVAILABLE",
            holdUntil: null
        }
    });
};