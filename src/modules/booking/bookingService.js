const prisma = require("../../config/prisma");

exports.createBooking = async ({ userId, showtimeId, seatIds }) => {
    return await prisma.$transaction(async (tx) => {

        // 1. lấy showtimeSeat
        const seats = await tx.showtimeSeat.findMany({
            where: {
                showtimeId: Number(showtimeId),
                seatId: { in: seatIds }
            }
        });

        if (seats.length !== seatIds.length) {
            throw new Error("Seat not found");
        }

        const now = new Date();

        // 2. check HOLD
        for (const seat of seats) {
            if (seat.status !== "HOLD") {
                throw new Error(`Seat ${seat.seatId} chưa HOLD`);
            }

            if (!seat.holdUntil || seat.holdUntil < now) {
                throw new Error(`Seat ${seat.seatId} hết thời gian giữ`);
            }
        }

        // 3. lấy giá
        const showtime = await tx.showtime.findUnique({
            where: { id: Number(showtimeId) }
        });

        if (!showtime) throw new Error("Showtime not found");

        const totalPrice = Number(showtime.price) * seatIds.length;

        // 4. tạo booking
        const booking = await tx.booking.create({
            data: {
                userId: Number(userId),
                showtimeId: Number(showtimeId),
                totalPrice,
                status: "CONFIRMED"
            }
        });

        // 5. tạo bookingSeat
        await tx.bookingSeat.createMany({
            data: seats.map(seat => ({
                bookingId: booking.id,
                showtimeSeatId: seat.id
            }))
        });

        // 6. update ghế → BOOKED
        await tx.showtimeSeat.updateMany({
            where: {
                id: { in: seats.map(s => s.id) }
            },
            data: {
                status: "BOOKED",
                holdUntil: null
            }
        });

        return booking;
    });
};

exports.getBookingById = async (id) => {
    const booking = await prisma.booking.findUnique({
        where: { id: Number(id) },
        include: {
            showtime: true,
            bookingSeats: {
                include: {
                    showtimeSeat: {
                        include: {
                            seat: true
                        }
                    }
                }
            }
        }
    });

    if (!booking) throw new Error("Not found");

    return booking;
};

exports.cancelBooking = async (id) => {
    return await prisma.$transaction(async (tx) => {

        const booking = await tx.booking.findUnique({
            where: { id: Number(id) },
            include: { bookingSeats: true }
        });

        if (!booking) throw new Error("Booking not found");

        // 1. update booking
        await tx.booking.update({
            where: { id: booking.id },
            data: { status: "CANCELLED" }
        });

        // 2. trả ghế về AVAILABLE
        const showtimeSeatIds = booking.bookingSeats.map(b => b.showtimeSeatId);

        await tx.showtimeSeat.updateMany({
            where: { id: { in: showtimeSeatIds } },
            data: {
                status: "AVAILABLE",
                holdUntil: null
            }
        });

        return true;
    });
};